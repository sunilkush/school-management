import mongoose, { Schema } from "mongoose";

const FeesSchema = new Schema(
  {
    feeName: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYears",
      required: true,
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

  },
  {
    timestamps: true,
  }
);

export const Fees = mongoose.model("Fees", FeesSchema);
