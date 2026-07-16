import mongoose, { Schema } from "mongoose";

export const CERTIFICATE_TYPES = [
  "Transfer Certificate",
  "Bonafide Certificate",
  "Character Certificate",
  "Study Certificate",
];

const certificateSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "StudentEnrollment", default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    certificateType: { type: String, enum: CERTIFICATE_TYPES, required: true, index: true },
    certificateNumber: { type: String, required: true, trim: true, uppercase: true },
    issueDate: { type: Date, required: true, default: Date.now },

    // ── Snapshot fields (captured at generation time) ──
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, trim: true, default: "" },
    className: { type: String, trim: true, default: "" },
    sectionName: { type: String, trim: true, default: "" },
    rollNumber: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    admissionDate: { type: Date, default: null },

    // ── Type-specific fields ──
    conduct: { type: String, trim: true, default: "" }, // Transfer, Character
    dateOfLeaving: { type: Date, default: null }, // Transfer
    reasonForLeaving: { type: String, trim: true, default: "" }, // Transfer
    purpose: { type: String, trim: true, default: "" }, // Bonafide, Study
    remarks: { type: String, trim: true, default: "" },

    signatoryName: { type: String, trim: true, default: "" },
    signatoryDesignation: { type: String, trim: true, default: "Principal" },

    status: { type: String, enum: ["Issued", "Revoked"], default: "Issued", index: true },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    revokeReason: { type: String, trim: true, default: "" },

    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

certificateSchema.index({ schoolId: 1, certificateType: 1, certificateNumber: 1 }, { unique: true });
certificateSchema.index({ schoolId: 1, studentId: 1, certificateType: 1 });
certificateSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export const Certificate =
  mongoose.models.Certificate || mongoose.model("Certificate", certificateSchema);
