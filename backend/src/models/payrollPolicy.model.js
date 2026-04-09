import mongoose, { Schema } from "mongoose";

const payrollPolicySchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
    },
    pfPercent: { type: Number, default: 12, min: 0 },
    esiPercent: { type: Number, default: 0.75, min: 0 },
    professionalTaxAmount: { type: Number, default: 0, min: 0 },
    paidLeavePerMonth: { type: Number, default: 1, min: 0 },
    roundingMode: {
      type: String,
      enum: ["nearest", "up", "down"],
      default: "nearest",
    },
    payDateDayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
  },
  { timestamps: true }
);

export const PayrollPolicy = mongoose.model("PayrollPolicy", payrollPolicySchema);
