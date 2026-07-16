import mongoose, { Schema } from "mongoose";

export const DISCIPLINE_CATEGORIES = [
  "Attendance",
  "Behavior",
  "Academic Integrity",
  "Property Damage",
  "Bullying",
  "Other",
];

const disciplineIncidentSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, trim: true, default: "" },
    className: { type: String, trim: true, default: "" },
    sectionName: { type: String, trim: true, default: "" },

    incidentDate: { type: Date, required: true, default: Date.now },
    category: { type: String, enum: DISCIPLINE_CATEGORIES, default: "Behavior" },
    description: { type: String, required: true, trim: true },

    severity: { type: String, enum: ["Minor", "Moderate", "Major"], default: "Minor" },
    demeritPoints: { type: Number, default: 0, min: 0 },
    actionTaken: { type: String, trim: true, default: "" },
    witnesses: { type: [String], default: [] },

    parentMeetingRequired: { type: Boolean, default: false },
    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: { type: Date, default: null },

    followUpDate: { type: Date, default: null },
    status: { type: String, enum: ["Open", "Resolved"], default: "Open", index: true },

    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

disciplineIncidentSchema.index({ schoolId: 1, studentId: 1, incidentDate: -1 });
disciplineIncidentSchema.index({ schoolId: 1, status: 1 });

export const DisciplineIncident =
  mongoose.models.DisciplineIncident || mongoose.model("DisciplineIncident", disciplineIncidentSchema);
