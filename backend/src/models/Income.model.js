import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Tuition Fee",
        "Admission Fee",
        "Registration Fee",
        "Transport Income",
        "Hostel Income",
        "Exam Income",
        "Library Income",
        "Sports Income",
        "Canteen Income",
        "Donation",
        "Grant",
        "Sponsorship",
        "Rental Income",
        "Interest Income",
        "Miscellaneous",
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "cheque", "bank_transfer", "upi", "online", "dd"],
      default: "cash",
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    receivedFrom: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

incomeSchema.index({ schoolId: 1, date: -1 });
incomeSchema.index({ schoolId: 1, category: 1 });
incomeSchema.index({ schoolId: 1, academicYearId: 1 });

export const Income = mongoose.model("Income", incomeSchema);
