import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear", // or Session model
      required: true,
      index: true,
    },

    feeHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeHead",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Prevent duplicate fee structure entries
 * Same school + class + session + feeHead should exist only once
 */
feeStructureSchema.index(
  { schoolId: 1, classId: 1, sessionId: 1, feeHeadId: 1 },
  { unique: true }
);

export const FeeStructure = mongoose.model(
  "FeeStructure",
  feeStructureSchema
);
