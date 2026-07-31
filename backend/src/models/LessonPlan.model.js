import mongoose from "mongoose";
const { Schema } = mongoose;

const lessonPlanSchema = new Schema(
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
    teacherId: {
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
    objectives: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    teachingMethods: {
      type: [String],
      default: [],
    },
    resources: {
      type: [String],
      default: [],
    },
    assessment: {
      type: String,
      trim: true,
      default: "",
    },
    plannedDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 45,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "completed"],
      default: "draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

lessonPlanSchema.index({ schoolId: 1, academicYearId: 1, teacherId: 1, plannedDate: 1 });

export const LessonPlan = mongoose.model("LessonPlan", lessonPlanSchema);
