import mongoose, { Schema } from "mongoose";

const classSubjectSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },

    periodPerWeek: { type: Number, default: 0, min: 0 },
    isCompulsory: { type: Boolean, default: true },

    maxMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 33 },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Ensure one subject is not assigned multiple times to same class/section/year
classSubjectSchema.index(
  { classId: 1, sectionId: 1, subjectId: 1, academicYearId: 1, schoolId: 1 },
  { unique: true }
);

// Quick searches
classSubjectSchema.index({ teacherId: 1, academicYearId: 1 });

export const ClassSubject = mongoose.model("ClassSubject", classSubjectSchema);
