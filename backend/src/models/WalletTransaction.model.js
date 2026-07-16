import mongoose, { Schema } from "mongoose";

const walletTransactionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: "StudentWallet", required: true },

    type: { type: String, enum: ["TopUp", "Purchase", "Refund"], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },

    paymentMode: { type: String, enum: ["Cash", "Razorpay"], default: null },
    razorpay: {
      order_id: { type: String, default: null },
      payment_id: { type: String, default: null },
    },
    orderId: { type: Schema.Types.ObjectId, ref: "CanteenOrder", default: null },

    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });

export const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
