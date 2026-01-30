// models/ExamSubject.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ExamSubjectSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    examDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String, // e.g. "10:00"
      required: true,
    },

    endTime: {
      type: String, // e.g. "13:00"
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return value <= this.totalMarks;
        },
        message: "Passing marks cannot be greater than total marks",
      },
    },

    examinerId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Teacher / Examiner
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Avoid duplicate subject scheduling for same exam & class
ExamSubjectSchema.index(
  { examId: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { unique: true }
);

export const ExamSubject = model("ExamSubject", ExamSubjectSchema);
