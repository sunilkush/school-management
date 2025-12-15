import mongoose from "mongoose";
import { StudentFee } from "../models/studentFees.model.js";
import { Fees } from "../models/fees.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ ASSIGN FEES TO STUDENTS
   (School Admin)
=====================================================*/
export const assignFeesToStudents = asyncHandler(async (req, res) => {
  const { feeId, studentIds } = req.body;

  if (!feeId || !studentIds?.length) {
    throw new ApiError(400, "feeId and studentIds are required");
  }

  const fee = await Fees.findById(feeId);

  if (!fee) throw new ApiError(404, "Fee not found");

  const records = studentIds.map((studentId) => ({
    feeId,
    studentId,
    status: "pending",
  }));

  await StudentFee.insertMany(records);

  return res.json(
    new ApiResponse(201, null, "Fees assigned successfully")
  );
});

/* =====================================================
   ✅ STUDENT FEES LIST  (Student + Parent)
=====================================================*/
export const getMyFees = asyncHandler(async (req, res) => {

  const studentId =
    req.user.role === "parent"
      ? req.params.studentId
      : req.user._id;

  const data = await StudentFee.find({ studentId })
    .populate({
      path: "feeId",
      select: "feeName amount dueDate academicYearId",
      populate: {
        path: "academicYearId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, data)
  );
});


/* =====================================================
   ✅ PAY FEES
=====================================================*/
export const payStudentFee = asyncHandler(async (req, res) => {
  const { paymentMethod, transactionId, paidAmount } = req.body;

  if (!paymentMethod || !transactionId || !paidAmount) {
    throw new ApiError(400, "Payment fields required");
  }

  const receipt = await StudentFee.findByIdAndUpdate(
    req.params.id,
    {
      paymentMethod,
      transactionId,
      paidAmount,
      status: "paid",
      paymentDate: new Date(),
    },
    { new: true }
  );

  if (!receipt) throw new ApiError(404, "Fee record not found");

  return res.json(
    new ApiResponse(200, receipt, "Fee Paid Successfully")
  );
});

/* =====================================================
   ✅ FEES SUMMARY DASHBOARD
=====================================================*/
export const studentFeeSummary = asyncHandler(async (req, res) => {
  const summary = await StudentFee.aggregate([
    {
      $lookup: {
        from: "fees",
        localField: "feeId",
        foreignField: "_id",
        as: "fee",
      },
    },
    { $unwind: "$fee" },

    {
      $match: {
        "fee.schoolId": new mongoose.Types.ObjectId(
          req.user.schoolId
        ),
      },
    },

    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$paidAmount" },
        studentsCount: { $sum: 1 },
      },
    },
  ]);

  return res.json(new ApiResponse(200, summary));
});
