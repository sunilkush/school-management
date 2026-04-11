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
    specialAllowance: { type: Number, default: 0, min: 0 },
    grossMonthly: { type: Number, required: true, min: 0 },
    pfEnabled: { type: Boolean, default: true },
    esiEnabled: { type: Boolean, default: false },
    professionalTaxEnabled: { type: Boolean, default: false },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

payrollStructureSchema.index({ schoolId: 1, employeeId: 1, effectiveFrom: -1 });

export const PayrollStructure = mongoose.model("PayrollStructure", payrollStructureSchema);
