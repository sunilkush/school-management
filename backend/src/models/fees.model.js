import mongoose, { Schema } from "mongoose";

const FeesSchema = new Schema(
  {
    feeName: {
      type: String,
      required: true,
      trim: true, // Admission / Tuition / Exam
    },

    amount: {
      type: Number,
      required: true,
    },

    frequency: {
      type: String,
      enum: ["one-time", "monthly", "quarterly", "yearly"],
      default: "one-time",
    },

    dueDate: {
      type: Date,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    declaredBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Admin
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Fees = mongoose.model("Fees", FeesSchema);
