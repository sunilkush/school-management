import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ actorName: 1, action: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
