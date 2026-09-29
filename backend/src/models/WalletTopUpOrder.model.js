import mongoose, { Schema } from "mongoose";

/**
 * A Razorpay order created to top up one student's canteen wallet.
 *
 * Verifying a top-up used to credit whatever `amount` the request said, and nothing stopped the
 * same payment being verified again. The order is recorded here when it is created, so the verify
 * step credits the amount the order was actually made for, and only once: an order moves from
 * "created" to "paid" exactly one time.
 */
const walletTopUpOrderSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["created", "paid"], default: "created" },
    paymentId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const WalletTopUpOrder =
  mongoose.models.WalletTopUpOrder || mongoose.model("WalletTopUpOrder", walletTopUpOrderSchema);
