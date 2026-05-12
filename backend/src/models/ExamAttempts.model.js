// models/ExamAttempt.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    questionSnapshot: {
      statement: String,
      questionType: String,
      options: Array,
      marks: { type: Number, default: 0 },
      negativeMarks: { type: Number, default: 0 },
    },

    response: {
      type: Schema.Types.Mixed,
      default: null,
    },

    marksObtained: {
      type: Number,
      default: 0,
     
    },

    isCorrect: {
      type: Boolean,
      default: null,
    },

    flagged: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ExamAttemptSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },

    examSubjectId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSubject",
      index: true,
      default: null,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "abandoned"],
      default: "in_progress",
      index: true,
    },

    answers: {
      type: [AnswerSchema],
      default: [],
    },

    // ✅ Single source of truth
    totalMarksObtained: {
      type: Number,
      default: 0,
      
    },

    grade: {
      type: String,
      trim: true,
      default: "",
    },

    reviewComments: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

/* ===============================
   HOOKS
================================ */
ExamAttemptSchema.pre("save", function (next) {
  if (this.endedAt && !this.submittedAt) {
    this.submittedAt = this.endedAt;
  }

  // ✅ Auto calculate total marks from answers
  if (Array.isArray(this.answers)) {
    this.totalMarksObtained = this.answers.reduce(
      (sum, ans) => sum + (Number(ans.marksObtained) || 0),
      0
    );
  }

  if (this.submittedAt && this.startedAt) {
    this.durationSeconds = Math.max(
      0,
      Math.floor(
        (this.submittedAt.getTime() - this.startedAt.getTime()) / 1000
      )
    );
  }

  next();
});

/* ===============================
   INDEXES
================================ */
ExamAttemptSchema.index(
  { schoolId: 1, examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

ExamAttemptSchema.index({
  schoolId: 1,
  examId: 1,
  examSubjectId: 1,
  status: 1,
});

// ✅ Prevent OverwriteModelError
export const ExamAttempt =
  mongoose.models.ExamAttempt ||
  mongoose.model("ExamAttempt", ExamAttemptSchema);