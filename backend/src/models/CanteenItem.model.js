import mongoose, { Schema } from "mongoose";

export const CANTEEN_CATEGORIES = ["Breakfast", "Lunch", "Snacks", "Beverages", "Other"];

const canteenItemSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CANTEEN_CATEGORIES, default: "Other" },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

canteenItemSchema.index({ schoolId: 1, category: 1 });

export const CanteenItem =
  mongoose.models.CanteenItem || mongoose.model("CanteenItem", canteenItemSchema);
