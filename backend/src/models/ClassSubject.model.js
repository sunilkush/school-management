import mongoose, { Schema } from "mongoose";

const classSubjectSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Teacher assigned for this subject in this class
      required: true,
    },
    periodPerWeek: {
      type: Number,
      default: 0, // timetable usage
    },
    isCompulsory: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
      academicYearId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'AcademicYear', 
        required: true 
    }
  },
  { timestamps: true }
);

export const ClassSubject = mongoose.model(
  "ClassSubject",
  classSubjectSchema
);
