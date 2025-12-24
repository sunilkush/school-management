import mongoose from "mongoose";

const feeHeadSchema = new mongoose.Schema(
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
      enum: ["Admission Fee",
  "Tuition Fee",
  "Registration Fee",
  "Transport Fee",
  "Exam Fee",
  "Library Fee",
  "Computer Fee",
  "Hostel Fee",
  "Mess Fee",
  "Sports Fee",
  "Books Fee",
  "Uniform Fee",
  "Fine",
  "Late Fee Fine"],
    },

    type: {
      type: String,
      required: true,
      enum: ["recurring", "one-time", "penalty"],
    },

    isEditable: {
      type: Boolean,
      default: true,
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
 * Prevent duplicate FeeHead names per school
 * (e.g., one school can't have two "Tuition" heads)
 */
feeHeadSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const FeeHead = mongoose.model("FeeHead", feeHeadSchema);
