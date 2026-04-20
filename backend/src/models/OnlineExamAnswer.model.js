import mongoose, { Schema } from "mongoose";

const onlineExamAnswerSchema = new Schema(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "OnlineExamAttempt",
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    questionType: { type: String, required: true },
    response: { type: Schema.Types.Mixed, default: null },
    isMarkedForReview: { type: Boolean, default: false },
    autoEvaluated: { type: Boolean, default: false },
    isCorrect: { type: Boolean, default: null },
    obtainedMarks: { type: Number, default: 0, min: 0 },
    maxMarks: { type: Number, default: 0, min: 0 },
    evaluatorRemarks: { type: String, trim: true, default: "" },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

onlineExamAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const OnlineExamAnswer =
  mongoose.models.OnlineExamAnswer || mongoose.model("OnlineExamAnswer", onlineExamAnswerSchema);
