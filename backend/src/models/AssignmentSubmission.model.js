import mongoose, { Schema } from "mongoose";

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
      ref: "AcademicYears",
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
    attachments: [{ type: String }],
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
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
