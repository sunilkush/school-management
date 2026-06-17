import mongoose, { Schema } from "mongoose";

const AdmissionInquirySchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },

    /* Applicant details */
    studentName:  { type: String, required: true, trim: true },
    dateOfBirth:  { type: Date },
    gender:       { type: String, enum: ["male", "female", "other"] },
    applyingClass:{ type: String, required: true, trim: true },
    academicYear: { type: String, trim: true },

    /* Parent / Guardian */
    parentName:   { type: String, required: true, trim: true },
    parentPhone:  { type: String, required: true, trim: true },
    parentEmail:  { type: String, trim: true, lowercase: true },
    relationship: { type: String, enum: ["father", "mother", "guardian"], default: "father" },
    address:      { type: String, trim: true },

    /* Previous school */
    previousSchool: { type: String, trim: true },
    previousClass:  { type: String, trim: true },

    /* Pipeline status */
    status: {
      type:    String,
      enum:    ["new", "contacted", "visit_scheduled", "docs_submitted", "approved", "enrolled", "rejected", "waitlist"],
      default: "new",
      index:   true,
    },

    /* Follow-up */
    followUpDate:  { type: Date },
    notes:         { type: String, trim: true, maxlength: 1000 },
    source:        { type: String, enum: ["walk-in", "phone", "website", "referral", "social_media", "other"], default: "walk-in" },

    /* Assigned staff */
    assignedTo:   { type: Schema.Types.ObjectId, ref: "User" },

    /* Conversion */
    convertedStudentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    convertedAt:        { type: Date, default: null },
  },
  { timestamps: true },
);

AdmissionInquirySchema.index({ schoolId: 1, status: 1 });
AdmissionInquirySchema.index({ schoolId: 1, createdAt: -1 });

export const AdmissionInquiry = mongoose.model("AdmissionInquiry", AdmissionInquirySchema);
