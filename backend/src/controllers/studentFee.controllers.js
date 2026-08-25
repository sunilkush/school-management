import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
import { Payment } from "../models/payment.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

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

  // ✅ Amount validation
  const totalAmount =
    customAmount !== undefined && customAmount !== null
      ? Number(customAmount)
      : Number(feeStructure.amount);

  if (isNaN(totalAmount) || totalAmount < 0) {
    throw new ApiError(400, "Invalid amount");
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

  // ✅ Prepare records
  const records = newStudents.map((sid) => ({
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
  }));

  // ✅ Insert safely
  await StudentFee.insertMany(records, { ordered: false });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Fees assigned successfully",
    data: {
      assignedCount: records.length,
      skipped: students.length - records.length,
    },
  });
});

export const getMyFees = asyncHandler(async (req, res) => {
  let studentId = req.params.studentId || req.query.studentId;
  const academicYearId = req.params.academicYearId || req.query.academicYearId;

  const schoolId = req.user?.schoolId || req.user?.school?._id;
  const userId = req.user?._id;
  const role = req.user?.roleId?.name?.toLowerCase();

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

  const fees = await StudentFee.find(filter)
    .populate({
      path: "feeStructureId",
      select: "name amount feeHeadId",
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
export const payStudentFee = asyncHandler(async (req, res) => {
  const { paidAmount, paymentMode, referenceNo, remarks } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid fee record id");
  }

  const amount = Number(paidAmount);

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Valid paidAmount required");
  }

  const feeRecord = await StudentFee.findOne({
    _id: id,
    schoolId: req.user.schoolId,
  });

  if (!feeRecord) {
    throw new ApiError(404, "Fee record not found");
  }

  // 🔒 Ownership check — Student/Parent may only pay their own (or their linked child's) fee
  // record. Without this, any authenticated Student/Parent in the school could pay — or mark
  // fully paid via cash, no gateway involved — any other family's fee record just by guessing its
  // _id. Mirrors the same check getMyFees already does correctly above.
  const role = req.user?.roleId?.name?.toLowerCase();
  if (role === "student") {
    const owns = await Student.exists({
      _id: feeRecord.studentId,
      userId: req.user._id,
      schoolId: req.user.schoolId,
    });
    if (!owns) throw new ApiError(403, "Access denied: this fee record does not belong to you");
  } else if (role === "parent") {
    const owns = await Student.exists({
      _id: feeRecord.studentId,
      schoolId: req.user.schoolId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    });
    if (!owns) throw new ApiError(403, "This student is not linked with this parent");
  }

  if (feeRecord.status === "paid" || Number(feeRecord.dueAmount) <= 0) {
    throw new ApiError(400, "Fee already paid");
  }

  if (amount > Number(feeRecord.dueAmount)) {
    throw new ApiError(400, "paidAmount cannot exceed dueAmount");
  }

  const newPaidAmount = Number(feeRecord.paidAmount || 0) + amount;
  const newDueAmount = Math.max(Number(feeRecord.totalAmount || 0) - newPaidAmount, 0);

  feeRecord.paidAmount = newPaidAmount;
  feeRecord.dueAmount = newDueAmount;

  if (newDueAmount === 0) {
    feeRecord.status = "paid";
  } else if (newPaidAmount > 0) {
    feeRecord.status = "partial";
  } else {
    feeRecord.status = "pending";
  }

  const paidAt = new Date();
  feeRecord.lastPayment = {
    amount,
    paymentMode: paymentMode || "cash",
    referenceNo: referenceNo || "",
    remarks: remarks || "",
    paidAt,
    collectedBy: req.user?._id || null,
  };

  await feeRecord.save();

  // Mirror this into the Payment ledger too — Fee Reports' transaction history,
  // payment-mode breakdown, and collection trend all read from Payment, not
  // StudentFee, so without this an accountant's cash/cheque/UPI collections here
  // would be invisible everywhere except the aggregate paid/due totals.
  await Payment.create({
    schoolId: feeRecord.schoolId,
    studentId: feeRecord.studentId,
    academicYearId: feeRecord.academicYearId,
    studentFeeId: feeRecord._id,
    amountPaid: amount,
    paymentMode: paymentMode || "cash",
    transactionId: referenceNo || null,
    paymentDate: paidAt,
    status: "success",
    receiptNo: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    collectedBy: req.user?._id || null,
  });

  return sendSuccess(res, {
    message:
      feeRecord.status === "paid"
        ? "Fee paid successfully"
        : "Partial fee payment successful",
    data: feeRecord,
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
