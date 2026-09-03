import mongoose from "mongoose";

import { Attendance } from "../models/attendance.model.js";
import { AttendanceCredential } from "../models/AttendanceCredential.model.js";
import { AttendanceDevice, generateDeviceCredentials } from "../models/AttendanceDevice.model.js";
import { DevicePunch } from "../models/DevicePunch.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  applyPunches,
  ingestPunches,
  replayUnmatched,
  unmatchedReport,
  verifyDeviceSignature,
} from "../services/devicePunch.service.js";

/**
 * Biometric and RFID attendance devices: registering a reader, telling it who each card belongs
 * to, and receiving what it scans.
 *
 * The ingestion endpoint is the only unauthenticated one. A reader on a school's LAN has no
 * account to log in with, so it proves itself by signing each batch with its shared secret —
 * the same arrangement the Razorpay webhook uses, and for the same reason.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

/* ── Ingestion (device-facing, HMAC-authenticated) ───────────────── */

/**
 * Receives a batch of scans.
 *
 * Returns 200 with counts for anything the device could not have prevented — duplicates from a
 * retried upload, punches from a card nobody has enrolled. A reader has no screen and no
 * operator; failing its upload over an unknown card would make it retry the same batch forever
 * and lose the punches that were fine.
 */
export const receivePunches = asyncHandler(async (req, res) => {
  const deviceKey = req.headers["x-device-key"];
  const signature = req.headers["x-device-signature"];
  if (!deviceKey || !signature) throw new ApiError(401, "Missing device key or signature");

  const device = await AttendanceDevice.findOne({ deviceKey }).select("+secret");
  // Same message either way — a different response for "no such device" would let anyone probe
  // which device keys exist.
  if (!device || !verifyDeviceSignature({ rawBody: req.rawBody, signature, secret: device.secret })) {
    throw new ApiError(401, "Device authentication failed");
  }
  if (!device.isActive) throw new ApiError(403, "This device has been deactivated");

  const result = await ingestPunches({ device, punches: req.body?.punches });
  const outcome = await applyPunches({
    schoolId: device.schoolId,
    punches: result.stored,
    device,
  });

  return res.json(
    new ApiResponse(
      200,
      {
        accepted: result.accepted,
        duplicates: result.duplicates,
        rejected: result.rejected,
        attendanceUpdated: outcome.applied,
        unmatched: outcome.unmatched,
      },
      "Punches received"
    )
  );
});

/** Lets a reader say it is alive on a day nobody punched, so a dead device is still noticed. */
export const deviceHeartbeat = asyncHandler(async (req, res) => {
  const deviceKey = req.headers["x-device-key"];
  const signature = req.headers["x-device-signature"];
  if (!deviceKey || !signature) throw new ApiError(401, "Missing device key or signature");

  const device = await AttendanceDevice.findOne({ deviceKey }).select("+secret");
  if (!device || !verifyDeviceSignature({ rawBody: req.rawBody, signature, secret: device.secret })) {
    throw new ApiError(401, "Device authentication failed");
  }

  await AttendanceDevice.updateOne({ _id: device._id }, { $set: { lastSeenAt: new Date() } });
  return res.json(new ApiResponse(200, { ok: true }, "Heartbeat recorded"));
});

/* ── Devices (office-facing) ─────────────────────────────────────── */

/** Minutes since a device last said anything. Null when it has never reported. */
const silentForMinutes = (lastSeenAt) =>
  lastSeenAt ? Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 60000) : null;

export const listDevices = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const devices = await AttendanceDevice.find({ schoolId }).sort({ name: 1 }).lean();

  return res.json(
    new ApiResponse(
      200,
      devices.map((d) => ({
        ...d,
        silentForMinutes: silentForMinutes(d.lastSeenAt),
        // A reader that has gone quiet marks nobody, and everyone it covers silently reads as
        // absent — which looks exactly like a school where nobody turned up.
        isHealthy: Boolean(d.lastSeenAt) && silentForMinutes(d.lastSeenAt) < 24 * 60,
      })),
      "Devices fetched"
    )
  );
});

export const registerDevice = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { name, location, deviceType, punchMode, appliesTo } = req.body;
  if (!name?.trim()) throw new ApiError(400, "Device name is required");

  const { deviceKey, secret } = generateDeviceCredentials();
  const device = await AttendanceDevice.create({
    schoolId,
    name: name.trim(),
    location: location || "",
    deviceType: deviceType || "biometric",
    punchMode: punchMode || "auto",
    appliesTo: Array.isArray(appliesTo) && appliesTo.length ? appliesTo : ["staff"],
    deviceKey,
    secret,
    createdBy: req.user._id,
  });

  // The only time the secret is ever readable. It is stored for HMAC verification but never
  // returned again, so a lost secret is rotated rather than looked up.
  return res.status(201).json(
    new ApiResponse(
      201,
      { device: { ...device.toObject(), secret: undefined }, deviceKey, secret },
      "Device registered — copy the secret now, it is not shown again"
    )
  );
});

export const updateDevice = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const device = await AttendanceDevice.findOne({ _id: req.params.id, schoolId });
  if (!device) throw new ApiError(404, "Device not found");

  ["name", "location", "deviceType", "punchMode", "appliesTo", "isActive"].forEach((field) => {
    if (req.body[field] !== undefined) device[field] = req.body[field];
  });
  await device.save();

  return res.json(new ApiResponse(200, { ...device.toObject(), secret: undefined }, "Device updated"));
});

