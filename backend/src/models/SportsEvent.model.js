import mongoose, { Schema } from "mongoose";

export const SPORTS_EVENT_TYPES = ["Match", "Tournament", "Competition", "Practice"];

const sportsEventSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    title: { type: String, required: true, trim: true },
    teamId: { type: Schema.Types.ObjectId, ref: "SportsTeam", default: null },
    eventType: { type: String, enum: SPORTS_EVENT_TYPES, default: "Match" },
    opponent: { type: String, trim: true, default: "" },
    eventDate: { type: Date, required: true, default: Date.now },
    venue: { type: String, trim: true, default: "" },

    result: { type: String, enum: ["Win", "Loss", "Draw", "Pending"], default: "Pending" },
    scoreDetails: { type: String, trim: true, default: "" },

    participants: {
      type: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: "Student" },
          studentName: { type: String, trim: true },
        },
      ],
      default: [],
    },

    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

sportsEventSchema.index({ schoolId: 1, teamId: 1, eventDate: -1 });
sportsEventSchema.index({ schoolId: 1, eventType: 1 });

export const SportsEvent =
  mongoose.models.SportsEvent || mongoose.model("SportsEvent", sportsEventSchema);
