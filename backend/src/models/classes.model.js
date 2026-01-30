import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", index: true },

    isGlobal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    sections: [
      {
        sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
        inChargeId: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],

    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],

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

classSchema.index({ name: 1, schoolId: 1, academicYearId: 1, }, { unique: true, sparse: true });
classSchema.index({ schoolId: 1, academicYearId: 1 });

// ✅ Safe model registration (avoids overwrite errors)
const Class = mongoose.models.Class || mongoose.model("Class", classSchema);

export default Class;
