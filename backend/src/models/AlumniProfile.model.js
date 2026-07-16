import mongoose, { Schema } from "mongoose";

const alumniProfileSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // ── Snapshot at graduation ──
    fullName: { type: String, required: true, trim: true },
    graduationYear: { type: Number, required: true },
    lastClassName: { type: String, trim: true, default: "" },
    lastSectionName: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },

    // ── Alumni-maintained fields ──
    currentOccupation: { type: String, trim: true, default: "" },
    currentEmployer: { type: String, trim: true, default: "" },
    higherEducation: {
      institution: { type: String, trim: true, default: "" },
      course: { type: String, trim: true, default: "" },
    },
    currentAddress: { type: String, trim: true, default: "" },
    currentPhone: { type: String, trim: true, default: "" },
    currentEmail: { type: String, trim: true, default: "" },
    linkedInUrl: { type: String, trim: true, default: "" },

    achievements: {
      type: [
        {
          title: { type: String, trim: true },
          description: { type: String, trim: true },
          year: { type: Number },
        },
      ],
      default: [],
    },

    engagementNotes: { type: String, trim: true, default: "" },
    isReachable: { type: Boolean, default: true },

    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    graduatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alumniProfileSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });
alumniProfileSchema.index({ schoolId: 1, graduationYear: 1 });

export const AlumniProfile =
  mongoose.models.AlumniProfile || mongoose.model("AlumniProfile", alumniProfileSchema);
