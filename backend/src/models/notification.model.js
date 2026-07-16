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
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    deliveryStats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent"],
      default: "sent",
    },
    readBy: {
      type: [String],
      default: [],
    },
    readReceipts: {
      type: [
        {
          userToken: { type: String, required: true },
          readAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    targetUserObjectIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdById: {
      // Optional: system-triggered notifications (e.g. the PTM reminder cron job) have no acting
      // user to attribute the notification to.
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
  },
  { timestamps: true }
);
NotificationSchema.index({ schoolId: 1, createdAt: -1 });
NotificationSchema.index({ level: 1, createdAt: -1 });
export const Notification = mongoose.model("Notification", NotificationSchema);
