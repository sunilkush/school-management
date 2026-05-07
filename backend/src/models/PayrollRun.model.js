import mongoose, { Schema } from "mongoose";

const payrollRunSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  cycleType: { type: String, enum: ["monthly", "weekly", "custom"], default: "monthly" },
  periodStart: { type: Date, default: null },
  periodEnd: { type: Date, default: null },
  status: { type: String, enum: ["draft", "processing", "verified", "hr_approved", "accountant_approved", "principal_approved", "approved", "paid", "locked", "rolled_back"], default: "draft", index: true },
  approvedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  approvalTrail: { type: [Schema.Types.Mixed], default: [] },
  totalEmployees: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  pfLiability: { type: Number, default: 0 },
  esiLiability: { type: Number, default: 0 },
  tdsLiability: { type: Number, default: 0 },
  analytics: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

payrollRunSchema.index(
  { schoolId: 1, academicYearId: 1, month: 1, year: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["draft", "processing", "verified", "hr_approved", "accountant_approved", "principal_approved", "approved", "paid", "locked"] } } }
);

export const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);
