import mongoose, { Schema } from "mongoose";

const classSubjectSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    schoolschoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
      index: true
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true
    },

    periodPerWeek: {
      type: Number,
      default: 0,
      min: 0
    },

    isCompulsory: {
      type: Boolean,
      default: true
    },

    marksConfig: {
      maxMarks: { type: Number, default: 100 },
      passMarks: { type: Number, default: 33 }
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

/* Unique subject assignment */
classSubjectSchema.index(
  {
    schoolschoolClassId: 1,
    sectionId: 1,
    subjectId: 1,
    academicYearId: 1
  },
  { unique: true }
);

/* Teacher schedule queries */
classSubjectSchema.index({
  teacherId: 1,
  academicYearId: 1
});

export const ClassSubject =
  mongoose.models.ClassSubject ||
  mongoose.model("ClassSubject", classSubjectSchema);