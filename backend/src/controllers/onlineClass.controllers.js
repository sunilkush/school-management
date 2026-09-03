import mongoose from "mongoose";

import { Attendance } from "../models/attendance.model.js";
import { OnlineClass } from "../models/OnlineClass.model.js";
import { OnlineClassJoin } from "../models/OnlineClassJoin.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";

/**
 * Live online classes.
 *
 * Nothing here hosts video or creates meetings — the school pastes the link it already uses. What
 * this owns is the part that was missing: who a session is for, when it runs, when the link
 * becomes visible, who opened it, and where the recording ended up.
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const roleName = (req) => (req.userRole?.name || req.user?.role?.name || "").trim();
const isStudent = (req) => roleName(req).toLowerCase() === "student";
const isParent = (req) => roleName(req).toLowerCase() === "parent";

const parseDate = (value, label) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

/** A student's own class, resolved server-side — never from a client-supplied id. */
const myEnrollment = async (req, schoolId) => {
  const student = await Student.findOne({ userId: req.user._id }).select("_id");
  if (!student) throw new ApiError(404, "Student profile not found");

  const enrollment = await StudentEnrollment.findOne({ studentId: student._id, schoolId })
    .select("schoolClassId sectionId")
    .sort({ createdAt: -1 })
    .lean();
  if (!enrollment) throw new ApiError(404, "Enrollment not found");
  return enrollment;
};

/**
 * Whether the meeting link may be shown yet.
 *
 * A link visible a week in advance gets forwarded outside the school; one that appears shortly
 * before the class does not. Staff always see it — they have to set the room up.
 */
const linkIsVisible = (session, now = new Date()) => {
  if (session.status === "cancelled") return false;
  const opensAt = new Date(session.scheduledStart).getTime() - (session.linkVisibleBeforeMin ?? 15) * 60000;
  const closesAt = new Date(session.scheduledEnd).getTime();
  return now.getTime() >= opensAt && now.getTime() <= closesAt;
};

/** What a student or parent is allowed to see of a session. */
const forLearner = (session, now = new Date()) => {
  const visible = linkIsVisible(session, now);
  const opensAt = new Date(new Date(session.scheduledStart).getTime() - (session.linkVisibleBeforeMin ?? 15) * 60000);

  return {
    ...session,
    meetingLink: visible ? session.meetingLink : null,
    passcode: visible ? session.passcode : null,
    canJoin: visible,
    // Said plainly, so nobody sits refreshing an empty page wondering if it is broken.
    joinOpensAt: visible ? null : opensAt,
  };
};

/* ── Scheduling ──────────────────────────────────────────────────── */

export const createOnlineClass = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const {
    schoolClassId, sectionId, subjectId, title, description, provider,
    meetingLink, meetingId, passcode, scheduledStart, scheduledEnd,
    linkVisibleBeforeMin, academicYearId, teacherId,
  } = req.body;

  if (!schoolClassId) throw new ApiError(400, "A class is required");
  if (!title?.trim()) throw new ApiError(400, "A title is required");
  if (!meetingLink?.trim()) throw new ApiError(400, "A meeting link is required");

  const start = parseDate(scheduledStart, "start time");
  const end = parseDate(scheduledEnd, "end time");
  if (!start || !end) throw new ApiError(400, "Both a start and an end time are required");

  const session = await OnlineClass.create({
    schoolId,
    academicYearId: academicYearId || null,
    schoolClassId,
    sectionId: sectionId || null,
    subjectId: subjectId || null,
    // A coordinator can schedule on a teacher's behalf; otherwise it is the caller's own class.
    teacherId: teacherId || req.user._id,
    title: title.trim(),
    description: description || "",
    provider: provider || "other",
    meetingLink: meetingLink.trim(),
    meetingId: meetingId || "",
    passcode: passcode || "",
    scheduledStart: start,
    scheduledEnd: end,
    ...(linkVisibleBeforeMin !== undefined ? { linkVisibleBeforeMin } : {}),
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, session, "Online class scheduled"));
});

