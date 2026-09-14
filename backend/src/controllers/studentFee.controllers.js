import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { actingRoleName } from "../utils/actingRole.js";
import { generateSchedules, periodsPerYear, refreshInstallments, summarizeFeeLines } from "../services/feeSchedule.service.js";

export const assignFeesToStudents = asyncHandler(async (req, res) => {
  const {
    feeStructureId,
    studentId,
    studentIds,
    academicYearId,
    customAmount,
  } = req.body;

  // schoolId is deliberately NOT read from req.body — this route is reachable by School
  // Admin/Accountant (not Super Admin only, see studentFee.routes.js), and trusting a
  // client-supplied schoolId let one school's admin assign fees into another school's books.
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;

  // ✅ Required validation
  if (!schoolId || !feeStructureId || !academicYearId) {
    throw new ApiError(400, "feeStructureId and academicYearId are required");
  }
   for (const [key, value] of Object.entries({ feeStructureId, academicYearId, schoolId })) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new ApiError(400, `Invalid ${key}`);
    }
  }
  // ✅ Normalize students array
  let students = [];
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    students = studentIds;
  } else if (studentId) {
    students = [studentId];
  }

  if (!students.length) {
    throw new ApiError(400, "studentId or studentIds required");
  }
   if (students.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ApiError(400, "Invalid studentId in selection");
  }

  // ✅ Remove duplicate studentIds
  students = [...new Set(students)];

  // ✅ Only assign fees to students who actually belong to the caller's school — otherwise a
  // studentId belonging to a different school could be passed through and end up cross-linked
  // into this school's fee records.
  const ownStudents = await Student.find({ _id: { $in: students }, schoolId }).select("_id");
  const ownStudentIds = new Set(ownStudents.map((s) => s._id.toString()));
  students = students.filter((sid) => ownStudentIds.has(sid.toString()));

  if (!students.length) {
    throw new ApiError(404, "None of the selected students belong to this school");
  }

  // ✅ Validate Fee Structure
  const feeStructure = await FeeStructure.findOne({
    _id: feeStructureId,
    schoolId,
  });

  if (!feeStructure) {
    throw new ApiError(404, "Fee structure not found for this school");
  }

  const academicYear = await AcademicYear.findOne({ _id: academicYearId, schoolId }).select("startDate endDate").lean();
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found for this school");
  }

  // ✅ Amount validation — the structure (or customAmount) is the charge for one period, so the
  // student's year fee is that × the number of periods: ₹2,000 monthly → ₹24,000.
  const hasCustomAmount = customAmount !== undefined && customAmount !== null;
  const perPeriodAmount = hasCustomAmount ? Number(customAmount) : Number(feeStructure.amount);

  if (isNaN(perPeriodAmount) || perPeriodAmount < 0) {
    throw new ApiError(400, "Invalid amount");
  }
  const flatTotalAmount = Number((perPeriodAmount * periodsPerYear(feeStructure.frequency)).toFixed(2));

  // ✅ Auto-apply each student's admission-time discount (StudentEnrollment.feeDiscount, a
  // percentage) unless the admin explicitly overrode the amount via customAmount — an explicit
  // override always wins outright, same as it did before discounts existed here.
  let discountByStudent = new Map();
  if (!hasCustomAmount) {
    const enrollments = await StudentEnrollment.find({
      studentId: { $in: students },
      schoolId,
      academicYearId,
      feeDiscount: { $gt: 0 },
    }).select("studentId feeDiscount");
    discountByStudent = new Map(
      enrollments.map((e) => [e.studentId.toString(), Number(e.feeDiscount) || 0])
    );
  }

  // ✅ Prevent duplicate assignment (IMPORTANT)
  const existingFees = await StudentFee.find({
    studentId: { $in: students },
    feeStructureId,
    academicYearId,
    schoolId,
  }).select("studentId");

  const alreadyAssignedIds = new Set(
    existingFees.map((f) => f.studentId.toString())
  );

  const newStudents = students.filter(
    (sid) => !alreadyAssignedIds.has(sid.toString())
  );

  if (!newStudents.length) {
    throw new ApiError(400, "Fees already assigned to all selected students");
  }

  // ✅ Prepare records — apply each student's own discount percentage (if any) to the flat
  // structure amount; an explicit customAmount bypasses this entirely.
  const records = newStudents.map((sid) => {
    const discountPercent = discountByStudent.get(sid.toString()) || 0;
    const totalAmount = discountPercent
      ? Number((flatTotalAmount * (1 - discountPercent / 100)).toFixed(2))
      : flatTotalAmount;

    return {
      schoolId,
      academicYearId,
      studentId: sid,
      feeStructureId,
      customAmount: customAmount ?? null,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: "pending",
      assignedBy: req.user?._id || null,
      discountApplied: discountPercent
        ? { percent: discountPercent, amount: Number((flatTotalAmount - totalAmount).toFixed(2)) }
        : undefined,
    };
  });

  // ✅ Insert the fee records and their dated installment schedule together — a fee with no
  // schedule could not be paid or go overdue, so neither is kept without the other.
  const session = await mongoose.startSession();
  let installmentCount = 0;
  try {
    await session.withTransaction(async () => {
      const created = await StudentFee.insertMany(records, { session });
      installmentCount = await generateSchedules({
        studentFees: created,
        academicYear,
        schoolId,
        frequencyByStructureId: new Map([[String(feeStructure._id), feeStructure.frequency]]),
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: "Fees assigned successfully",
    data: {
      assignedCount: records.length,
      installmentCount,
      frequency: feeStructure.frequency,
      perPeriodAmount,
      yearlyAmount: flatTotalAmount,
      skipped: students.length - records.length,
      discounted: records
        .filter((r) => r.discountApplied)
        .map((r) => ({ studentId: r.studentId, discountApplied: r.discountApplied })),
    },
  });
});

/**
 * POST /student-fees/assign/preview — what assigning these fee structures will charge, before
 * anything is saved. Body: { feeStructureIds: [], customAmounts: { [feeStructureId]: amount } }.
 *
 * The assign screen shows exactly these figures; it does no arithmetic of its own. A student's
 * own concession (StudentEnrollment.feeDiscount) is applied on top when the fee is actually
 * assigned, and the assign response reports it.
 */
export const previewFeeAssignment = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  const { feeStructureIds = [], customAmounts = {} } = req.body || {};

  const ids = [...new Set((Array.isArray(feeStructureIds) ? feeStructureIds : []).map(String))];
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new ApiError(400, "Invalid feeStructureId in selection");
  }

  const structures = ids.length
    ? await FeeStructure.find({ _id: { $in: ids }, schoolId }).populate("feeHeadId", "name").lean()
    : [];
  const byId = new Map(structures.map((s) => [String(s._id), s]));

  const lines = ids
    .filter((id) => byId.has(id))
    .map((id) => {
      const s = byId.get(id);
      const custom = customAmounts?.[id];
      const hasCustom = custom !== undefined && custom !== null && custom !== "" && !Number.isNaN(Number(custom));
      if (hasCustom && Number(custom) < 0) throw new ApiError(400, "Custom amount cannot be negative");
      return {
        feeStructureId: s._id,
        feeHeadName: s.feeHeadId?.name || "Fee",
        frequency: s.frequency,
        listAmount: s.amount,
        isCustom: hasCustom,
        perPeriodAmount: hasCustom ? Number(custom) : s.amount,
      };
    });

  const summary = summarizeFeeLines(lines);
  const { yearlyTotal: listYearlyTotal } = summarizeFeeLines(lines.map((l) => ({ ...l, perPeriodAmount: l.listAmount })));

  return sendSuccess(res, {
    message: "Fee assignment preview",
    data: { ...summary, listYearlyTotal },
  });
});

