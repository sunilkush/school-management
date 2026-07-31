// models/ActivityLog.js
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // for future extensibility
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Activity logs are almost always queried "most recent first, for this school" — no index
// existed at all, so every such query was a full collection scan.
activityLogSchema.index({ school: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
