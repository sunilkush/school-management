import mongoose, { Schema } from "mongoose";

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
    poNumber:     { type: String, unique: true },
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

PurchaseOrderSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ schoolId: this.schoolId });
    this.poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

export const PurchaseOrder = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
