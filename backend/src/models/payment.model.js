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
    installmentId: {
      // Optional: only set for payments made against the FeeInstallment/self-service
      // flow. Payments recorded directly against a StudentFee (e.g. Accountant "Collect
      // Fees") have no matching installment, so this must stay nullable.
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInstallment",
      default: null,
      index: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "online", "cheque", "razorpay", "bank_transfer", "upi"],
      required: true,
    },

    transactionId: {
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
  type: String,
  enum: ["success", "failed", "pending"]
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

// Installment status is updated atomically alongside the Payment write inside
// the same transaction (see recordPayment() in payment.controllers.js) —
// a post-save hook here would run outside that transaction and race it.

export const Payment = mongoose.model("Payment", paymentSchema);
