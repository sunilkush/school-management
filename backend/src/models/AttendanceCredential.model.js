import mongoose, { Schema } from "mongoose";

/**
 * What a reader actually sees, tied to who it belongs to — the card number on a student's ID,
 * the enrolment number a fingerprint terminal stores against a finger.
 *
 * This mapping is the whole integration. A device never knows a person; it knows an id. Without
 * a row here a punch is an anonymous event, which is why unmatched punches are kept rather than
 * dropped: enrol the card later and the punches already collected can be replayed.
 *
 * One person can hold several — a card and a fingerprint, or a replacement card — so the
 * uniqueness that matters is that one *live* credential id belongs to one person.
 */

const attendanceCredentialSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    /** Attendance.role for this person, copied here so a punch does not need a second lookup. */
    role: { type: String, required: true },

    /** Exactly what the device reports: card UID, biometric enrolment number, face template id. */
    externalId: { type: String, required: true, trim: true },
    credentialType: { type: String, enum: ["biometric", "rfid", "face", "other"], default: "rfid" },

    label: { type: String, trim: true, default: "" },

    isActive: { type: Boolean, default: true },
    issuedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Partial on isActive so a lost card can be revoked and its number reissued later — a plain
// unique index would block that forever, and in practice cards do get recycled.
attendanceCredentialSchema.index(
  { schoolId: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
attendanceCredentialSchema.index({ schoolId: 1, userId: 1 });

export const AttendanceCredential =
  mongoose.models.AttendanceCredential ||
  mongoose.model("AttendanceCredential", attendanceCredentialSchema);
