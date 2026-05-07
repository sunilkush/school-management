import mongoose, { Schema } from "mongoose";

const payrollItemSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  payrollRunId: { type: Schema.Types.ObjectId, ref: "PayrollRun", required: true, index: true },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  gross: { type: Number, required: true },
  deductions: { type: Schema.Types.Mixed, default: {} },
  earnings: { type: Schema.Types.Mixed, default: {} },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  attendance: { type: Schema.Types.Mixed, default: {} },
  leave: { type: Schema.Types.Mixed, default: {} },
  reimbursements: { type: [Schema.Types.Mixed], default: [] },
  bonuses: { type: [Schema.Types.Mixed], default: [] },
  compliance: { type: Schema.Types.Mixed, default: {} },
  anomalyFlags: { type: [String], default: [] },
  leaveDeduction: { type: Number, default: 0 },
  loanEmiDeduction: { type: Number, default: 0 },
}, { timestamps: true });

payrollItemSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

export const PayrollItem = mongoose.model("PayrollItem", payrollItemSchema);
