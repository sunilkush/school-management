// models/Grade.js
import mongoose, { Schema } from "mongoose";

const GradeSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true
    },

    examSubjectId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSubject",
      required: true,
      index: true
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true
    },

    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },

    grade: {
      type: String,
      required: true,
      trim: true
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

/* ===============================
   INDEXES (CRITICAL)
================================ */

// Prevent duplicate grading
GradeSchema.index(
  {
    schoolId: 1,
    academicYearId: 1,
    examSubjectId: 1,
    studentId: 1
  },
  { unique: true }
);

// Fast report / result queries
GradeSchema.index({
  schoolId: 1,
  examId: 1,
  classId: 1,
  sectionId: 1
});

export const Grade = mongoose.model("Grade", GradeSchema);
