import mongoose from "mongoose";
const { Schema } = mongoose;

const assignmentSubmissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      required: true,
      index: true,
    },
    attachments: [{ type: Schema.Types.Mixed }],
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade:    { type: Number, default: null },
    feedback: { type: String, trim: true, default: "" },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index(
  { assignmentId: 1, studentEnrollmentId: 1 },
  { unique: true }
);

export const AssignmentSubmission = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);
