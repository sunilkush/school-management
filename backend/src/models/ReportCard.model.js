import mongoose, { Schema } from "mongoose";

/**
 * One student's consolidated card for one reporting period (ReportCardTemplate).
 *
 * Generated from the ExamResult documents of the template's exams, then finished by hand: the
 * class teacher fills the co-scholastic grades and remarks, and only then is it published. The
 * publish fields mirror ExamResult's so both surfaces behave the same way for parents.
 *
 * Marks are stored denormalised on purpose — a published report card is a record of what was
 * issued, and must not silently change if an exam result is edited or a grading scale is
 * retuned afterwards.
 */

const componentSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    examName: { type: String, trim: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
    // Carried through from ExamResult so a reader can verify the pass/fail decision from the
    // card alone, instead of it being an opaque flag computed at generation time.
    passingMarks: { type: Number, default: 0, min: 0 },
    weightage: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const subjectSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true },
    components: { type: [componentSchema], default: [] },
    // Weighted across whichever components exist for this student, then graded.
    weightedPercentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, trim: true },
    // Weighted obtained >= weighted passing across this subject's components.
    isPassed: { type: Boolean, default: true },
  },
  { _id: false }
);

const coScholasticSchema = new Schema(
  {
    area: { type: String, required: true, trim: true },
    grade: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const reportCardSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: "ReportCardTemplate", required: true, index: true },

    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null, index: true },

    subjects: { type: [subjectSchema], default: [] },
    coScholastic: { type: [coScholasticSchema], default: [] },

    attendance: {
      presentDays: { type: Number, default: 0 },
      totalDays: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    },

    totals: {
      obtainedMarks: { type: Number, default: 0, min: 0 },
      maximumMarks: { type: Number, default: 0, min: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      grade: { type: String, trim: true, default: "" },
      resultStatus: { type: String, enum: ["PASS", "FAIL"], default: "PASS" },
    },

    rank: { type: Number, min: 1, default: null },
    classTeacherRemarks: { type: String, trim: true, maxlength: 1000, default: "" },

    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Re-generating a term for a class must update each student's card, never add a second one.
reportCardSchema.index({ schoolId: 1, templateId: 1, studentId: 1 }, { unique: true });
reportCardSchema.index({ schoolId: 1, templateId: 1, schoolClassId: 1, sectionId: 1, rank: 1 });

export const ReportCard =
  mongoose.models.ReportCard || mongoose.model("ReportCard", reportCardSchema);
