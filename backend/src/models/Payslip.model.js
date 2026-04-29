import mongoose, { Schema } from "mongoose";

const payslipSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  payrollRunId: { type: Schema.Types.ObjectId, ref: "PayrollRun", required: true, index: true },
  payrollItemId: { type: Schema.Types.ObjectId, ref: "PayrollItem", required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  pdfUrl: { type: String, default: null },
  emailStatus: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
  emailedAt: { type: Date, default: null },
  emailFailureReason: { type: String, default: null },
}, { timestamps: true });

export const Payslip = mongoose.model("Payslip", payslipSchema);
