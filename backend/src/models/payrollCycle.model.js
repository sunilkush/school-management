import mongoose, { Schema } from "mongoose";

const payrollCycleSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    cycleType: {
      type: String,
      enum: ["monthly", "weekly", "custom"],
      default: "monthly",
      index: true,
    },
    cycleStartDate: { type: Date, default: null },
    cycleEndDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "locked", "paid"],
      default: "draft",
      index: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lockedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

payrollCycleSchema.index({ schoolId: 1, month: 1, year: 1 }, { unique: true });

export const PayrollCycle = mongoose.model("PayrollCycle", payrollCycleSchema);
