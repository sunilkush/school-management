import mongoose, { Schema } from "mongoose";

const subjectResultSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    totalMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    resultStatus: { type: String, enum: ["pass", "fail", "absent"], required: true },
  },
  { _id: false }
);

const examResultSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", index: true },
    examIds: [{ type: Schema.Types.ObjectId, ref: "Exam", required: true }],
    subjects: { type: [subjectResultSchema], default: [] },
    totalMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    overallGrade: { type: String, required: true },
    passStatus: { type: String, enum: ["pass", "fail", "withheld"], default: "pass" },
    classRank: { type: Number, default: null },
    sectionRank: { type: Number, default: null },
    publishStatus: {
      type: String,
      enum: ["draft", "published", "withheld", "locked"],
      default: "draft",
      index: true,
    },
    remarks: { type: String, trim: true, default: "" },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

examResultSchema.index({ schoolId: 1, academicYearId: 1, studentId: 1 }, { unique: true });

export const ExamResult = mongoose.models.ExamResult || mongoose.model("ExamResult", examResultSchema);
