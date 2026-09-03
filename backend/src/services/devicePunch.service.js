import crypto from "crypto";

import { Attendance } from "../models/attendance.model.js";
import { AttendanceCredential } from "../models/AttendanceCredential.model.js";
import { AttendanceDevice } from "../models/AttendanceDevice.model.js";
import { DevicePunch } from "../models/DevicePunch.model.js";
import { School } from "../models/school.model.js";

/**
 * Turns raw reader scans into attendance.
 *
 * Two layers on purpose. `DevicePunch` records what the hardware saw and is never rewritten;
 * `Attendance` is derived from it. That separation is what makes the messy cases recoverable —
 * a card enrolled a week after it started being used can be replayed over punches already
 * collected, and a wrongly mapped card can be corrected rather than argued about. Ingesting and
 * replaying run the SAME function, so a punch processed live and one processed later cannot be
 * interpreted differently.
 */

/* ── Device authentication ───────────────────────────────────────── */

/**
 * A reader has no session and no login, so each batch is signed with the device's shared secret.
 * Compared with a timing-safe equality: a plain === leaks, byte by byte, how much of a guessed
 * signature was right.
 */
export const verifyDeviceSignature = ({ rawBody, signature, secret }) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = Buffer.from(String(signature), "utf8");
  const mine = Buffer.from(expected, "utf8");
  if (given.length !== mine.length) return false;
  return crypto.timingSafeEqual(given, mine);
};

/* ── Time helpers ────────────────────────────────────────────────── */

/** "HH:mm" for an instant, in the timezone school hours are configured in. Matches the approach
 *  in jobs/autoCheckout.job.js — `new Date()` alone says nothing about the school's timezone. */
const istClock = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour").value;
  const mm = parts.find((p) => p.type === "minute").value;
  return `${hh}:${mm}`;
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const dayKey = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Whether an arrival counts as late, given the school's configured start and grace period. */
export const isLateArrival = (punchedAt, attendanceHours) => {
  const start = toMinutes(attendanceHours?.startTime || "08:00");
  const grace = Number.isFinite(attendanceHours?.lateGraceMinutes) ? attendanceHours.lateGraceMinutes : 10;
  return toMinutes(istClock(punchedAt)) > start + grace;
};

/* ── Ingestion ───────────────────────────────────────────────────── */

const MAX_BATCH = 500;
/** A device clock can be wrong. A punch dated well into the future is a misconfigured clock,
 *  not a person, and letting it through would create attendance for a day that has not happened. */
const MAX_FUTURE_SKEW_MS = 15 * 60 * 1000;

const normalisePunch = (entry) => {
  const externalId = String(entry?.externalId ?? entry?.cardNumber ?? entry?.userId ?? "").trim();
  if (!externalId) return { error: "Punch has no card or enrolment id" };

  const punchedAt = entry?.punchedAt ? new Date(entry.punchedAt) : new Date();
  if (Number.isNaN(punchedAt.getTime())) return { error: "Punch has an unreadable time" };
  if (punchedAt.getTime() - Date.now() > MAX_FUTURE_SKEW_MS) {
    return { error: "Punch is dated in the future — check the device clock" };
  }

  const direction = ["in", "out"].includes(entry?.direction) ? entry.direction : "unknown";
  return { externalId, punchedAt, direction };
};

/**
 * Stores a batch of raw punches. Duplicates are counted, not treated as failures: a device that
 * lost its connection mid-upload will resend the whole batch, and the honest answer to "I already
 * had that one" is to carry on.
 */
export const ingestPunches = async ({ device, punches }) => {
  if (!Array.isArray(punches) || punches.length === 0) {
    return { stored: [], accepted: 0, duplicates: 0, rejected: [] };
  }
  if (punches.length > MAX_BATCH) {
    throw new Error(`A batch can carry at most ${MAX_BATCH} punches`);
  }

  const stored = [];
  const rejected = [];
  let duplicates = 0;

  for (const entry of punches) {
    const parsed = normalisePunch(entry);
    if (parsed.error) {
      rejected.push({ entry, reason: parsed.error });
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const punch = await DevicePunch.create({
        schoolId: device.schoolId,
        deviceId: device._id,
        externalId: parsed.externalId,
        punchedAt: parsed.punchedAt,
        direction: parsed.direction === "unknown" && device.punchMode !== "auto" ? device.punchMode === "entry" ? "in" : "out" : parsed.direction,
        receivedAt: new Date(),
        raw: entry,
      });
      stored.push(punch);
    } catch (error) {
      if (error?.code === 11000) {
        duplicates += 1;
        continue;
      }
      rejected.push({ entry, reason: error.message });
    }
  }

  await AttendanceDevice.updateOne(
    { _id: device._id },
    {
      $set: { lastSeenAt: new Date(), ...(stored.length ? { lastPunchAt: stored[stored.length - 1].punchedAt } : {}) },
      $inc: { totalPunches: stored.length },
    }
  );

  return { stored, accepted: stored.length, duplicates, rejected };
};

/* ── Turning punches into attendance ─────────────────────────────── */

/** Live credentials for the ids in a batch, as a lookup. */
const credentialsFor = async (schoolId, externalIds) => {
  const rows = await AttendanceCredential.find({
    schoolId,
    isActive: true,
    externalId: { $in: [...new Set(externalIds)] },
  })
    .select("externalId userId role")
    .lean();
  return new Map(rows.map((r) => [r.externalId, r]));
};

