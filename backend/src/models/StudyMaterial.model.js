import mongoose from "mongoose";
const { Schema } = mongoose;

const studyMaterialSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["book", "notes", "video", "assignment", "question_paper", "other"],
      default: "notes",
    },
    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },
    fileName: {
      type: String,
      trim: true,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    externalLink: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ schoolId: 1, academicYearId: 1, schoolClassId: 1, subjectId: 1 });

export const StudyMaterial = mongoose.model("StudyMaterial", studyMaterialSchema);
