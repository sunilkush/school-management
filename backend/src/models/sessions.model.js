import mongoose, { Schema } from "mongoose";

const sessionsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false, // 🔒 security: token direct expose na ho
    },

    deviceInfo: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date, // ✅ correct type
      required: true,
      index: true,
    },

    isRevoked: {
      type: Boolean, // ✅ correct type
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // ✅ createdAt, updatedAt
    versionKey: false,
  }
);

export const Session = mongoose.model("Session", sessionsSchema);