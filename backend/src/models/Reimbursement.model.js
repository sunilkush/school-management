import mongoose, { Schema } from "mongoose";

const approvalSchema = new Schema(
  {
    level: { type: String, enum: ["manager", "finance"], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    actedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actedAt: { type: Date, default: null },
    remark: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const reimbursementSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["travel", "fuel", "internet", "medical", "food", "other"], required: true },
    amount: { type: Number, required: true, min: 1 },
    claimDate: { type: Date, default: Date.now },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: ["pending_manager", "pending_finance", "approved", "rejected", "added_to_payroll"], default: "pending_manager", index: true },
    approvals: { type: [approvalSchema], default: () => [{ level: "manager" }, { level: "finance" }] },
    payrollRunId: { type: Schema.Types.ObjectId, ref: "PayrollRun", default: null },
    rejectionReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

reimbursementSchema.index({ schoolId: 1, academicYearId: 1, status: 1 });
reimbursementSchema.index({ schoolId: 1, employeeId: 1, createdAt: -1 });

export const Reimbursement = mongoose.model("Reimbursement", reimbursementSchema);
