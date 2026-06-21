import mongoose, { Schema } from "mongoose";

const emergencyAlertSchema = new Schema(
  {
    schoolId:    { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    type:        {
      type: String,
      enum: ["Fire", "Medical Emergency", "Security Breach", "Natural Disaster", "Other"],
      required: true,
    },
    severity:    { type: String, enum: ["Low", "Medium", "High"], required: true },
    location:    { type: String, trim: true },
    description: { type: String, trim: true },
    raisedBy:    { type: Schema.Types.ObjectId, ref: "User" },
    raisedAt:    { type: Date, default: Date.now },
    resolvedAt:  { type: Date },
    resolvedBy:  { type: Schema.Types.ObjectId, ref: "User" },
    isResolved:  { type: Boolean, default: false },
    resolution:  { type: String, trim: true },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ schoolId: 1, raisedAt: -1 });

export const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);
