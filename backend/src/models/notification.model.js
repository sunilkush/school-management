import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["all", "role", "user-level", "user"],
      required: true,
      default: "all",
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    targetLevels: {
      type: [String],
      default: [],
    },
    targetUserIds: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
