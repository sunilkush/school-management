import mongoose, { Schema } from "mongoose";

const admitCardSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      trim: true,
      required: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    seatNumber: {
      type: String,
      trim: true,
      required: true,
    },
    examTitle: {
      type: String,
      trim: true,
      required: true,
    },
    examDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    className: {
      type: String,
      trim: true,
    },
    sectionName: {
      type: String,
      trim: true,
    },
    subjectName: {
      type: String,
      trim: true,
    },
    instructions: {
      type: [String],
      default: [],
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

admitCardSchema.index({ examId: 1, studentId: 1 }, { unique: true });
admitCardSchema.index({ examId: 1, seatNumber: 1 }, { unique: true });

export const AdmitCard =
  mongoose.models.AdmitCard || mongoose.model("AdmitCard", admitCardSchema);
