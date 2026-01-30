// models/ExamAttempt.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },

    // Immutable snapshot of question at exam time
    questionSnapshot: {
      statement: String,
      questionType: String,
      options: Array,
      marks: Number,
      negativeMarks: Number
    },

    answer: Schema.Types.Mixed, // ['A'], ['A','B'], "true", "text"

    marksObtained: {
      type: Number,
      default: 0,
      min: 0
    },

    isCorrect: {
      type: Boolean,
      default: null
    },

    flagged: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const AttemptSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    examSubjectId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSubject",
      required: true,
      index: true
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    submittedAt: {
      type: Date
    },

    durationSeconds: {
      type: Number,
      min: 0
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "abandoned"],
      default: "in_progress"
    },

    answers: {
      type: [AnswerSchema],
      default: []
    },

    totalMarksObtained: {
      type: Number,
      default: 0,
      min: 0
    },

    grade: {
      type: String,
      trim: true
    },

    reviewComments: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

/* ===============================
   HOOKS
================================ */
AttemptSchema.pre("save", function (next) {
  if (this.submittedAt && this.startedAt) {
    this.durationSeconds = Math.floor(
      (this.submittedAt.getTime() - this.startedAt.getTime()) / 1000
    );
  }
  next();
});

/* ===============================
   INDEXES (CRITICAL)
================================ */
// One attempt per student per subject
AttemptSchema.index(
  { schoolId: 1, examSubjectId: 1, studentId: 1 },
  { unique: true }
);

export const Attempt = mongoose.model("Attempt", AttemptSchema);
