import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    /**
     * percentage → 0–100
     * flat → currency amount
     */
    value: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Discount applies only to selected FeeHeads
     * Empty array = applies to all
     */
    applicableFeeHeads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeeHead",
      },
    ],

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
 * Prevent duplicate discount names per school
 */
discountSchema.index({ schoolId: 1, name: 1 }, { unique: true });

/**
 * Validate percentage discount value
 */
discountSchema.pre("save", function (next) {
  if (this.type === "percentage" && this.value > 100) {
    return next(new Error("Percentage discount cannot exceed 100"));
  }
  next();
});

export const Discount = mongoose.model("Discount", discountSchema);
