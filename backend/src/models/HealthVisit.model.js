import mongoose, { Schema } from "mongoose";

const healthVisitSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, trim: true, default: "" },
    className: { type: String, trim: true, default: "" },
    sectionName: { type: String, trim: true, default: "" },

    visitDate: { type: Date, required: true, default: Date.now },
    symptoms: { type: String, required: true, trim: true },
    treatmentGiven: { type: String, trim: true, default: "" },
    temperature: { type: Number, default: null }, // °F

    severity: { type: String, enum: ["Minor", "Moderate", "Severe"], default: "Minor" },

    referredToHospital: { type: Boolean, default: false },
    referredTo: { type: String, trim: true, default: "" },

    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: { type: Date, default: null },

    followUpDate: { type: Date, default: null },
    status: { type: String, enum: ["Open", "Resolved"], default: "Resolved", index: true },

    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

healthVisitSchema.index({ schoolId: 1, studentId: 1, visitDate: -1 });
healthVisitSchema.index({ schoolId: 1, status: 1 });

export const HealthVisit =
  mongoose.models.HealthVisit || mongoose.model("HealthVisit", healthVisitSchema);
