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
    // select: false on every secret below — getGlobalConfig previously returned the whole
    // document straight to the client, so every Super Admin page-load of Settings sent the
    // SMTP password, SMS API key, and Razorpay secrets to the browser in plaintext. Mongoose
    // omits select:false fields from any query by default (both find and findOneAndUpdate's
    // returned doc), so this alone closes the leak with no controller changes needed. A blank
    // secret field on the update form is already treated as "leave unchanged" by
    // updateGlobalConfig (only fields that are !== undefined get written).
    smtpPassword:  { type: String, trim: true, select: false },
    smtpFromEmail: { type: String, trim: true },
    smtpFromName:  { type: String, trim: true },

    // SMS Gateway
    smsProvider:  { type: String, enum: ["twilio", "msg91", "textlocal", "none"], default: "none" },
    smsApiKey:    { type: String, trim: true, select: false },
    smsSenderId:  { type: String, trim: true },

    // Payment Gateway (platform-level — SaaS billing, School pays platform. Separate from the
    // per-school School.razorpay credentials used for student-fee collection.)
    razorpayKeyId:         { type: String, trim: true },
    razorpayKeySecret:     { type: String, trim: true, select: false },
    // Separate from the API key secret — this is the secret Razorpay issues specifically for
    // webhook payload signature verification (configured in the Razorpay Dashboard's Webhooks
    // section), used by webhook.controllers.js.
    razorpayWebhookSecret: { type: String, trim: true, select: false },
    paymentGateway:        { type: String, enum: ["razorpay", "cashfree", "stripe", "none"], default: "none" },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const GlobalConfig = mongoose.model("GlobalConfig", globalConfigSchema);
