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
  const { studentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
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

    const feeStructure = await FeeStructure.findById(fee.feeStructureId)
      .select("frequency")
      .lean();

    const frequency = feeStructure?.frequency;

    if (!["monthly", "quarterly", "yearly"].includes(frequency)) {
      continue;
    }

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
    throw new ApiError(
      400,
      "Installments already generated or fee structure frequency is missing"
    );
  }

  await FeeInstallment.insertMany(allInstallments);

  res.status(201).json(
    new ApiResponse(
      201,
      allInstallments,
      "Installments generated successfully as per fee structure frequency"
    )
  );
});


/* =====================================================
   ✅ GET INSTALLMENTS + FEE HEAD NAMES (FIXED)
===================================================== */
export const getFeeInstallmentsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.query;

  // ✅ Validate
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  // ✅ Fetch installments
  const installments = await FeeInstallment.find({ studentId })
    .populate({
      path: "studentFeeId",
      select: "totalAmount paidAmount dueAmount status feeStructureId",
    })
    .populate("academicYearId", "name")
    .sort({ dueDate: 1 })
    .lean();

  // ================= ADD FEE HEAD NAME =================
  const feeStructureIds = [
    ...new Set(
      installments
        .map((inst) => inst.studentFeeId?.feeStructureId?.toString())
        .filter(Boolean)
    ),
  ];

const structures = await FeeStructure.find({
  _id: { $in: feeStructureIds },
})
  .select("amount feeHeadId")
  .populate("feeHeadId", "name")
  .lean();

  const structureMap = new Map(
    structures.map((structure) => [
      structure._id.toString(),
      structure,
    ])
  );

  // ✅ Attach feeHead data
  for (const inst of installments) {
    const structureId = inst.studentFeeId?.feeStructureId?.toString();

    const structure = structureId
      ? structureMap.get(structureId)
      : null;

    inst.feeHead = structure
      ? {
          name: structure.feeHeadId?.name || "-",
          amount: structure.amount || 0,
        }
      : null;
  }

  // ✅ Response
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
