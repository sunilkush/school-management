import mongoose from "mongoose";

const schoolUsageSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
    },
    totalStudents: { type: Number, default: 0, min: 0 },
    totalTeachers: { type: Number, default: 0, min: 0 },
    totalUsers: { type: Number, default: 0, min: 0 },
    storageUsed: { type: Number, default: 0, min: 0 },
    smsUsed: { type: Number, default: 0, min: 0 },
    emailUsed: { type: Number, default: 0, min: 0 },
    activeModules: [{ type: String, trim: true }],
    apiUsage: { type: Number, default: 0, min: 0 },
    loginCount: { type: Number, default: 0, min: 0 },
    onlineExamAttempts: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const SchoolUsage =
  mongoose.models.SchoolUsage || mongoose.model("SchoolUsage", schoolUsageSchema);
