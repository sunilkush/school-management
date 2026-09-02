import mongoose, { Schema } from "mongoose";

/**
 * Defines ONE reporting period for a school — "Term 1", "Half Yearly", "Annual" — by naming the
 * exams that roll up into it and how much each one counts.
 *
 * This is the piece the system was missing: ExamResult already holds a complete, ranked,
 * publishable result, but only for a SINGLE exam. A report card spans several, so the weightages
 * live here rather than being hardcoded per school.
 */

const templateExamSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    // Relative weight of this exam in the term. Does not have to total 100 across the array —
    // generation normalises by the weight of the exams a student actually has a result for, so a
    // pupil who missed one exam is scored on the ones they sat instead of being dragged to zero.
    weightage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const coScholasticAreaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },      // "Discipline", "Art", "Sports"
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const reportCardTemplateSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },

    name: { type: String, required: true, trim: true },       // "Term 1 — 2026-27"
    exams: { type: [templateExamSchema], default: [] },
    coScholasticAreas: { type: [coScholasticAreaSchema], default: [] },

    // attendance.model.js has no academicYearId, so the period is expressed as a date range.
    // Term-scoped attendance is what belongs on a term report card anyway.
    attendanceFrom: { type: Date, default: null },
    attendanceTo: { type: Date, default: null },

    options: {
      showAttendance: { type: Boolean, default: true },
      showRank: { type: Boolean, default: true },
      showRemarks: { type: Boolean, default: true },
      showPerExamBreakdown: { type: Boolean, default: true },
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

reportCardTemplateSchema.index({ schoolId: 1, academicYearId: 1, name: 1 }, { unique: true });

export const ReportCardTemplate =
  mongoose.models.ReportCardTemplate ||
  mongoose.model("ReportCardTemplate", reportCardTemplateSchema);
