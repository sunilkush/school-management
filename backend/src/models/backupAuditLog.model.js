import mongoose, { Schema } from "mongoose";

const backupAuditLogSchema = new Schema(
  {
    backupId: {
      type: Schema.Types.ObjectId,
      ref: "SystemBackup",
      default: null,
      index: true,
    },
    restoreJobId: {
      type: Schema.Types.ObjectId,
      ref: "RestoreJob",
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "backup_created",
        "backup_failed",
        "backup_deleted",
        "restore_requested",
        "restore_approved",
        "restore_started",
        "restore_completed",
      ],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const BackupAuditLog = mongoose.model("BackupAuditLog", backupAuditLogSchema);
