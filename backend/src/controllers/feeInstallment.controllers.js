import mongoose from "mongoose";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ GENERATE INSTALLMENTS (Monthly | Quarterly | Yearly)
===================================================== */
export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentId, academicYearId } = req.body;
  const schoolId = req.user?.schoolId || req.user?.school?._id;

  if (!schoolId) {
    throw new ApiError(400, "School not found");
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId");
  }

  const feeFilter = { studentId, schoolId };
  if (academicYearId) feeFilter.academicYearId = academicYearId;

  const studentFees = await StudentFee.find(feeFilter).populate("feeStructureId", "frequency");

  if (!studentFees.length) {
    throw new ApiError(404, "No fee records found for this student");
  }

  const allInstallments = [];

  for (const fee of studentFees) {
    const effectiveAcademicYearId = academicYearId || fee.academicYearId;

    const exists = await FeeInstallment.exists({
      studentFeeId: fee._id,
      schoolId,
      ...(effectiveAcademicYearId ? { academicYearId: effectiveAcademicYearId } : {}),
    });

    if (exists) continue;

    const frequency = fee?.feeStructureId?.frequency || "yearly";

    const count =
      frequency === "monthly" ? 12 :
      frequency === "quarterly" ? 4 :
      frequency === "half_yearly" ? 2 :
      1;

    const gap =
      frequency === "monthly" ? 1 :
      frequency === "quarterly" ? 3 :
      frequency === "half_yearly" ? 6 :
      12;

    const amount = Number((fee.totalAmount / count).toFixed(2));
    const baseDate = new Date();

    for (let i = 1; i <= count; i++) {
      allInstallments.push({
        schoolId,
        academicYearId: effectiveAcademicYearId,
        studentId,
        studentFeeId: fee._id,
        installmentType: frequency,
        installmentName:
          frequency === "monthly"
            ? baseDate.toLocaleString("default", { month: "short" })
            : frequency === "quarterly"
            ? `Q${i}`
            : frequency === "half_yearly"
            ? `H${i}`
            : "Yearly",
        amount,
        paidAmount: 0,
        dueDate: new Date(baseDate),
        status: "pending",
      });

      baseDate.setMonth(baseDate.getMonth() + gap);
    }
  }

  if (!allInstallments.length) {
    throw new ApiError(400, "Installments already generated");
  }

  const created = await FeeInstallment.insertMany(allInstallments);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Installments generated successfully"));
});


/* =====================================================
   ✅ GET INSTALLMENTS + FEE HEAD NAMES (FIXED)
===================================================== */
export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId, academicYearId } = req.query;
  const schoolId = req.user?.schoolId || req.user?.school?._id;

  if (!schoolId) {
    throw new ApiError(400, "School not found");
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId");
  }

  const filter = { studentId, schoolId };
  if (academicYearId) filter.academicYearId = academicYearId;

  const installments = await FeeInstallment.find(filter)
    .populate({
      path: "studentFeeId",
      select: "totalAmount paidAmount dueAmount status feeStructureId",
      populate: {
        path: "feeStructureId",
        select: "amount feeHeadId frequency",
        populate: {
          path: "feeHeadId",
          select: "name",
        },
      },
    })
    .populate("academicYearId", "name")
    .sort({ dueDate: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, installments, "Installments fetched successfully"));
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
  }
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
