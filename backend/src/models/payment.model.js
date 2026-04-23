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
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInstallment",
      required: true,
      index: true,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "online", "cheque","razorpay"],
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

/**
 * Auto-update installment status after payment
 */
paymentSchema.post("save", async function (doc) {
  const FeeInstallment = mongoose.model("FeeInstallment");

  const installment = await FeeInstallment.findById(doc.installmentId);
  if (!installment) return;

  if (doc.amountPaid >= installment.amount) {
    installment.status = "paid";
    await installment.save();
  }
});

export const Payment = mongoose.model("Payment", paymentSchema);
