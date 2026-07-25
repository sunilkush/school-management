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
    // Employer's own PF/ESI cost for this entry — informational, not part of net pay.
    employerContributions: { type: Schema.Types.Mixed, default: {} },
    // Snapshot of the statutory IDs at the time of this cycle, so PF/ESI returns for a past
    // month stay correct even if the employee's UAN/ESIC number is corrected/updated later.
    statutorySnapshot: {
      uan: { type: String, default: null },
      esicNumber: { type: String, default: null },
    },
    // Set when an admin manually overrides the computed PF/ESI for this specific entry
    // (e.g. a mid-month correction) instead of accepting the engine's calculated value.
    manualOverride: {
      pf: { type: Number, default: null },
      esi: { type: Number, default: null },
      reason: { type: String, trim: true, default: null },
      overriddenBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      overriddenAt: { type: Date, default: null },
    },
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
    paymentMode: {
      type: String,
      enum: ["bank", "cash", "upi", "cheque", "other"],
      default: null,
    },
    paidAt: { type: Date, default: null },
    transactionRef: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

payrollEntrySchema.index({ payrollCycleId: 1, employeeId: 1 }, { unique: true });

// PF/ESI statutory reports and payment-status filtered listings query on this pair.
payrollEntrySchema.index({ schoolId: 1, paymentStatus: 1 });

export const PayrollEntry = mongoose.model("PayrollEntry", payrollEntrySchema);
