import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema(
  {
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
    teacherId:{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Subject details
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true, // Example: MATH101
    },
    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Classification
    category: {
      type: String,
      enum: ["Core", "Elective", "Language", "Practical", "Optional"],
      default: "Core",
    },
    type: {
      type: String,
      enum: ["Theory", "Practical", "Both"],
      default: "Theory",
    },

    // Marks & grading
    maxMarks: {
      type: Number,
      default: 100,
    },
    passMarks: {
      type: Number,
      default: 35,
    },
    gradingSchemeId: {
      type: Schema.Types.ObjectId,
      ref: "Grade", // Optional grading system reference
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit info
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", SubjectSchema);
