import mongoose, { Schema } from "mongoose";

const VendorSchema = new Schema(
  {
    schoolId:      { type: Schema.Types.ObjectId, ref: "School", required: true },
    name:          { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone:         { type: String, trim: true, default: "" },
    email:         { type: String, trim: true, lowercase: true, default: "" },
    address:       { type: String, trim: true, default: "" },
    gstNumber:     { type: String, trim: true, default: "" },
    category:      { type: String, trim: true, default: "General" },
    bankAccount:   { type: String, trim: true, default: "" },
    ifscCode:      { type: String, trim: true, default: "" },
    isActive:      { type: Boolean, default: true },
    createdBy:     { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

VendorSchema.index({ schoolId: 1, isActive: 1 });

export const Vendor = mongoose.model("Vendor", VendorSchema);
