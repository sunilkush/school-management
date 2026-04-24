import mongoose from "mongoose";

const subscriptionInvoiceSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolSubscription",
      required: true,
    },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    planPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxGst: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "unpaid", "paid", "overdue", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export const SubscriptionInvoice =
  mongoose.models.SubscriptionInvoice ||
  mongoose.model("SubscriptionInvoice", subscriptionInvoiceSchema);
