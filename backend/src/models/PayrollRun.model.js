import mongoose, { Schema } from "mongoose";

const payrollRunSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  status: { type: String, enum: ["draft", "hr_approved", "accountant_approved", "approved", "locked"], default: "draft", index: true },
  approvedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  totalEmployees: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
}, { timestamps: true });

payrollRunSchema.index({ schoolId: 1, academicYearId: 1, month: 1, year: 1 }, { unique: true });

export const PayrollRun = mongoose.model("PayrollRun", payrollRunSchema);
