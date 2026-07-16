import mongoose, { Schema } from "mongoose";

export const SPORTS_TEAM_CATEGORIES = ["Sport", "Cultural", "Club", "Other"];

const sportsTeamSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: SPORTS_TEAM_CATEGORIES, default: "Sport" },
    sportType: { type: String, trim: true, default: "" },
    coachId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null },

    members: {
      type: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: "Student" },
          studentName: { type: String, trim: true },
          position: { type: String, trim: true, default: "" },
          joinedDate: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

sportsTeamSchema.index({ schoolId: 1, category: 1 });

export const SportsTeam =
  mongoose.models.SportsTeam || mongoose.model("SportsTeam", sportsTeamSchema);
