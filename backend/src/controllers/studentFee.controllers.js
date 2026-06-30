import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
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
    schoolId,
  } = req.body;


  // ✅ Required validation
  if (!feeStructureId || !academicYearId || !schoolId) {
    throw new ApiError(400, "feeStructureId, academicYearId and schoolId are required");
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

  feeRecord.lastPayment = {
    amount,
    paymentMode: paymentMode || "cash",
    referenceNo: referenceNo || "",
    remarks: remarks || "",
    paidAt: new Date(),
    collectedBy: req.user?._id || null,
  };

  await feeRecord.save();

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
