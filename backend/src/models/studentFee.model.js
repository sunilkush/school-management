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
     * Discount / Concession (optional)
     */
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
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