export const updateOnlineClass = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId });
  if (!session) throw new ApiError(404, "Online class not found");
  if (session.status === "completed") {
    // The recording is the one thing that arrives after the class is over.
    const onlyRecording = Object.keys(req.body).every((k) => k === "recordingUrl");
    if (!onlyRecording) throw new ApiError(400, "A finished class can no longer be rescheduled — only its recording can be added");
  }

  const fields = [
    "title", "description", "provider", "meetingLink", "meetingId", "passcode",
    "sectionId", "subjectId", "linkVisibleBeforeMin", "recordingUrl",
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) session[field] = req.body[field];
  });
  if (req.body.scheduledStart !== undefined) session.scheduledStart = parseDate(req.body.scheduledStart, "start time");
  if (req.body.scheduledEnd !== undefined) session.scheduledEnd = parseDate(req.body.scheduledEnd, "end time");

  await session.save();
  return res.json(new ApiResponse(200, session, "Online class updated"));
});

export const cancelOnlineClass = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId });
  if (!session) throw new ApiError(404, "Online class not found");
  if (session.status === "completed") throw new ApiError(400, "That class has already finished");

  session.status = "cancelled";
  session.cancelledReason = req.body.reason || "";
  await session.save();

  // Cancelled rather than deleted: students were told it was happening, and the record of it
  // being called off is the answer to "why did nobody turn up".
  return res.json(new ApiResponse(200, session, "Online class cancelled"));
});

export const setOnlineClassStatus = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId });
  if (!session) throw new ApiError(404, "Online class not found");

  const { status } = req.body;
  if (!["live", "completed"].includes(status)) throw new ApiError(400, "Status must be live or completed");
  if (session.status === "cancelled") throw new ApiError(400, "That class was cancelled");

  session.status = status;
  if (status === "live" && !session.startedAt) session.startedAt = new Date();
  if (status === "completed") session.endedAt = new Date();
  await session.save();

  return res.json(new ApiResponse(200, session, `Class marked ${status}`));
});

/* ── Listing ─────────────────────────────────────────────────────── */

export const listOnlineClasses = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { from, to, status, schoolClassId, sectionId, subjectId, teacherId } = req.query;

  const filter = { schoolId };

  if (isStudent(req)) {
    const enrollment = await myEnrollment(req, schoolId);
    filter.schoolClassId = enrollment.schoolClassId;
    // A session for the whole class (sectionId null) reaches every section.
    filter.$or = [{ sectionId: null }, { sectionId: enrollment.sectionId }];
  } else {
    if (schoolClassId) filter.schoolClassId = schoolClassId;
    if (sectionId) filter.sectionId = sectionId;
    if (teacherId) filter.teacherId = teacherId;
  }
  if (subjectId) filter.subjectId = subjectId;
  if (status) filter.status = status;

  const fromDate = parseDate(from, "from date");
  const toDate = parseDate(to, "to date");
  if (fromDate || toDate) {
    filter.scheduledStart = { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) };
  }

  const sessions = await OnlineClass.find(filter)
    .populate("subjectId", "name code")
    .populate("teacherId", "name")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .sort({ scheduledStart: 1 })
    .limit(300)
    .lean();

  const now = new Date();
  const payload = isStudent(req) || isParent(req) ? sessions.map((s) => forLearner(s, now)) : sessions;

  return res.json(new ApiResponse(200, payload, "Online classes fetched"));
});

/* ── Joining ─────────────────────────────────────────────────────── */

/**
 * Hands back the link and records that this person opened it.
 *
 * Deliberately one endpoint rather than "give me the link" plus "log that I joined": if they were
 * separate, every link fetched without a matching log would leave the register wrong, and the two
 * would drift apart exactly when somebody is trying to work out who attended.
 */
