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

export default mongoose.model("ActivityLog", activityLogSchema);
