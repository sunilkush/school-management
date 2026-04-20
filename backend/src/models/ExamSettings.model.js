import mongoose, { Schema } from "mongoose";

const gradeRangeSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    gradePoint: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const examSettingsSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    examTypes: {
      type: [String],
      enum: [
        "Unit Test",
        "Weekly Test",
        "Monthly Test",
        "Quarterly",
        "Half Yearly",
        "Annual",
        "Practice Test",
        "Online Mock Test",
      ],
      default: ["Unit Test", "Monthly Test", "Quarterly", "Half Yearly", "Annual"],
    },
    gradeRanges: { type: [gradeRangeSchema], default: [] },
    passingRule: {
      minimumPercentage: { type: Number, default: 33, min: 0, max: 100 },
      subjectWisePassingRequired: { type: Boolean, default: true },
      allowGraceMarks: { type: Boolean, default: false },
      graceMarksLimit: { type: Number, default: 0, min: 0 },
    },
    resultRules: {
      autoPublish: { type: Boolean, default: false },
      publishAfterEvaluation: { type: Boolean, default: true },
      moderationAllowed: { type: Boolean, default: true },
      moderationWindowHours: { type: Number, default: 24, min: 0 },
    },
    onlineRules: {
      defaultMaxAttempts: { type: Number, default: 1, min: 1 },
      allowResume: { type: Boolean, default: true },
      autoSubmitOnTimeout: { type: Boolean, default: true },
      showResultImmediately: { type: Boolean, default: false },
      secureBrowserMode: { type: Boolean, default: false },
    },
    reportCardConfig: {
      includeAttendance: { type: Boolean, default: false },
      includeRemarks: { type: Boolean, default: true },
      includeClassRank: { type: Boolean, default: true },
      includeSectionRank: { type: Boolean, default: true },
      signatureLabel: { type: String, trim: true, default: "Principal" },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examSettingsSchema.index({ schoolId: 1, academicYearId: 1 }, { unique: true });

export const ExamSettings =
  mongoose.models.ExamSettings || mongoose.model("ExamSettings", examSettingsSchema);
