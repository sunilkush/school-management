import mongoose from "mongoose";

const studentEnrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
       trim: true,
      uppercase: true,
    },
    schoolClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    feeDiscount: {
      type: Number,
      default: 0,
    },
    smsMobile: String,
    mobileNumber: String,

    status: {
      type: String,
      enum: ["Active", "Promoted", "Transferred", "Alumni", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔑 Prevent duplicate enrollment of same student in same academic year & school
studentEnrollmentSchema.index(
  { studentId: 1, academicYearId: 1, schoolId: 1 },
  { unique: true }
);
studentEnrollmentSchema.index({ schoolId: 1, academicYearId: 1 });
studentEnrollmentSchema.index(
  { schoolId: 1, academicYearId: 1, registrationNumber: 1 },
  { unique: true }
);
studentEnrollmentSchema.index({ createdAt: -1 });

export const StudentEnrollment = mongoose.model(
  "StudentEnrollment",
  studentEnrollmentSchema
);
