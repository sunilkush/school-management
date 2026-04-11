import mongoose, { Schema } from "mongoose";

const studentTransportAssignmentSchema = new Schema(
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
    studentEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
      required: true,
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Transport",
      required: true,
    },
    pickupStop: {
      type: String,
      trim: true,
      default: "",
    },
    dropStop: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

studentTransportAssignmentSchema.index(
  { studentEnrollmentId: 1, academicYearId: 1 },
  { unique: true }
);

export const StudentTransportAssignment =
  mongoose.models.StudentTransportAssignment ||
  mongoose.model("StudentTransportAssignment", studentTransportAssignmentSchema);
