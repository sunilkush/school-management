// models/OnlineExam.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const OnlineExamSchema = new Schema(
  {
    examSubjectId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSubject",
      required: true,
      unique: true // one online config per exam subject
    },

    duration: {
      type: Number, // in minutes
      required: true,
      min: 1
    },

    negativeMarking: {
      type: Boolean,
      default: false
    },

    shuffleQuestions: {
      type: Boolean,
      default: true
    },

    shuffleOptions: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* ===============================
   INDEXES
================================ */
OnlineExamSchema.index({ examSubjectId: 1 });

export const OnlineExam = model("OnlineExam", OnlineExamSchema);
