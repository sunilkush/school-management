// models/Question.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const OptionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true
    },

    chapter: {
      type: String,
      trim: true
    },

    topic: {
      type: String,
      trim: true
    },

    questionType: {
      type: String,
      enum: ["mcq_single", "mcq_multi", "true_false", "fill_blank", "match"],
      required: true
    },

    statement: {
      type: String,
      required: true,
      trim: true
    },

    options: {
      type: [OptionSchema],
      default: [],
      validate: {
        validator(value) {
          if (["mcq_single", "mcq_multi", "match"].includes(this.questionType)) {
            return value && value.length >= 2;
          }
          return true;
        },
        message: "Options are required for MCQ and Match questions"
      }
    },

    correctAnswers: {
      type: [{ type: String, trim: true }],
      default: []
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },

    marks: {
      type: Number,
      default: 1,
      min: 0
    },

    negativeMarks: {
      type: Number,
      default: 0,
      min: 0
    },

    tags: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: []
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* ===============================
   CONDITIONAL VALIDATIONS
================================ */
QuestionSchema.pre("validate", function (next) {
  const q = this;

  // MCQ Single
  if (q.questionType === "mcq_single") {
    if (q.correctAnswers.length !== 1) {
      return next(new Error("MCQ Single must have exactly 1 correct answer"));
    }
  }

  // MCQ Multiple
  if (q.questionType === "mcq_multi") {
    if (q.correctAnswers.length < 1) {
      return next(new Error("MCQ Multi must have at least 1 correct answer"));
    }
  }

  // True / False
  if (q.questionType === "true_false") {
    if (q.correctAnswers.length !== 1) {
      return next(new Error("True/False must have exactly 1 correct answer"));
    }
    const ans = q.correctAnswers[0].toLowerCase();
    if (!["true", "false"].includes(ans)) {
      return next(new Error("True/False answer must be 'true' or 'false'"));
    }
  }

  // Fill in the blank
  if (q.questionType === "fill_blank") {
    if (q.correctAnswers.length < 1) {
      return next(
        new Error("Fill in the Blank must have at least 1 correct answer")
      );
    }
  }

  // Match the following
  if (q.questionType === "match") {
    if (q.options.length < 2 || q.correctAnswers.length < 2) {
      return next(
        new Error("Match type must have at least 2 options and 2 correct answers")
      );
    }
  }

  // Validate correctAnswers against option keys
  if (["mcq_single", "mcq_multi", "match"].includes(q.questionType)) {
    const optionKeys = q.options.map(o => o.key);
    for (const ans of q.correctAnswers) {
      if (!optionKeys.includes(ans)) {
        return next(
          new Error(`Correct answer '${ans}' does not match any option key`)
        );
      }
    }
  }

  next();
});

/* ===============================
   INDEXES (Performance)
================================ */
QuestionSchema.index({
  schoolId: 1,
  classId: 1,
  subjectId: 1,
  difficulty: 1
});

export const Question = model("Question", QuestionSchema);
