import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one recipient is required",
      },
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    archivedBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    deletedBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

MessageSchema.index({ schoolId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientIds: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", MessageSchema);
