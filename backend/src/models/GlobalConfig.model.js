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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const GlobalConfig = mongoose.model("GlobalConfig", globalConfigSchema);
