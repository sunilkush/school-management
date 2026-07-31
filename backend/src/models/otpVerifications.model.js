import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    emailOrPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["login", "signup", "forgot_password", "verify_email", "verify_phone"],
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Failed verification attempts against this specific code — once it hits the cap enforced in
    // the controller, the code is treated as burned even though it hasn't expired yet, so a
    // 6-digit OTP can't just be brute-forced within its validity window.
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* 🔥 Auto delete expired OTP (TTL Index) */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* 🔒 Prevent duplicate active OTP for same user + purpose */
otpSchema.index(
  { emailOrPhone: 1, purpose: 1 },
  { unique: true, partialFilterExpression: { verifiedAt: null } }
);

export const OTP = mongoose.model("OTP", otpSchema);