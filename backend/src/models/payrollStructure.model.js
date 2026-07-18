import mongoose, { Schema } from "mongoose";

const payrollStructureSchema = new Schema(
  {
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
    basic: { type: Number, required: true, min: 0 },
    hra: { type: Number, default: 0, min: 0 },
    da: { type: Number, default: 0, min: 0 },
    conveyance: { type: Number, default: 0, min: 0 },
    medical: { type: Number, default: 0, min: 0 },
    specialAllowance: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    incentive: { type: Number, default: 0, min: 0 },
    deductions: {
      pf: { type: Number, default: 0, min: 0 },
      esi: { type: Number, default: 0, min: 0 },
      professionalTax: { type: Number, default: 0, min: 0 },
      tds: { type: Number, default: 0, min: 0 },
      lateFine: { type: Number, default: 0, min: 0 },
    },
    componentRules: { type: [Schema.Types.Mixed], default: [] },
    grossMonthly: { type: Number, required: true, min: 0 },
    // PF/ESI on/off is *not* configured here any more — it's a single school-wide toggle on
    // PayrollPolicy (Payroll Settings), with per-employee exclusion via
    // Employee.statutoryCompliance.pfCategory/esiCategory === "excluded". This used to be a
    // second, per-structure toggle that duplicated the same on/off decision.
    // Voluntary PF stays here, not on PayrollPolicy — "voluntary" means each employee elects
    // their own extra %, so unlike the on/off switch this genuinely can't be school-wide.
    vpfPercent: { type: Number, default: 0, min: 0, max: 100 },
    professionalTaxEnabled: { type: Boolean, default: false },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "archived"],
      default: "active",
      index: true,
    },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

payrollStructureSchema.index({ schoolId: 1, employeeId: 1, effectiveFrom: -1 });

export const PayrollStructure = mongoose.model("PayrollStructure", payrollStructureSchema);
