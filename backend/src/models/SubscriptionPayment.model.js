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
    // Gateway's order id (created before payment) — kept distinct from transactionId (the
    // gateway's payment id, only known after the payer completes checkout).
    gatewayOrderId: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    paymentProofUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: { type: Date, default: Date.now },
    gatewayProvider: { type: String, trim: true },
    // Running total refunded against this payment — never mutate `amount` itself, it must stay
    // the original transaction record. Mirrors the same pattern used for student-fee refunds.
    refundAmount: { type: Number, default: 0, min: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "partial", "full"],
      default: "none",
    },
  },
  { timestamps: true }
);

subscriptionPaymentSchema.index({ schoolId: 1, paymentDate: -1 });
// A gateway payment id is globally unique per real transaction — a sparse unique index means a
// webhook and the client-side verify call racing to record the same payment can't both succeed;
// the loser gets a duplicate-key error the caller can treat as "already recorded".
subscriptionPaymentSchema.index(
  { transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $exists: true, $type: "string" } } }
);

export const SubscriptionPayment =
  mongoose.models.SubscriptionPayment ||
  mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