export const rotateDeviceSecret = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const device = await AttendanceDevice.findOne({ _id: req.params.id, schoolId });
  if (!device) throw new ApiError(404, "Device not found");

  const { secret } = generateDeviceCredentials();
  device.secret = secret;
  await device.save();

  return res.json(
    new ApiResponse(200, { deviceKey: device.deviceKey, secret }, "Secret rotated — update the device now, its old secret no longer works")
  );
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const device = await AttendanceDevice.findOne({ _id: req.params.id, schoolId });
  if (!device) throw new ApiError(404, "Device not found");

  const punches = await DevicePunch.countDocuments({ schoolId, deviceId: device._id });
  if (punches > 0) {
    // The punches are the evidence behind attendance already recorded. Removing the device they
    // came from would orphan that trail, so a retired reader is deactivated instead.
    throw new ApiError(400, `Cannot delete — ${punches} punch(es) came from this device. Deactivate it instead.`);
  }

  await device.deleteOne();
  return res.json(new ApiResponse(200, null, "Device deleted"));
});

/* ── Credentials (who a card belongs to) ─────────────────────────── */

export const listCredentials = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { userId, isActive } = req.query;

  const credentials = await AttendanceCredential.find({
    schoolId,
    ...(userId ? { userId } : {}),
    ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
  })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, credentials, "Credentials fetched"));
});

export const enrolCredential = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { userId, externalId, credentialType, label, role } = req.body;

  if (!externalId?.trim()) throw new ApiError(400, "The card or enrolment id is required");
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "A valid user is required");

  const user = await User.findOne({ _id: userId, schoolId }).populate("roleId", "name").lean();
  if (!user) throw new ApiError(404, "User not found in your school");

  // Attendance.role is a fixed lowercase enum; a role name like "School Admin" has to be folded
  // into it or the Attendance write fails validation later, long after the enrolment looked fine.
  const derivedRole = (role || user.roleId?.name || "staff").toLowerCase().replace(/\s+/g, "_");

  try {
    const credential = await AttendanceCredential.create({
      schoolId,
      userId,
      role: derivedRole,
      externalId: externalId.trim(),
      credentialType: credentialType || "rfid",
      label: label || "",
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, credential, "Card enrolled"));
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "That card is already enrolled to somebody. Revoke it first.");
    }
    throw error;
  }
});

export const revokeCredential = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const credential = await AttendanceCredential.findOne({ _id: req.params.id, schoolId });
  if (!credential) throw new ApiError(404, "Credential not found");

  // Revoked, never deleted: the punches it produced are already attached to attendance, and the
  // record of which card that was is part of the trail.
  credential.isActive = false;
  credential.revokedAt = new Date();
  await credential.save();

  return res.json(new ApiResponse(200, credential, "Card revoked"));
});

/* ── The logs ────────────────────────────────────────────────────── */

export const listPunches = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { deviceId, userId, from, to, matched } = req.query;

  const filter = { schoolId };
  if (deviceId) filter.deviceId = deviceId;
  if (userId) filter.userId = userId;
  if (matched === "false") filter.userId = null;
  const fromDate = parseDate(from, "from date");
  const toDate = parseDate(to, "to date");
  if (fromDate || toDate) {
    filter.punchedAt = { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) };
  }

  const punches = await DevicePunch.find(filter)
    .populate("userId", "name email")
    .populate("deviceId", "name location")
    .sort({ punchedAt: -1 })
    .limit(500)
    .lean();

  return res.json(new ApiResponse(200, punches, "Punches fetched"));
});

export const getUnmatched = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const rows = await unmatchedReport({
    schoolId,
    from: parseDate(req.query.from, "from date"),
    to: parseDate(req.query.to, "to date"),
  });

  return res.json(
    new ApiResponse(
      200,
      rows,
      rows.length ? `${rows.length} card(s) scanned that nobody has been enrolled for` : "Every scan matched a person"
    )
  );
});

/**
 * Re-runs the unmatched punches. The point of keeping raw scans: enrol a card today and the
 * scans it already made become attendance, rather than a day of absences to correct by hand.
 */
export const replayPunches = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const result = await replayUnmatched({
    schoolId,
    from: parseDate(req.body.from, "from date"),
    to: parseDate(req.body.to, "to date"),
  });

  return res.json(
    new ApiResponse(
      200,
      result,
      result.applied
        ? `${result.applied} attendance record(s) updated from previously unmatched scans`
        : "Nothing to replay"
    )
  );
});

/** Today at a glance: who the readers have seen, and who they have not. */
export const deviceAttendanceSummary = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const date = parseDate(req.query.date, "date") || new Date();
  date.setUTCHours(0, 0, 0, 0);

  const [records, devices, unmatchedToday] = await Promise.all([
    Attendance.find({ schoolId, date, source: "device" }).select("status checkInAt").lean(),
    AttendanceDevice.find({ schoolId, isActive: true }).select("name lastSeenAt").lean(),
    DevicePunch.countDocuments({
      schoolId,
      userId: null,
      punchedAt: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
    }),
  ]);

  return res.json(
    new ApiResponse(
      200,
      {
        date,
        marked: records.length,
        present: records.filter((r) => r.status === "present").length,
        late: records.filter((r) => r.status === "late").length,
        unmatchedPunches: unmatchedToday,
        silentDevices: devices
          .filter((d) => !d.lastSeenAt || silentForMinutes(d.lastSeenAt) > 24 * 60)
          .map((d) => ({ _id: d._id, name: d.name, lastSeenAt: d.lastSeenAt })),
      },
      "Device attendance summary"
    )
  );
});
