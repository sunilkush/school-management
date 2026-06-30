import mongoose, { Schema } from "mongoose";

const InventorySchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYears",
      default: null,
    },
    itemType: {
      type: String,
      enum: ["supply", "asset"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    allocated: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    minThreshold: {
      type: Number,
      min: 0,
      default: 10,
    },
    serialNumber:   { type: String, trim: true, default: "" },
    purchaseDate:   { type: Date, default: null },
    purchasePrice:  { type: Number, default: 0, min: 0 },
    warrantyExpiry: { type: Date, default: null },
    condition:      { type: String, enum: ["new", "good", "fair", "poor", "disposed"], default: "good" },
    vendorId:       { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    assignedTo:     { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const Inventory = mongoose.model("Inventory", InventorySchema);
