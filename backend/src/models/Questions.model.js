import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "School", 
      required: true 
    },
    subjectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Subject", 
      required: true 
    },
    chapter: { type: String, trim: true },
    topic: { type: String, trim: true },

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

    options: [
      {
        key: { type: String, trim: true },
        text: { type: String, trim: true }
      }
    ],

    correctAnswers: [{ type: String, trim: true }],

    difficulty: { 
      type: String, 
      enum: ["easy", "medium", "hard"], 
      default: "medium" 
    },

    marks: { type: Number, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },

    tags: [{ type: String, trim: true, lowercase: true }],

    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// ✅ Conditional validation
QuestionSchema.pre("validate", function (next) {
  const q = this;

  // MCQ Single
  if (q.questionType === "mcq_single") {
    if (!q.options || q.options.length < 2) {
      return next(new Error("MCQ Single must have at least 2 options."));
    }
    if (!q.correctAnswers || q.correctAnswers.length !== 1) {
      return next(new Error("MCQ Single must have exactly 1 correct answer."));
    }
  }

  // MCQ Multiple
  if (q.questionType === "mcq_multi") {
    if (!q.options || q.options.length < 2) {
      return next(new Error("MCQ Multi must have at least 2 options."));
    }
    if (!q.correctAnswers || q.correctAnswers.length < 1) {
      return next(new Error("MCQ Multi must have at least 1 correct answer."));
    }
  }

  // True/False
  if (q.questionType === "true_false") {
    if (!q.correctAnswers || q.correctAnswers.length !== 1) {
      return next(new Error("True/False must have exactly 1 correct answer."));
    }
    const ans = q.correctAnswers[0].toLowerCase();
    if (!["true", "false"].includes(ans)) {
      return next(new Error("True/False answer must be 'true' or 'false'."));
    }
  }

  // Fill in the Blank
  if (q.questionType === "fill_blank") {
    if (!q.correctAnswers || q.correctAnswers.length < 1) {
      return next(new Error("Fill in the Blank must have at least 1 correct answer."));
    }
  }

  // Match the Following
  if (q.questionType === "match") {
    if (!q.options || q.options.length < 2) {
      return next(new Error("Match type must have at least 2 pairs."));
    }
    if (!q.correctAnswers || q.correctAnswers.length < 2) {
      return next(new Error("Match type must have at least 2 correct matches."));
    }
  }

  next();
});

export const Question = mongoose.model("Question", QuestionSchema);
