import mongoose from "mongoose";

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionInvoice",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "bank transfer", "UPI", "card", "cheque", "gateway"],
      required: true,
    },
    transactionId: { type: String, trim: true },
    paymentProofUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: { type: Date, default: Date.now },
    gatewayProvider: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SubscriptionPayment =
  mongoose.models.SubscriptionPayment ||
  mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
