import mongoose from "mongoose";
import { StudentFee } from "../models/studentFee.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { Discount } from "../models/discount.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";

/**
 * Apply discount on given amount
 * @param {Number} amount
 * @param {Object|null} discount
 */
export const applyDiscount = (amount, discount) => {
  if (!discount) return amount;

  if (discount.type === "percentage") {
    return Math.max(amount - (amount * discount.value) / 100, 0);
  }

  if (discount.type === "flat") {
    return Math.max(amount - discount.value, 0);
  }

  return amount;
};

/**
 * Calculate late fine for an installment
 * (Can be rule-based in future)
 * @param {Object} installment
 */
export const calculateLateFine = (installment) => {
  if (!installment || installment.status !== "late") return 0;

  const today = new Date();
  const dueDate = new Date(installment.dueDate);

  const diffDays = Math.ceil(
    (today - dueDate) / (1000 * 60 * 60 * 24)
  );

  // 🔧 configurable rule (future-ready)
  const finePerDay = 10; // ₹10 per day
  return diffDays > 0 ? diffDays * finePerDay : 0;
};

/**
 * Calculate total fee for a student for a session
 * Includes discount & late fine
 * @param {String} studentId
 * @param {String} sessionId
 */
export const calculateTotalFee = async (studentId, sessionId) => {
  const studentFees = await StudentFee.find({ studentId })
    .populate({
      path: "feeStructureId",
      match: { sessionId: new mongoose.Types.ObjectId(sessionId) },
      populate: { path: "feeHeadId" },
    })
    .populate("discountId");

  let total = 0;
  let lateFineTotal = 0;

  for (const sf of studentFees) {
    if (!sf.feeStructureId) continue;

    // Base amount
    let amount =
      sf.customAmount ??
      sf.feeStructureId.amount;

    // Apply discount (if fee head applicable)
    const discount = sf.discountId;
    if (
      discount &&
      (
        discount.applicableFeeHeads.length === 0 ||
        discount.applicableFeeHeads.includes(
          sf.feeStructureId.feeHeadId._id
        )
      )
    ) {
      amount = applyDiscount(amount, discount);
    }

    total += amount;

    // Late fine per installment
    const installments = await FeeInstallment.find({
      studentFeeId: sf._id,
    });

    for (const inst of installments) {
      lateFineTotal += calculateLateFine(inst);
    }
  }

  return {
    totalFee: total,
    lateFine: lateFineTotal,
    grandTotal: total + lateFineTotal,
  };
};
