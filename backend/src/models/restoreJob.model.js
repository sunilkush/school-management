import mongoose, { Schema } from "mongoose";

const restoreJobSchema = new Schema(
  {
    backupId: {
      type: Schema.Types.ObjectId,
      ref: "SystemBackup",
      required: true,
      index: true,
    },
    restoreType: {
      type: String,
      enum: ["full", "school", "module"],
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    modules: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending_approval", "running", "success", "failed"],
      default: "pending_approval",
      index: true,
    },
    dryRun: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const RestoreJob = mongoose.model("RestoreJob", restoreJobSchema);
