import mongoose, { Schema } from "mongoose";

/**
 * One raw scan, exactly as the device reported it. Append-only: a punch is a record of something
 * that physically happened, so it is never edited or deleted, only interpreted.
 *
 * Attendance is DERIVED from these, not replaced by them. Keeping the raw layer separate is what
 * makes the awkward cases survivable — a card enrolled a week late can be replayed over punches
 * already collected, a mis-mapped card can be corrected and reprocessed, and a disputed absence
 * can be checked against what the reader actually saw.
 */

const devicePunchSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    deviceId: { type: Schema.Types.ObjectId, ref: "AttendanceDevice", required: true, index: true },

    /** The id the device sent. Meaningless on its own — AttendanceCredential gives it a person. */
    externalId: { type: String, required: true, trim: true },

    /**
     * Two clocks, kept apart on purpose. `punchedAt` is the device's own clock, which drifts and
     * is occasionally set wrong; `receivedAt` is when the server heard about it. When a device
     * uploads a backlog after a network outage the two are hours apart, and only the first one
     * describes when the person was actually at the door.
     */
    punchedAt: { type: Date, required: true },
    receivedAt: { type: Date, default: Date.now },

    direction: { type: String, enum: ["in", "out", "unknown"], default: "unknown" },

    /** Resolved person, or null while the credential is unknown. Null is a state to act on, not
     *  an error — it is what the unmatched-punch report lists. */
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    /** Set once this punch has been folded into an Attendance row. */
    appliedAt: { type: Date, default: null },
    attendanceId: { type: Schema.Types.ObjectId, ref: "Attendance", default: null },

    /** Whatever else the device sent, kept verbatim for working out why something went wrong. */
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Devices resend batches after a failed upload, and some resend the whole day. The same person,
// same device, same instant is the same event — the duplicate is rejected by the database rather
// than by a check that could race a concurrent upload.
devicePunchSchema.index(
  { schoolId: 1, deviceId: 1, externalId: 1, punchedAt: 1 },
  { unique: true }
);
devicePunchSchema.index({ schoolId: 1, userId: 1, punchedAt: -1 });
// Drives the unmatched report and the replay after a late enrolment.
devicePunchSchema.index({ schoolId: 1, userId: 1, appliedAt: 1 });

export const DevicePunch =
  mongoose.models.DevicePunch || mongoose.model("DevicePunch", devicePunchSchema);
