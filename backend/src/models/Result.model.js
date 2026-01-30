// models/Result.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const ResultSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
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

    totalMarks: {
      type: Number,
      required: true,
      min: 0
    },

    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return value <= this.totalMarks;
        },
        message: "Obtained marks cannot be greater than total marks"
      }
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100
    },

    grade: {
      type: String,
      trim: true
    },

    rank: {
      type: Number,
      min: 1
    }
  },
  { timestamps: true }
);

/* ===============================
   AUTO CALCULATIONS
================================ */
ResultSchema.pre("validate", function (next) {
  // Auto calculate percentage
  if (this.totalMarks > 0) {
    this.percentage = Number(
      ((this.obtainedMarks / this.totalMarks) * 100).toFixed(2)
    );
  } else {
    this.percentage = 0;
  }
  next();
});

/* ===============================
   INDEXES (VERY IMPORTANT)
================================ */

// One result per student per exam
ResultSchema.index(
  { schoolId: 1, examId: 1, studentId: 1 },
  { unique: true }
);

// Ranking queries (class/section wise)
ResultSchema.index({
  schoolId: 1,
  examId: 1,
  classId: 1,
  sectionId: 1,
  obtainedMarks: -1
});

export const Result = mongoose.model("Result", ResultSchema);
