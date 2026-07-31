import mongoose, { Schema } from "mongoose";

// Refunds are append-only audit records — the original Payment is never edited or deleted, only
// annotated (Payment.refundedAmount/status) so the money trail stays intact end to end.
const refundSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  studentFeeId: { type: Schema.Types.ObjectId, ref: "StudentFee", default: null },
  installmentId: { type: Schema.Types.ObjectId, ref: "FeeInstallment", default: null },

  amount: { type: Number, required: true, min: 0.01 },
  reason: { type: String, required: true, trim: true },
  refundMode: {
    type: String,
    enum: ["cash", "online", "cheque", "bank_transfer", "upi", "adjustment"],
    required: true,
  },
  transactionId: { type: String, trim: true, default: null },

  refundedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  refundedAt: { type: Date, default: Date.now },
}, { timestamps: true });

refundSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });

export const Refund = mongoose.model("Refund", refundSchema);
