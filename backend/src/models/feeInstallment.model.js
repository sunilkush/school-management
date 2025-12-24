import mongoose from "mongoose";

const feeInstallmentSchema = new mongoose.Schema(
  {
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
      index: true,
    },

    installmentName: {
      type: String,
      required: true,
      trim: true,
      // examples: Apr, May, Q1, First Installment
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "late"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Prevent duplicate installments for same StudentFee
 * Example: "Apr" installment should not repeat
 */
feeInstallmentSchema.index(
  { studentFeeId: 1, installmentName: 1 },
  { unique: true }
);

/**
 * Auto-mark late installments
 */
feeInstallmentSchema.pre("save", function (next) {
  if (
    this.status === "pending" &&
    this.dueDate < new Date()
  ) {
    this.status = "late";
  }
  next();
});

export const FeeInstallment = mongoose.model(
  "FeeInstallment",
  feeInstallmentSchema
);
