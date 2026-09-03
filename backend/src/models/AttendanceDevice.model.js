import crypto from "crypto";
import mongoose, { Schema } from "mongoose";

/**
 * A physical attendance reader — a fingerprint terminal at the staff room door, an RFID reader
 * at the gate, a face terminal in reception.
 *
 * The device is treated as an untrusted client, not as a logged-in user. It has no session and
 * no password: it identifies itself with a public key and proves itself by signing each batch
 * with a shared secret (see devicePunch.service.js). This is the same shape the Razorpay
 * webhook already uses, for the same reason — the caller is a machine on someone else's network.
 *
 * Deliberately device-agnostic. ZKTeco, eSSL, Realtime and every RFID reader speak different
 * protocols, and hard-coding any one of them would tie a school to that vendor. Whatever sits in
 * front of the hardware — the vendor's own push, a small script on the school LAN, or a CSV
 * upload by the office — posts the same simple batch of punches here.
 */

const attendanceDeviceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },

    deviceType: {
      type: String,
      enum: ["biometric", "rfid", "face", "other"],
      default: "biometric",
    },

    /** Public identifier the device sends in the clear, used to look this record up. */
    deviceKey: { type: String, required: true, unique: true, index: true },

    /**
     * Shared HMAC secret. `select: false` so it never leaves the database by accident — the same
     * handling School.razorpay.webhookSecret gets. It cannot be stored as a hash: HMAC is
     * symmetric, so the server has to be able to recompute the signature.
     */
    secret: { type: String, required: true, select: false },

    /**
     * How to read a punch. "auto" is the honest default for a single reader at a door: the first
     * punch of the day is the arrival and the last is the departure, because a plain reader has
     * no idea which way a person is walking. Only set entry/exit when the hardware genuinely is
     * one-directional.
     */
    punchMode: { type: String, enum: ["auto", "entry", "exit"], default: "auto" },

    /** Which population this reader covers, so a staff-room device cannot mark students. */
    appliesTo: { type: [String], enum: ["student", "staff"], default: ["staff"] },

    isActive: { type: Boolean, default: true, index: true },

    // Health signals. A device that stopped talking is invisible otherwise — everyone simply
    // shows as absent, which looks exactly like a school where nobody turned up.
    lastSeenAt: { type: Date, default: null },
    lastPunchAt: { type: Date, default: null },
    totalPunches: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

attendanceDeviceSchema.index({ schoolId: 1, name: 1 });

/** A key/secret pair for a new device. Returned to the office once, at registration. */
export const generateDeviceCredentials = () => ({
  deviceKey: `dev_${crypto.randomBytes(9).toString("hex")}`,
  secret: crypto.randomBytes(32).toString("hex"),
});

export const AttendanceDevice =
  mongoose.models.AttendanceDevice || mongoose.model("AttendanceDevice", attendanceDeviceSchema);
