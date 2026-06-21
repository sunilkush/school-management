import mongoose, { Schema } from "mongoose";

const counselingSessionSchema = new Schema(
  {
    schoolId:     { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: "StudentEnrollment" },
    studentName:  { type: String, trim: true },
    studentClass: { type: String, trim: true },
    counselorId:  { type: Schema.Types.ObjectId, ref: "User" },
    type:         { type: String, enum: ["Session", "Appointment"], default: "Session" },
    issue:        { type: String, required: true, trim: true },
    sessionDate:  { type: Date, required: true },
    duration:     { type: Number, default: 30 },
    notes:        { type: String, trim: true },
    status:       { type: String, enum: ["Scheduled", "Completed", "Cancelled", "No Show"], default: "Scheduled" },
    followUpDate: { type: Date },
    mood:         { type: String, enum: ["Happy", "Neutral", "Anxious", "Sad", "Angry"] },
  },
  { timestamps: true }
);

counselingSessionSchema.index({ schoolId: 1, sessionDate: -1 });
counselingSessionSchema.index({ schoolId: 1, type: 1 });

export const CounselingSession = mongoose.model("CounselingSession", counselingSessionSchema);
