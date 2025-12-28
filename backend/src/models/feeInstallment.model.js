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

    // 🔹 Installment label
    installmentName: {
      type: String,
      required: true,
      trim: true,
      // Apr, May, Q1, Annual
    },

    // 🔹 Amounts
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

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

    status: {
      type: String,
      enum: ["pending", "partial", "paid", "late"],
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
