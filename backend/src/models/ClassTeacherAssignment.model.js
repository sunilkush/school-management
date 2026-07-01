import mongoose, { Schema } from "mongoose";

const classTeacherAssignmentSchema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// One class-section can have only one active class teacher per academic year
classTeacherAssignmentSchema.index(
  { schoolClassId: 1, sectionId: 1, academicYearId: 1, schoolId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// One teacher can be class teacher of only one class per academic year per school
classTeacherAssignmentSchema.index(
  { teacherId: 1, academicYearId: 1, schoolId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

classTeacherAssignmentSchema.index({ schoolId: 1, academicYearId: 1 });
classTeacherAssignmentSchema.index({ teacherId: 1 });

export const ClassTeacherAssignment = mongoose.model(
  "ClassTeacherAssignment",
  classTeacherAssignmentSchema
);
