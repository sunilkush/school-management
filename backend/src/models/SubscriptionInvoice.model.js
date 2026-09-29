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
    // "next" bills the period after the plan's current end date (a renewal); paying it extends the
    // plan to billingPeriodEnd. "current" bills the period the plan is already in. Invoices made
    // before this field existed have neither.
    period: { type: String, enum: ["current", "next"] },
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
    // Razorpay orders created to pay this invoice. A checkout signature only proves an order and
    // payment belong together — not which invoice they were for — so verifying a payment requires
    // its order to be one of these. Otherwise a cheap invoice's paid order could be presented
    // against an expensive invoice and mark that one paid. A list, since each "Pay" makes a new order.
    gatewayOrderIds: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

subscriptionInvoiceSchema.index({ schoolId: 1, dueDate: 1 });

export const SubscriptionInvoice =
  mongoose.models.SubscriptionInvoice ||
  mongoose.model("SubscriptionInvoice", subscriptionInvoiceSchema);
