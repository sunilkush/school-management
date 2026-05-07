import mongoose, { Schema } from "mongoose";

const bonusIncentiveSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["festival_bonus", "performance_bonus", "incentive", "target_bonus", "one_time_payout"], required: true },
    title: { type: String, trim: true, required: true },
    amount: { type: Number, required: true, min: 1 },
    payoutMonth: { type: Number, required: true, min: 1, max: 12, index: true },
    payoutYear: { type: Number, required: true, min: 2000, index: true },
    rule: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["draft", "approved", "paid", "cancelled"], default: "approved", index: true },
    payrollRunId: { type: Schema.Types.ObjectId, ref: "PayrollRun", default: null },
  },
  { timestamps: true }
);

bonusIncentiveSchema.index({ schoolId: 1, academicYearId: 1, payoutYear: 1, payoutMonth: 1, status: 1 });

export const BonusIncentive = mongoose.model("BonusIncentive", bonusIncentiveSchema);
