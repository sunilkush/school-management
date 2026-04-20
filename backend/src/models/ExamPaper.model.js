import mongoose, { Schema } from "mongoose";

const paperQuestionSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    marks: { type: Number, required: true, min: 0 },
    order: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const paperSectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: "" },
    totalMarks: { type: Number, default: 0, min: 0 },
    questions: { type: [paperQuestionSchema], default: [] },
  },
  { _id: false }
);

const examPaperSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    title: { type: String, required: true, trim: true },
    sections: { type: [paperSectionSchema], default: [] },
    passingMarks: { type: Number, required: true, min: 0 },
    negativeMarking: { type: Number, default: 0, min: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examPaperSchema.index({ schoolId: 1, academicYearId: 1, examId: 1 }, { unique: true });

export const ExamPaper = mongoose.models.ExamPaper || mongoose.model("ExamPaper", examPaperSchema);
