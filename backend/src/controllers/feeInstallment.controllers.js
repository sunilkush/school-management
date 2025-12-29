import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ GENERATE INSTALLMENTS (Monthly | Quarterly | Yearly)
===================================================== */
export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentId, frequency } = req.body;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  if (!["monthly", "quarterly", "yearly"].includes(frequency)) {
    throw new ApiError(400, "Frequency must be monthly | quarterly | yearly");
  }

  const studentFees = await StudentFee.find({ studentId });

  if (!studentFees.length) {
    throw new ApiError(404, "No fee records found for this student");
  }

  let allInstallments = [];

  for (const fee of studentFees) {
    const exists = await FeeInstallment.findOne({
      studentFeeId: fee._id,
    });

    if (exists) continue;

    let baseDate = new Date();
    let count = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : 1;
    let gap = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
    let amount = Number((fee.totalAmount / count).toFixed(2));

    for (let i = 1; i <= count; i++) {
      allInstallments.push({
        schoolId: fee.schoolId,
        academicYearId: fee.academicYearId,
        studentId,
        studentFeeId: fee._id,
        installmentType: frequency,
        installmentName:
          frequency === "monthly"
            ? baseDate.toLocaleString("default", { month: "short" })
            : frequency === "quarterly"
            ? `Q${i}`
            : "Yearly",
        amount,
        dueDate: new Date(baseDate),
      });

      baseDate.setMonth(baseDate.getMonth() + gap);
    }
  }

  if (!allInstallments.length) {
    throw new ApiError(400, "Installments already generated");
  }

  await FeeInstallment.insertMany(allInstallments);

  res.status(201).json(
    new ApiResponse(
      201,
      allInstallments,
      `Installments (${frequency}) generated successfully`
    )
  );
});

/* =====================================================
   ✅ GET INSTALLMENTS + FEE HEAD NAMES (FIXED)
===================================================== */
export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.query;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  const installments = await FeeInstallment.find({ studentId })
    .populate({
      path: "studentFeeId",
      select: "totalAmount paidAmount dueAmount status feeStructureId",
    })
    .populate("academicYearId", "name")
    .sort({ dueDate: 1 })
    .lean();

  /* ================= ADD FEE HEAD NAME ================= */
  for (const inst of installments) {
    if (inst.studentFeeId?.feeStructureId) {
      const structure = await FeeStructure.findById(
        inst.studentFeeId.feeStructureId
      )
        .populate("feeHeadId", "name")
        .lean();

      if (structure) {
        inst.feeHead = {
          name: structure.feeHeadId?.name || "-",
          amount: structure.amount,
        };
      } else {
        inst.feeHead = null;
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, installments, "Installments fetched successfully")
  );
});
/* =====================================================
   💳 PAY INSTALLMENT (Cash / Online / Razorpay)
===================================================== */
export const payInstallment = asyncHandler(async (req, res) => {
  const { installmentId } = req.params;
  const { amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(installmentId)) {
    throw new ApiError(400, "Invalid installment ID");
  }

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  /* ================= FIND INSTALLMENT ================= */
  const installment = await FeeInstallment.findById(installmentId);

  if (!installment) {
    throw new ApiError(404, "Installment not found");
  }

  const remaining = installment.amount - installment.paidAmount;

  if (amount > remaining) {
    throw new ApiError(400, `Remaining amount is ₹${remaining}`);
  }

  /* ================= UPDATE INSTALLMENT ================= */
  installment.paidAmount += amount;
  installment.status =
    installment.paidAmount >= installment.amount ? "paid" : "partial";

  await installment.save();
  const studentFeeId = installment.studentFeeId;
  /* ================= UPDATE STUDENT FEE (CORRECT WAY) ================= */
  const studentFee = await StudentFee.findByIdAndUpdate(
    studentFeeId,
    {
      $inc: {
        paidAmount: amount,
        dueAmount: -amount,
      },
    },
    { new: true }
  );

  if (!studentFee) {
    throw new ApiError(404, "Student fee not found");
  }

  /* ================= FINAL STATUS FIX ================= */
  if (studentFee.dueAmount <= 0) {
    studentFee.status = "paid";
    studentFee.dueAmount = 0;
  } else {
    studentFee.status = "partial";
  }
console.log('Student Fee after payment:', studentFee);
  await studentFee.save();
   
  /* ================= RESPONSE ================= */
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        installment,
        studentFee,
      },
      "Installment paid & student fee updated successfully"
    )
  );
});
