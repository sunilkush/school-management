import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS (Single / Bulk)
   (School Admin)
=====================================================*/
export const assignFeesToStudents = asyncHandler(async (req, res) => {
  const {
    feeStructureId,
    studentId,
    studentIds,
    academicYearId,
    schoolId,
    customAmount,
  } = req.body;

  if (!feeStructureId || !academicYearId || !schoolId) {
    throw new ApiError(
      400,
      "feeStructureId, academicYearId and schoolId are required"
    );
  }

  // 🎯 Normalize students (single → array)
  let students = [];

  if (Array.isArray(studentIds) && studentIds.length) {
    students = studentIds;
  } else if (studentId) {
    students = [studentId];
  }

  if (!students.length) {
    throw new ApiError(400, "studentId or studentIds required");
  }

  const feeStructure = await FeeStructure.findById(feeStructureId);
  if (!feeStructure) throw new ApiError(404, "Fee structure not found");

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

  // 🔒 ordered:false → duplicates skip, baki insert ho jayenge
  await StudentFee.insertMany(records, { ordered: false });

  return res.json(
    new ApiResponse(
      201,
      { assignedCount: records.length },
      "Fees assigned successfully"
    )
  );
});


/* =====================================================
   ✅ STUDENT FEES LIST (Student + Parent)
=====================================================*/ 
export const getMyFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // ✅ ObjectId validation
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const fees = await StudentFee.find({ studentId }) // ✅ FIX HERE
    .populate("feeStructureId", "name amount")
    .populate("academicYearId", "name")
    .sort({ createdAt: -1 });

  console.log("fees data:", fees);

  return res.status(200).json(
    new ApiResponse(200, fees, "Fees fetched successfully")
  );
});

/* =====================================================
   ✅ PAY FEES (Partial / Full)
=====================================================*/
export const payStudentFee = asyncHandler(async (req, res) => {
  const { paidAmount } = req.body;

  if (!paidAmount || paidAmount <= 0) {
    throw new ApiError(400, "Valid paidAmount required");
  }

  const feeRecord = await StudentFee.findById(req.params.id);
  if (!feeRecord) throw new ApiError(404, "Fee record not found");

  feeRecord.paidAmount += paidAmount;

  await feeRecord.save(); // status & due auto handled by schema middleware

  return res.json(
    new ApiResponse(200, feeRecord, "Fee payment successful")
  );
});

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD (School Admin)
=====================================================*/
export const studentFeeSummary = asyncHandler(async (req, res) => {
  const summary = await StudentFee.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(req.user.schoolId),
      },
    },
    {
      $group: {
        _id: "$status",
        totalCollected: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
        studentsCount: { $sum: 1 },
      },
    },
  ]);

  return res.json(new ApiResponse(200, summary));
});
