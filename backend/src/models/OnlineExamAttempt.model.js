import mongoose, { Schema } from "mongoose";

const onlineExamAttemptSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    examPaperId: { type: Schema.Types.ObjectId, ref: "ExamPaper", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "auto_submitted", "evaluated", "absent"],
      default: "in_progress",
      index: true,
    },
    attemptNumber: { type: Number, default: 1, min: 1 },
    markedForReviewQuestionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    objectiveScore: { type: Number, default: 0, min: 0 },
    subjectiveScore: { type: Number, default: 0, min: 0 },
    graceMarks: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, default: 0, min: 0 },
    isFinalized: { type: Boolean, default: false, index: true },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    evaluatorRemarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

onlineExamAttemptSchema.index(
  { examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

export const OnlineExamAttempt =
  mongoose.models.OnlineExamAttempt || mongoose.model("OnlineExamAttempt", onlineExamAttemptSchema);
