import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },

    // Sections linked with this class
    sections: [
      {
        sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
        inChargeId: { type: Schema.Types.ObjectId, ref: "User" }, // section teacher
      },
    ],

    // Main Class Teacher (Homeroom teacher)
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },

    // Students enrolled in this class
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Optional subjects cached in the class document (can sync with ClassSubject collection)
    subjects: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        periodPerWeek: { type: Number, default: 0 },
        isCompulsory: { type: Boolean, default: true },
      },
    ],

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

classSchema.index({ name: 1, schoolId: 1, academicYearId: 1 }, { unique: true });
classSchema.index({ schoolId: 1, academicYearId: 1 });

export const Class = mongoose.model("Class", classSchema);
