import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const assignFeesToStudents = asyncHandler(async (req, res) => {
  const { feeStructureId, studentId, studentIds, academicYearId, customAmount,schoolId
 } = req.body;
 

  if (!feeStructureId || !academicYearId) {
    throw new ApiError(400, "feeStructureId and academicYearId are required");
  }

  let students = [];
  if (Array.isArray(studentIds) && studentIds.length) students = studentIds;
  else if (studentId) students = [studentId];
  if (!students.length) throw new ApiError(400, "studentId or studentIds required");

  const feeStructure = await FeeStructure.findOne({feeStructureId, schoolId });
  console.log("feeStructure", feeStructure);
  if (!feeStructure) throw new ApiError(404, "Fee structure not found for this school");
   
  const totalAmount = customAmount ?? feeStructure.amount;

  const records = students.map((sid) => ({
    schoolId,
    academicYearId,
    studentId: sid,
    feeStructureId,
    customAmount: customAmount ?? null,
    totalAmount,
    paidAmount: 0,
    dueAmount: totalAmount,
    status: "pending",
    assignedBy: req.user._id,
  }));

  await StudentFee.insertMany(records, { ordered: false });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Fees assigned successfully",
    data: { assignedCount: records.length },
  });
});

export const getMyFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student ID");

  const role = req.userRole?.name;
  if (["Student", "Parent"].includes(role) && req.user._id.toString() !== studentId) {
    throw new ApiError(403, "Forbidden");
  }

  const filter = {
    studentId,
    schoolId: req.user.schoolId,
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [fees, total] = await Promise.all([
    StudentFee.find(filter)
      .populate({
        path: "feeStructureId",
        select: "name amount feeHeadId",
        populate: { path: "feeHeadId", select: "name" },
      })
      .populate("academicYearId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    StudentFee.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Fees fetched successfully",
    data: fees,
    meta: { page: Number(page), total },
  });
});

export const payStudentFee = asyncHandler(async (req, res) => {
  const { paidAmount } = req.body;

  if (!paidAmount || paidAmount <= 0) throw new ApiError(400, "Valid paidAmount required");

  const feeRecord = await StudentFee.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!feeRecord) throw new ApiError(404, "Fee record not found");

  feeRecord.paidAmount += paidAmount;
  await feeRecord.save();

  return sendSuccess(res, {
    message: "Fee payment successful",
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
