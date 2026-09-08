import mongoose, { Schema } from "mongoose";

/**
 * One person confirming they have read a circular.
 *
 * Deliberately separate from "opened it". Opening a document and agreeing you have understood it
 * are different claims, and only the second one is worth anything when a school later has to show
 * that every parent was told about a policy change. Both are recorded here, but they are recorded
 * as different things: `viewedAt` happens on its own, `acknowledgedAt` only when somebody presses
 * the button.
 *
 * `acknowledgementText` is copied onto the row rather than read back from the circular. The
 * wording is what was agreed to, and a record of agreement that points at text living somewhere
 * else is only as good as that text never changing.
 */

const circularAcknowledgementSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    circularId: { type: Schema.Types.ObjectId, ref: "Circular", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    viewedAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    acknowledgementText: { type: String, trim: true, default: "" },

    /** For a parent acknowledging on behalf of a child, so the record says which child. */
    onBehalfOfStudentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },

    note: { type: String, trim: true, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

// One row per person per circular — a second would make "how many acknowledged" a guess.
circularAcknowledgementSchema.index({ circularId: 1, userId: 1 }, { unique: true });
circularAcknowledgementSchema.index({ schoolId: 1, userId: 1, acknowledgedAt: 1 });

export const CircularAcknowledgement =
  mongoose.models.CircularAcknowledgement ||
  mongoose.model("CircularAcknowledgement", circularAcknowledgementSchema);
