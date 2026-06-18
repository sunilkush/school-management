import mongoose, { Schema } from "mongoose";

const globalConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    platformName: {
      type: String,
      trim: true,
      default: "School Management System",
    },
    currency: {
      type: String,
      trim: true,
      default: "INR",
    },
    currencySymbol: {
      type: String,
      trim: true,
      default: "₹",
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    supportEmail: {
      type: String,
      trim: true,
    },
    supportPhone: {
      type: String,
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    maxSchools: {
      type: Number,
      default: 0,
    },
    // Email / SMTP
    smtpHost:     { type: String, trim: true },
    smtpPort:     { type: Number },
    smtpUser:     { type: String, trim: true },
    smtpPassword:  { type: String, trim: true },
    smtpFromEmail: { type: String, trim: true },
    smtpFromName:  { type: String, trim: true },

    // SMS Gateway
    smsProvider:  { type: String, enum: ["twilio", "msg91", "textlocal", "none"], default: "none" },
    smsApiKey:    { type: String, trim: true },
    smsSenderId:  { type: String, trim: true },

    // Payment Gateway
    razorpayKeyId:     { type: String, trim: true },
    razorpayKeySecret: { type: String, trim: true },
    paymentGateway:    { type: String, enum: ["razorpay", "stripe", "none"], default: "none" },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const GlobalConfig = mongoose.model("GlobalConfig", globalConfigSchema);
