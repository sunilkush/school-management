import mongoose from "mongoose";

const feeInstallmentSchema = new mongoose.Schema(
  {
    // 🔹 Multi-school support
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // 🔹 Academic year
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    // 🔹 Student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // 🔹 Parent fee
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
      index: true,
    },

    // 🔹 Installment label — "Apr 2026", "Q1 (Apr–Jun)", "Annual", "One-time"
    installmentName: {
      type: String,
      required: true,
      trim: true,
    },

    // Frequency of the fee structure this installment was generated from
    // (monthly/quarterly/half_yearly/yearly/one_time).
    installmentType: {
      type: String,
      trim: true,
    },

    // Position in the year's schedule (0 = first period), so installments of one fee sort in
    // calendar order even when two share a due date.
    periodIndex: {
      type: Number,
      default: 0,
    },

    // 🔹 Amounts
    // The installment's share of the fee, after any discount. Never includes the late fine.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Late fine charged on this installment so far — kept current by refreshInstallments() in
    // services/feeSchedule.service.js from the school's feeSettings.lateFine. Frozen once the
    // installment is paid.
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Everything received against this installment: base amount first, then fine.
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    // pending = unpaid and not yet due · partial = something paid, not late · overdue = past its
    // due date with money still owed · paid = amount + fine fully received.
    // "late" is what older records used for overdue; refreshInstallments() rewrites it.
    status: {
      type: String,
      enum: ["pending", "partial", "overdue", "paid", "late"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 🔒 Prevent duplicate installment per StudentFee
 */
feeInstallmentSchema.index(
  { studentFeeId: 1, installmentName: 1 },
  { unique: true }
);

export const FeeInstallment = mongoose.model(
  "FeeInstallment",
  feeInstallmentSchema
);
