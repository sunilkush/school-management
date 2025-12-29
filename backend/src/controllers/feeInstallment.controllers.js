import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

/* =====================================================
   ✅ AUTO GENERATE INSTALLMENTS
===================================================== */
export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  // 🔹 Fetch student fee with fee structure
  const studentFee = await StudentFee.findOne({ studentId })
    .populate("feeStructureId", "frequency");

  if (!studentFee) {
    throw new ApiError(404, "Student fee not found");
  }

  const {
    totalAmount,
    schoolId,
    academicYearId,
    _id: studentFeeId,
    feeStructureId,
  } = studentFee;

  const frequency = feeStructureId?.frequency;

  if (!frequency) {
    throw new ApiError(400, "Fee frequency not defined");
  }

  // ❌ Duplicate check
  const exists = await FeeInstallment.findOne({ studentFeeId });
  if (exists) {
    throw new ApiError(400, "Installments already generated");
  }

  let installments = [];
  let baseDate = new Date();

  /* ================= MONTHLY ================= */
  if (frequency === "monthly") {
    const amount = Number((totalAmount / 12).toFixed(2));

    for (let i = 0; i < 12; i++) {
      installments.push({
        schoolId,
        academicYearId,
        studentId,
        studentFeeId,
        installmentName: baseDate.toLocaleString("default", {
          month: "short",
        }),
        amount,
        dueDate: new Date(baseDate),
      });

      baseDate.setMonth(baseDate.getMonth() + 1);
    }
  }

  /* ================= QUARTERLY ================= */
  else if (frequency === "quarterly") {
    const amount = Number((totalAmount / 4).toFixed(2));

    for (let i = 1; i <= 4; i++) {
      installments.push({
        schoolId,
        academicYearId,
        studentId,
        studentFeeId,
        installmentName: `Q${i}`,
        amount,
        dueDate: new Date(baseDate),
      });

      baseDate.setMonth(baseDate.getMonth() + 3);
    }
  }

  /* ================= YEARLY ================= */
  else if (frequency === "yearly") {
    installments.push({
      schoolId,
      academicYearId,
      studentId,
      studentFeeId,
      installmentName: "Yearly",
      amount: totalAmount,
      dueDate: baseDate,
    });
  } else {
    throw new ApiError(400, "Invalid fee frequency");
  }

  await FeeInstallment.insertMany(installments);

  return res.status(201).json(
    new ApiResponse(201, installments, "Installments generated successfully")
  );
});


export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.query;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid or missing studentId");
  }

  const installments = await FeeInstallment.find({ studentId })
    .populate("studentFeeId", "totalAmount paidAmount dueAmount status")
    .populate("academicYearId", "name startDate endDate")
    .sort({ dueDate: 1 });

  return res.status(200).json(
    new ApiResponse(200, installments, "Fee installments fetched successfully")
  );
});