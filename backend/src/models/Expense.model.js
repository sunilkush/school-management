import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
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
        "Staff Salary",
        "Teacher Salary",
        "Contract Salary",
        "Utility Bills",
        "Rent",
        "Internet",
        "Software Subscription",
        "Stationery",
        "Maintenance",
        "Library Purchase",
        "Laboratory Equipment",
        "Transportation Cost",
        "Event Expense",
        "Marketing",
        "Insurance",
        "Legal & Professional",
        "Printing",
        "Cleaning",
        "Canteen Expense",
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
    paidTo: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceNo: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected"],
      default: "paid",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

expenseSchema.index({ schoolId: 1, date: -1 });
expenseSchema.index({ schoolId: 1, category: 1 });
expenseSchema.index({ schoolId: 1, status: 1 });
expenseSchema.index({ schoolId: 1, academicYearId: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
