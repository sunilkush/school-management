import mongoose from "mongoose";

const fineRuleSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    /**
     * per-day → amount charged per late day
     * flat → fixed fine after grace period
     */
    type: {
      type: String,
      enum: ["per-day", "flat"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Number of days allowed after due date without fine
     */
    graceDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Only one active FineRule per school
 */
fineRuleSchema.index(
  { schoolId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export const FineRule = mongoose.model("FineRule", fineRuleSchema);
