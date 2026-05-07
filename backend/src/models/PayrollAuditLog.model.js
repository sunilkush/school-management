import mongoose, { Schema } from "mongoose";

const payrollAuditLogSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: Schema.Types.ObjectId, default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    summary: { type: String, trim: true, default: "" },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true, default: "" },
    userAgent: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

payrollAuditLogSchema.index({ schoolId: 1, academicYearId: 1, createdAt: -1 });

export const PayrollAuditLog = mongoose.model("PayrollAuditLog", payrollAuditLogSchema);
