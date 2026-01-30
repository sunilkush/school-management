// models/ExamClass.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ExamClassSchema = new Schema(
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
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for same exam + class + section
ExamClassSchema.index(
  { examId: 1, classId: 1, sectionId: 1 },
  { unique: true }
);

export const ExamClass = model("ExamClass", ExamClassSchema);
