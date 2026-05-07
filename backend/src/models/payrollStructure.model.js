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
    pfEnabled: { type: Boolean, default: true },
    esiEnabled: { type: Boolean, default: false },
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
