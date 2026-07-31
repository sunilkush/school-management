import mongoose, { Schema } from "mongoose";

const systemBackupSchema = new Schema(
  {
    backupNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["full", "school", "module", "academic_year"],
      required: true,
    },
    scope: {
      type: String,
      enum: ["platform", "school", "module"],
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    modules: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ["s3", "local", "cloudinary", "spaces"],
      default: "local",
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileKey: {
      type: String,
      default: null,
    },
    filePath: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    checksum: {
      type: String,
      default: null,
    },
    encryptionEnabled: {
      type: Boolean,
      default: true,
    },
    retentionUntil: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
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

systemBackupSchema.index({ schoolId: 1, createdAt: -1 });

export const SystemBackup = mongoose.model("SystemBackup", systemBackupSchema);
