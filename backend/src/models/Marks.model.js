import mongoose, { Schema } from "mongoose";

const marksSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },

    totalMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },

    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isFinalSubmitted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

marksSchema.index(
  { schoolId: 1, examId: 1, studentId: 1, subjectId: 1 },
  { unique: true }
);

marksSchema.index({ schoolId: 1, schoolClassId: 1, sectionId: 1, examId: 1, studentId: 1 });

marksSchema.pre("validate", function (next) {
  if (this.obtainedMarks > this.totalMarks) {
    return next(new Error("Obtained marks cannot exceed total marks"));
  }

  if (this.passingMarks > this.totalMarks) {
    return next(new Error("Passing marks cannot exceed total marks"));
  }

  next();
});

export const Marks = mongoose.models.Marks || mongoose.model("Marks", marksSchema);