/**
 * Folds punches into one Attendance row per person per day.
 *
 * A single reader at a door cannot tell which way somebody is walking, so the rule is the one a
 * human would apply reading the log: earliest punch of the day is the arrival, latest is the
 * departure. A lone punch is an arrival and nothing else — inventing a check-out from it would
 * fabricate a departure time nobody recorded.
 *
 * Returns what happened rather than throwing, because a batch is a mix: some punches match a
 * person, some are from a card nobody has enrolled yet, and the unmatched ones must stay visible.
 */
export const applyPunches = async ({ schoolId, punches, device = null }) => {
  if (!punches?.length) return { applied: 0, unmatched: 0, people: 0 };

  const school = await School.findById(schoolId).select("attendanceHours").lean();
  const hours = school?.attendanceHours || {};

  const credentials = await credentialsFor(schoolId, punches.map((p) => p.externalId));

  // Group by person and day — one Attendance row covers a whole day, so the punches for that day
  // have to be considered together rather than one at a time.
  const groups = new Map();
  let unmatched = 0;

  for (const punch of punches) {
    const credential = credentials.get(punch.externalId);
    if (!credential) {
      unmatched += 1;
      continue;
    }
    const key = `${credential.userId}|${dayKey(punch.punchedAt).toISOString()}`;
    if (!groups.has(key)) {
      groups.set(key, { credential, date: dayKey(punch.punchedAt), punches: [] });
    }
    groups.get(key).punches.push(punch);
  }

  let applied = 0;

  for (const group of groups.values()) {
    const { credential, date } = group;

    // Every punch this person has for this day, not only the ones in this batch — a device
    // uploading the afternoon separately must not lose the morning's arrival.
    // eslint-disable-next-line no-await-in-loop
    const dayPunches = await DevicePunch.find({
      schoolId,
      userId: { $in: [credential.userId, null] },
      externalId: credential.externalId,
      punchedAt: { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
    })
      .sort({ punchedAt: 1 })
      .lean();

    const times = dayPunches.map((p) => new Date(p.punchedAt));
    const first = times[0];
    const last = times.length > 1 ? times[times.length - 1] : null;

    // eslint-disable-next-line no-await-in-loop
    const existing = await Attendance.findOne({ schoolId, userId: credential.userId, date });

    // A record a person typed is not overwritten by a machine. If the office has already marked
    // someone on leave, a card scan is not grounds for the system to silently overrule them.
    if (existing && existing.source !== "device") {
      // eslint-disable-next-line no-await-in-loop
      await DevicePunch.updateMany(
        { _id: { $in: dayPunches.map((p) => p._id) } },
        { $set: { userId: credential.userId, appliedAt: new Date(), attendanceId: existing._id } }
      );
      continue;
    }

    const status = isLateArrival(first, hours) ? "late" : "present";
    const payload = {
      schoolId,
      userId: credential.userId,
      role: credential.role,
      date,
      status,
      checkInAt: first,
      checkOutAt: last,
      source: "device",
      deviceId: device?._id || null,
      // markedBy is required and must be a real user; the person who registered the device is
      // the closest truthful answer, and `source` is what actually says a machine did this.
      markedBy: device?.createdBy || credential.userId,
      remarks: device?.name ? `Recorded by ${device.name}` : "Recorded by an attendance device",
    };

    let record;
    if (existing) {
      Object.assign(existing, payload);
      // eslint-disable-next-line no-await-in-loop
      record = await existing.save();
    } else {
      // eslint-disable-next-line no-await-in-loop
      record = await Attendance.create(payload);
    }

    // eslint-disable-next-line no-await-in-loop
    await DevicePunch.updateMany(
      { _id: { $in: dayPunches.map((p) => p._id) } },
      { $set: { userId: credential.userId, appliedAt: new Date(), attendanceId: record._id } }
    );

    applied += 1;
  }

  return { applied, unmatched, people: groups.size };
};

/**
 * Replays punches that no credential matched at the time.
 *
 * This is the payoff for keeping the raw layer: enrol a card today and yesterday's scans on it
 * become attendance, instead of a day of absences somebody has to correct by hand.
 */
export const replayUnmatched = async ({ schoolId, from = null, to = null }) => {
  const filter = { schoolId, userId: null };
  if (from || to) {
    filter.punchedAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  const punches = await DevicePunch.find(filter).sort({ punchedAt: 1 }).lean();
  if (!punches.length) return { applied: 0, unmatched: 0, people: 0, considered: 0 };

  const result = await applyPunches({ schoolId, punches });
  return { ...result, considered: punches.length };
};

/** Cards seen by a reader that belong to nobody — the list the office has to act on. */
export const unmatchedReport = async ({ schoolId, from = null, to = null }) => {
  const match = { schoolId, userId: null };
  if (from || to) {
    match.punchedAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }

  const rows = await DevicePunch.aggregate([
    { $match: match },
    {
      $group: {
        _id: { externalId: "$externalId", deviceId: "$deviceId" },
        punches: { $sum: 1 },
        firstSeen: { $min: "$punchedAt" },
        lastSeen: { $max: "$punchedAt" },
      },
    },
    { $sort: { lastSeen: -1 } },
    { $limit: 200 },
  ]);

  return rows.map((r) => ({
    externalId: r._id.externalId,
    deviceId: r._id.deviceId,
    punches: r.punches,
    firstSeen: r.firstSeen,
    lastSeen: r.lastSeen,
  }));
};
