import mongoose, { Schema } from "mongoose";
import { highestSuffix, nextSequence } from "../utils/sequence.js";

const POItemSchema = new Schema(
  {
    itemName:   { type: String, required: true, trim: true },
    quantity:   { type: Number, required: true, min: 0 },
    unit:       { type: String, default: "pcs" },
    unitPrice:  { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    receivedQty:{ type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema(
  {
    schoolId:     { type: Schema.Types.ObjectId, ref: "School", required: true },
    // Unique within a school (index below). It was unique across the whole platform while being
    // numbered per school, so every school after the first collided on PO-<year>-0001.
    poNumber:     { type: String },
    vendorId:     { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items:        { type: [POItemSchema], default: [] },
    subtotal:     { type: Number, default: 0 },
    taxRate:      { type: Number, default: 0 },
    taxAmount:    { type: Number, default: 0 },
    totalAmount:  { type: Number, default: 0 },
    status:       {
      type: String,
      enum: ["draft", "pending", "approved", "ordered", "partial", "received", "cancelled"],
      default: "draft",
    },
    orderedBy:    { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy:   { type: Schema.Types.ObjectId, ref: "User" },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    notes:        { type: String, default: "" },
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ schoolId: 1, status: 1 });
PurchaseOrderSchema.index({ schoolId: 1, vendorId: 1 });

PurchaseOrderSchema.index({ schoolId: 1, poNumber: 1 }, { unique: true, partialFilterExpression: { poNumber: { $type: "string" } } });

// Numbered from an atomic counter per school and year. "How many orders + 1" handed two orders
// made together the same number, and after a draft was deleted repeated one still in use.
PurchaseOrderSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const Model = this.constructor;
    const seq = await nextSequence(`po:${this.schoolId}:${year}`, async () => {
      const issued = await Model.find({ schoolId: this.schoolId, poNumber: new RegExp(`^${prefix}`) }).select("poNumber").lean();
      return highestSuffix(issued.map((p) => p.poNumber), prefix);
    });
    this.poNumber = `${prefix}${String(seq).padStart(4, "0")}`;
  }
  next();
});

export const PurchaseOrder = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
