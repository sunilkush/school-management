import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema(
  {
    // 🔹 School (Multi-tenant support)
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // 🔹 Academic Year
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    // 🔹 Student
 
    studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
          index: true,
        },

    // 🔹 Fee Structure
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
      index: true,
    },

    /**
     * Custom amount overrides FeeStructure.amount
     * (Scholarship / Special case)
     */
    customAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    /**
     * Discount / Concession auto-applied from the student's StudentEnrollment.feeDiscount
     * percentage at assignment time (see assignFeesToStudents) — null when no discount applied
     * (e.g. an explicit customAmount override was used instead).
     *
     * Typed as Mixed rather than a plain nested object: Mongoose auto-vivifies an unset plain
     * nested object path to `{}` on every document, which would make "was a discount applied?"
     * checks always truthy even when nothing was ever set. Mixed with an explicit null default
     * stays genuinely null until assignFeesToStudents sets it.
     */
    discountApplied: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // 🔹 Payment Tracking
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      min: 0,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    // 🔹 Audit
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔹 Snapshot of the most recent payment against this fee record.
    // Full transaction history lives in the Payment collection — this is
    // just a quick "last touched" reference on the fee record itself.
    lastPayment: {
      amount: { type: Number },
      paymentMode: { type: String },
      referenceNo: { type: String },
      remarks: { type: String },
      paidAt: { type: Date },
      collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 🔒 One FeeStructure can be assigned only once
 * per student per academic year per school
 */
studentFeeSchema.index(
  {
    schoolId: 1,
    academicYearId: 1,
    studentId: 1,
    feeStructureId: 1,
  },
  { unique: true }
);

/**
 * 🔄 Auto-update status before save
 */
studentFeeSchema.pre("save", function (next) {
  if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
    this.dueAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = "partial";
    this.dueAmount = this.totalAmount - this.paidAmount;
  } else {
    this.status = "pending";
    this.dueAmount = this.totalAmount;
  }
  next();
});

export const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
