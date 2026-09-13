import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
      index: true,
    },
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      default: null,
      index: true,
    },
    // Older single-installment payments only. A payment now usually settles several installments
    // at once and records them in `allocations` instead, leaving this and studentFeeId null.
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInstallment",
      default: null,
      index: true,
    },

    // The installments this payment settled and how much went to each (base first, then fine).
    // One receipt can cover April + May tuition and April transport together; a refund walks
    // this list to reverse exactly what was applied.
    allocations: {
      type: [
        {
          _id: false,
          installmentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeInstallment", required: true },
          studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentFee", required: true },
          amount: { type: Number, required: true, min: 0 },
          refundedAmount: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
    },

    // Online checkout only: the installments the payer chose, fixed when the order is created and
    // applied once the gateway confirms the money arrived.
    requestedInstallmentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "FeeInstallment" }],
      default: [],
    },

    // Money received that no installment could take — the installments were settled some other
    // way while the payer was at the gateway. The office refunds or adjusts it.
    unallocatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "online", "cheque", "razorpay", "bank_transfer", "upi", "card"],
      required: true,
    },

    // Gateway payment id. Globally unique (see the index below), so never put a counter
    // reference such as a cheque number here — that goes in referenceNo.
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },

    // Online checkouts only: the school's gateway this payment was made through. Settlement always
    // asks this gateway, even if the school has switched to another since. Older Razorpay
    // payments have paymentMode "razorpay" and no value here.
    gateway: {
      type: String,
      enum: ["razorpay", "cashfree", "payu", "phonepe", "paytm", "ccavenue", "easebuzz", null],
      default: null,
    },

    // The gateway's order id for an online checkout (for most gateways, this Payment's own id).
    gatewayOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Values a gateway needs again to look the checkout up (Easebuzz: email, phone, amount).
    gatewayMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // What the gateway reported when the payment was confirmed or failed — kept for disputes.
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Where the payer's browser is sent back to after paying on the gateway, set from their role.
    checkoutReturnPath: {
      type: String,
      default: null,
    },

    // What the collector typed at the counter — cheque number, UPI or card reference. Two schools
    // can both receive cheque no. 000123, so this is not unique.
    referenceNo: {
      type: String,
      trim: true,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: null,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },
   razorpay: Object,
  status: {
    // No default previously meant a Payment saved without an explicit status was `undefined` —
    // every `$match: {status:"success"}` revenue aggregation across the app silently excluded
    // such records with no error surfaced anywhere. Defaults to "pending" (never "success") so
    // an incomplete/unconfirmed payment can never fail-open into counting as collected revenue.
    // "refunded" is set once refundedAmount reaches amountPaid — every existing revenue
    // aggregation already filters on status:"success", so a fully-refunded payment is
    // automatically excluded from collected-revenue figures with no changes needed there.
    type: String,
    enum: ["success", "failed", "pending", "refunded"],
    default: "pending",
  },
  // Running total of Refund docs issued against this payment. Never mutate amountPaid itself —
  // it must stay the original transaction record; refundedAmount is the only thing that changes.
  refundedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
    receiptNo: {
      type: String,
      required: true,
     
      index: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index(
  { schoolId: 1, academicYearId: 1, receiptNo: 1 },
  { unique: true }
);
paymentSchema.index({ schoolId: 1, studentId: 1, paymentDate: -1 });
// A gateway payment id is globally unique per real transaction — a sparse unique index means the
// fee-payment webhook (webhook.controllers.js) and the client-side verify call racing to record
// the same Razorpay payment can't both succeed; the loser gets a duplicate-key error the caller
// treats as "already recorded, not an error".
paymentSchema.index(
  { transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $exists: true, $type: "string" } } }
);

// Installment and StudentFee balances are updated atomically alongside the Payment write inside
// the same transaction (see services/feePayment.service.js) — a post-save hook here would run
// outside that transaction and race it.

export const Payment = mongoose.model("Payment", paymentSchema);
