import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
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
      enum: ["cash", "online", "cheque"],
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

    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

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