// The roles GET /my and /my/:studentId admit (STUDENT_PARENT in routes/studentFee.routes.js),
// broadest first.
const MY_FEES_ROLES = ["School Admin", "Accountant", "Student", "Parent"];

export const getMyFees = asyncHandler(async (req, res) => {
  let studentId = req.params.studentId || req.query.studentId;
  const academicYearId = req.params.academicYearId || req.query.academicYearId;

  const schoolId = req.user?.schoolId || req.user?.school?._id;
  const userId = req.user?._id;
  // From every role held, not the primary one: the route admits additional roles, so a Teacher
  // holding "Parent" as an additional role got in as a Parent — and a primary-role check read
  // "teacher", ran neither ownership test below, and returned any student's fees.
  const role = actingRoleName(req.user, MY_FEES_ROLES)?.toLowerCase();
  if (!role) throw new ApiError(403, "Forbidden. Insufficient role access.");

  // ✅ Validate IDs
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "School not found");
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(401, "Unauthorized user");
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  // ✅ Normalize
  const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
  const userObjectId   = new mongoose.Types.ObjectId(userId);
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  // ✅ Student Role — verify caller owns this student record
  if (role === "student") {
    const student = await Student.findOne({
      _id: studentObjectId,
      userId: userObjectId,
      schoolId: schoolObjectId,
      isActive: true,
    }).select("_id");

    if (!student) {
      throw new ApiError(403, "Access denied: student record does not belong to this user");
    }
  }

  // ✅ Parent Validation — verify child is linked to this parent
  if (role === "parent") {
    const child = await Student.findOne({
      _id: studentObjectId,
      schoolId: schoolObjectId,
      isActive: true,
      $or: [
        { fatherId: userObjectId },
        { motherId: userObjectId },
        { guardianId: userObjectId },
      ],
    }).select("_id");

    if (!child) {
      throw new ApiError(403, "This student is not linked with this parent");
    }
  }

  // ✅ Filter
  const filter = {
    studentId: studentObjectId,
    schoolId: schoolObjectId,
  };

  if (academicYearId) {
    if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
      throw new ApiError(400, "Invalid academicYearId");
    }
    filter.academicYearId = new mongoose.Types.ObjectId(academicYearId);
  }

  // Late fines and overdue status move with the calendar, not with writes — bring this student's
  // up to date so the totals below are today's.
  await refreshInstallments({
    schoolId: schoolObjectId,
    studentId: studentObjectId,
    academicYearId: filter.academicYearId || null,
  });

  const fees = await StudentFee.find(filter)
    .populate({
      path: "feeStructureId",
      select: "name amount frequency feeHeadId",
      populate: {
        path: "feeHeadId",
        select: "name",
      },
    })
    .populate("academicYearId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Fees fetched successfully",
    data: fees,
  });
});
export const studentFeeSummary = asyncHandler(async (req, res) => {
  const summary = await StudentFee.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) } },
    {
      $group: {
        _id: "$status",
        totalCollected: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
        studentsCount: { $sum: 1 },
      },
    },
  ]);

  return sendSuccess(res, { data: summary, message: "Student fee summary fetched" });
});
