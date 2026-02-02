import mongoose, { Schema } from "mongoose";

const schoolSchema = new Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    address: {
      type: String,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /* ================= PAYMENT MODE ================= */

    // 🔹 Razorpay (Online payments)
    razorpay: {
      keyId: {
        type: String,
        select: false, // 🔐 security
      },
      keySecret: {
        type: String,
        select: false, // 🔐 security
      },
      accountId: {
        type: String, // Optional (Razorpay Route / Sub-account)
      },
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },

    // 🔹 Bank Account (Offline / Manual payment)
    bank: {
      accountHolder: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      ifsc: {
        type: String,
        trim: true,
        uppercase: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },
     activeAcademicYearId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",

     },
     boards:[{
      type:mongoose.Schema.Types.ObjectId,
      ref: "Board",
     }],
    /* ================= META ================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */
schoolSchema.index({ name: 1, email: 1 });

/* ================= MODEL ================= */
export const School = mongoose.model("School", schoolSchema);

