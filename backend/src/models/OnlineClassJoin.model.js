import mongoose, { Schema } from "mongoose";

/**
 * A record that somebody opened the meeting link through the portal.
 *
 * Read it for exactly what it is. This says a student clicked join — not that they sat through
 * the lesson, and not that they were paying attention. The video call is somewhere else and
 * this system cannot see inside it. Presenting these as attendance would be a lie a school then
 * reports to parents, so attendance is never marked from them automatically: a teacher marks the
 * register with this list in front of them, which is the honest use for it.
 *
 * One row per person per class. Rejoining after a dropped connection updates the row rather than
 * making a second one, so the count means "people", not "clicks".
 */

const onlineClassJoinSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    onlineClassId: { type: Schema.Types.ObjectId, ref: "OnlineClass", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, trim: true, default: "student" },

    firstJoinedAt: { type: Date, required: true },
    lastJoinedAt: { type: Date, required: true },
    joinCount: { type: Number, default: 1, min: 1 },

    /** Minutes between the class starting and this person opening the link. Negative means they
     *  were early. It is the closest thing to "late" this data can honestly support. */
    minutesAfterStart: { type: Number, default: null },
  },
  { timestamps: true }
);

onlineClassJoinSchema.index({ onlineClassId: 1, userId: 1 }, { unique: true });

export const OnlineClassJoin =
  mongoose.models.OnlineClassJoin || mongoose.model("OnlineClassJoin", onlineClassJoinSchema);
