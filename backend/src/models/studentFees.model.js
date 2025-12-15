import mongoose, { Schema } from "mongoose";

const StudentFeesSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    feeId: {
      type: Schema.Types.ObjectId,
      ref: "Fees",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    paidAmount: {
      type: Number,
    },

    paymentMethod: {
      type: String,
      enum: ["Razorpay", "Stripe", "PayPal"],
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true, // ✅ allow many null values before payment
    },

    paymentDate: {
      type: Date,
    },

  },
  {
    timestamps: true,
  }
);

export const StudentFee = mongoose.model(
  "StudentFee",
  StudentFeesSchema
);
