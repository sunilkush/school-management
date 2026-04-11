import mongoose, { Schema } from "mongoose";

const examResultSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null, index: true },

    subjects: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        subjectName: { type: String, trim: true },
        obtainedMarks: { type: Number, required: true, min: 0 },
        totalMarks: { type: Number, required: true, min: 0 },
        passingMarks: { type: Number, required: true, min: 0 },
        isPassed: { type: Boolean, required: true },
      },
    ],

    totalObtainedMarks: { type: Number, required: true, min: 0 },
    totalMaximumMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true, trim: true },
    resultStatus: { type: String, enum: ["PASS", "FAIL"], required: true },
    rank: { type: Number, min: 1, default: null },

    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

examResultSchema.index({ schoolId: 1, examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ schoolId: 1, examId: 1, schoolClassId: 1, sectionId: 1, rank: 1 });

export const ExamResult =
  mongoose.models.ExamResult || mongoose.model("ExamResult", examResultSchema);
