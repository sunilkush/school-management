import mongoose, { Schema } from "mongoose";

const payrollEntrySchema = new Schema(
  {
    payrollCycleId: {
      type: Schema.Types.ObjectId,
      ref: "PayrollCycle",
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    workingDays: { type: Number, required: true, min: 0 },
    presentDays: { type: Number, required: true, min: 0 },
    paidLeaves: { type: Number, required: true, min: 0 },
    lopDays: { type: Number, required: true, min: 0 },
    earningsBreakdown: { type: Schema.Types.Mixed, default: {} },
    deductionsBreakdown: { type: Schema.Types.Mixed, default: {} },
    grossEarnings: { type: Number, required: true, min: 0 },
    totalDeductions: { type: Number, required: true, min: 0 },
    netPay: { type: Number, required: true },
    warnings: [{ type: String }],
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date, default: null },
    transactionRef: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

payrollEntrySchema.index({ payrollCycleId: 1, employeeId: 1 }, { unique: true });

export const PayrollEntry = mongoose.model("PayrollEntry", payrollEntrySchema);
