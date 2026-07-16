import mongoose, { Schema } from "mongoose";

export const ACHIEVEMENT_HOLDER_TYPES = ["Student", "Team"];
export const ACHIEVEMENT_LEVELS = ["School", "District", "State", "National", "International"];

const achievementSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    holderType: { type: String, enum: ACHIEVEMENT_HOLDER_TYPES, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    teamId: { type: Schema.Types.ObjectId, ref: "SportsTeam", default: null },
    holderName: { type: String, trim: true, default: "" },

    title: { type: String, required: true, trim: true },
    level: { type: String, enum: ACHIEVEMENT_LEVELS, default: "School" },
    position: { type: String, trim: true, default: "" },
    eventName: { type: String, trim: true, default: "" },
    achievementDate: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true, default: "" },
    certificateUrl: { type: String, trim: true, default: "" },

    recordedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

achievementSchema.index({ schoolId: 1, holderType: 1, achievementDate: -1 });
achievementSchema.index({ studentId: 1 });
achievementSchema.index({ teamId: 1 });

export const Achievement =
  mongoose.models.Achievement || mongoose.model("Achievement", achievementSchema);
