import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Class 6"
      lowercase: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User", // class teacher
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // enrolled students
      },
    ],
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject", // subject reference
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User", // teacher for this subject in this class
        },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate class names per school + academic year
classSchema.index({ name: 1, schoolId: 1, academicYearId: 1 }, { unique: true });

export const Class = mongoose.model("Class", classSchema);
