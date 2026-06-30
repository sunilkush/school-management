import mongoose, { Schema } from "mongoose";

const ServiceLogSchema = new Schema(
  {
    date:        { type: Date, required: true },
    description: { type: String, required: true },
    technician:  { type: String, default: "" },
    cost:        { type: Number, default: 0 },
  },
  { _id: true, timestamps: false }
);

const AMCTrackingSchema = new Schema(
  {
    schoolId:       { type: Schema.Types.ObjectId, ref: "School", required: true },
    assetId:        { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
    assetName:      { type: String, required: true },
    vendorId:       { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    contractNumber: { type: String, trim: true, default: "" },
    serviceType:    {
      type: String,
      enum: ["comprehensive", "non-comprehensive", "partial", "warranty"],
      default: "comprehensive",
    },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    cost:            { type: Number, default: 0, min: 0 },
    nextServiceDate: { type: Date, default: null },
    status:          {
      type: String,
      enum: ["active", "expired", "expiring_soon", "upcoming"],
      default: "active",
    },
    serviceLogs:    { type: [ServiceLogSchema], default: [] },
    notes:          { type: String, default: "" },
    createdBy:      { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AMCTrackingSchema.index({ schoolId: 1, status: 1 });
AMCTrackingSchema.index({ schoolId: 1, endDate: 1 });

export const AMCTracking = mongoose.model("AMCTracking", AMCTrackingSchema);
