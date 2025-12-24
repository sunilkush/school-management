import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
      index: true,
    },

    /**
     * If customAmount is set, it overrides FeeStructure.amount
     * Useful for special cases / scholarships
     */
    customAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    /**
     * Discount / Concession reference
     * Optional
     */
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount", // or FeeConcession
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * One FeeStructure should be assigned only once per student
 */
studentFeeSchema.index(
  { studentId: 1, feeStructureId: 1 },
  { unique: true }
);

export const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
