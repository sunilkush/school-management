import mongoose from "mongoose";

import { Substitution } from "../models/Substitution.model.js";
import { Timetable } from "../models/Timetable.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyUser } from "../utils/notifyService.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import {
  buildSubstitutionPlan,
  normaliseDate,
  suggestSubstitutes,
  weekdayOf,
} from "../services/substitution.service.js";

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

const requireDate = (value) => {
  const date = normaliseDate(value || new Date());
  if (!date) throw new ApiError(400, "Invalid date");
  return date;
};

const resolveAcademicYearId = (req) =>
  req.query.academicYearId || req.body.academicYearId || req.user?.school?.activeAcademicYearId || null;

/* ── Plan ────────────────────────────────────────────────────────────
   Everything a coordinator needs for one day: who's away, which periods
   that leaves open, and ranked candidates for each. */
export const getSubstitutionPlan = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const academicYearId = resolveAcademicYearId(req);
  if (!academicYearId) throw new ApiError(400, "Academic year is required");

  const date = requireDate(req.query.date);
  const extra = req.query.absentTeacherIds
    ? String(req.query.absentTeacherIds).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const plan = await buildSubstitutionPlan({ schoolId, academicYearId, date, extraAbsentTeacherIds: extra });
  return res.json(new ApiResponse(200, plan, "Substitution plan built"));
});

/* ── Assign ─────────────────────────────────────────────────────── */
export const assignSubstitute = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const academicYearId = resolveAcademicYearId(req);
  const { timetableId, substituteTeacherId, reason, note, leaveRequestId } = req.body;

  if (!mongoose.isValidObjectId(timetableId)) throw new ApiError(400, "Invalid timetable period");
  if (!mongoose.isValidObjectId(substituteTeacherId)) throw new ApiError(400, "Select a substitute teacher");

  const date = requireDate(req.body.date);

  const period = await Timetable.findOne({ _id: timetableId, schoolId }).lean();
  if (!period) throw new ApiError(404, "Timetable period not found");
  if (!period.teacherId) throw new ApiError(400, "This period has no assigned teacher to cover for");
  if (String(period.teacherId) === String(substituteTeacherId)) {
    throw new ApiError(400, "The substitute is the teacher already scheduled for this period");
  }
  if (weekdayOf(date) !== period.dayOfWeek) {
    throw new ApiError(400, `That period is scheduled on ${period.dayOfWeek}, not the selected date`);
  }

  // The candidate list already filters clashes, but the request can name anyone — re-check here
  // so a stale or hand-crafted request can't double-book a teacher.
  const free = await suggestSubstitutes({
    schoolId,
    academicYearId: academicYearId || period.academicYearId,
    date,
    dayOfWeek: period.dayOfWeek,
    timeSlotId: period.timeSlotId,
    subjectId: period.subjectId,
    excludeTeacherIds: [period.teacherId],
  });
  if (!free.some((c) => String(c.teacherId) === String(substituteTeacherId))) {
    throw new ApiError(400, "That teacher is not free for this period");
  }

  const substitution = await Substitution.findOneAndUpdate(
    { schoolId, date, timetableId },
    {
      $set: {
        schoolId,
        academicYearId: academicYearId || period.academicYearId,
        date,
        timetableId,
        schoolClassId: period.schoolClassId,
        sectionId: period.sectionId || null,
        timeSlotId: period.timeSlotId,
        subjectId: period.subjectId || null,
        absentTeacherId: period.teacherId,
        substituteTeacherId,
        reason: reason || "absent",
        leaveRequestId: leaveRequestId || null,
        note: note || "",
        status: "assigned",
        updatedBy: req.user._id,
      },
      $setOnInsert: { createdBy: req.user._id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Both sides need to know — fire and forget, never fail the assignment on a notification.
  const dateLabel = date.toISOString().slice(0, 10);
  notifyUser({
    schoolId,
    userId: substituteTeacherId,
    title: "Substitution assigned",
    message: `You are covering a period on ${dateLabel}. Check Timetable → Substitutions for the class and slot.`,
    channels: { inApp: true, email: true },
    createdById: req.user._id,
  });
  notifyUser({
    schoolId,
    userId: period.teacherId,
    title: "Your period has been covered",
    message: `A substitute has been arranged for your period on ${dateLabel}.`,
    channels: { inApp: true },
    createdById: req.user._id,
  });
  await Substitution.updateOne({ _id: substitution._id }, { $set: { notifiedAt: new Date() } });

  return res.status(201).json(new ApiResponse(201, substitution, "Substitute assigned"));
});

/* ── Daily register ─────────────────────────────────────────────── */
export const listSubstitutions = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { from, to, status } = req.query;

  const range = from || to
    ? { date: { ...(from ? { $gte: requireDate(from) } : {}), ...(to ? { $lte: requireDate(to) } : {}) } }
    : { date: requireDate(req.query.date) };

  const rows = await Substitution.find({
    schoolId,
    ...range,
    ...(status ? { status } : { status: { $ne: "cancelled" } }),
  })
    .populate("absentTeacherId", "name email")
    .populate("substituteTeacherId", "name email")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("timeSlotId", "name startTime endTime order")
    .populate("subjectId", "name")
    .sort({ date: 1 })
    .lean();

  rows.sort((a, b) => (a.timeSlotId?.order ?? 0) - (b.timeSlotId?.order ?? 0));
  return res.json(new ApiResponse(200, rows, "Substitutions fetched"));
});

export const cancelSubstitution = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const substitution = await Substitution.findOne({ _id: req.params.id, schoolId });
  if (!substitution) throw new ApiError(404, "Substitution not found");

  substitution.status = "cancelled";
  substitution.updatedBy = req.user._id;
  await substitution.save();

  if (substitution.substituteTeacherId) {
    notifyUser({
      schoolId,
      userId: substitution.substituteTeacherId,
      title: "Substitution cancelled",
      message: `Your cover on ${substitution.date.toISOString().slice(0, 10)} has been cancelled.`,
      channels: { inApp: true },
      createdById: req.user._id,
    });
  }

  return res.json(new ApiResponse(200, substitution, "Substitution cancelled"));
});

/* ── Teacher self-service ───────────────────────────────────────── */
export const mySubstitutions = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { from, to } = req.query;

  const rows = await Substitution.find({
    schoolId,
    substituteTeacherId: req.user._id,
    status: "assigned",
    ...(from || to
      ? { date: { ...(from ? { $gte: requireDate(from) } : {}), ...(to ? { $lte: requireDate(to) } : {}) } }
      : {}),
  })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("timeSlotId", "name startTime endTime order")
    .populate("subjectId", "name")
    .populate("absentTeacherId", "name")
    .sort({ date: 1 })
    .lean();

  return res.json(new ApiResponse(200, rows, "Your substitution duties"));
});