export const joinOnlineClass = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid class id");

  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId }).lean();
  if (!session) throw new ApiError(404, "Online class not found");
  if (session.status === "cancelled") throw new ApiError(400, "That class was cancelled");

  if (isStudent(req)) {
    const enrollment = await myEnrollment(req, schoolId);
    const sameClass = String(enrollment.schoolClassId) === String(session.schoolClassId);
    const sameSection = !session.sectionId || String(enrollment.sectionId) === String(session.sectionId);
    if (!sameClass || !sameSection) throw new ApiError(403, "This class is not for your section");

    if (!linkIsVisible(session)) {
      const opensAt = new Date(new Date(session.scheduledStart).getTime() - (session.linkVisibleBeforeMin ?? 15) * 60000);
      throw new ApiError(403, `The link opens at ${opensAt.toLocaleString("en-IN")}`);
    }
  }

  const now = new Date();
  const minutesAfterStart = Math.round((now.getTime() - new Date(session.scheduledStart).getTime()) / 60000);

  // Upsert, so rejoining after a dropped connection updates the row instead of adding another —
  // the count has to mean people, not clicks.
  await OnlineClassJoin.findOneAndUpdate(
    { onlineClassId: session._id, userId: req.user._id },
    {
      $setOnInsert: {
        schoolId,
        role: roleName(req).toLowerCase() || "student",
        firstJoinedAt: now,
        minutesAfterStart,
      },
      $set: { lastJoinedAt: now },
      $inc: { joinCount: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json(
    new ApiResponse(200, { meetingLink: session.meetingLink, passcode: session.passcode || null }, "Joining")
  );
});

/**
 * Who opened the link.
 *
 * Named "joins" and not "attendance" everywhere on purpose — it records a click, not a lesson
 * sat through, and the two are not the same thing to tell a parent.
 */
export const getJoins = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId }).lean();
  if (!session) throw new ApiError(404, "Online class not found");

  const joins = await OnlineClassJoin.find({ onlineClassId: session._id })
    .populate("userId", "name email")
    .sort({ firstJoinedAt: 1 })
    .lean();

  return res.json(
    new ApiResponse(
      200,
      {
        joined: joins.length,
        joins,
        note: "These are link opens, not verified attendance — the video call itself is outside this system.",
      },
      "Join log"
    )
  );
});

/**
 * Writes the register from the join log, for a teacher who has looked at it and agreed with it.
 *
 * Never automatic. A click is not a lesson attended, and a system that quietly turns one into the
 * other produces attendance a school then reports to parents as fact.
 */
export const markAttendanceFromJoins = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const session = await OnlineClass.findOne({ _id: req.params.id, schoolId }).lean();
  if (!session) throw new ApiError(404, "Online class not found");

  const joins = await OnlineClassJoin.find({ onlineClassId: session._id }).lean();
  if (!joins.length) throw new ApiError(400, "Nobody opened the link, so there is nothing to mark");

  const date = new Date(session.scheduledStart);
  date.setUTCHours(0, 0, 0, 0);

  let marked = 0;
  const skipped = [];

  for (const join of joins) {
    if (join.role !== "student") continue;

    // eslint-disable-next-line no-await-in-loop
    const existing = await Attendance.findOne({ schoolId, userId: join.userId, date });
    if (existing && existing.source !== "online") {
      // A record somebody entered by hand stands. The teacher can change it themselves; this
      // should not silently overwrite a considered decision.
      skipped.push({ userId: join.userId, reason: `Already marked ${existing.status}` });
      continue;
    }

    const payload = {
      schoolId,
      userId: join.userId,
      role: "student",
      schoolClassId: session.schoolClassId,
      sectionId: session.sectionId || null,
      subjectId: session.subjectId || null,
      date,
      status: "present",
      checkInAt: join.firstJoinedAt,
      source: "online",
      markedBy: req.user._id,
      remarks: `Joined the online class "${session.title}"`,
    };

    if (existing) {
      Object.assign(existing, payload);
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
    } else {
      // eslint-disable-next-line no-await-in-loop
      await Attendance.create(payload);
    }
    marked += 1;
  }

  return res.json(
    new ApiResponse(
      200,
      { marked, skipped },
      skipped.length ? `${marked} marked present, ${skipped.length} left as they were` : `${marked} student(s) marked present`
    )
  );
});
