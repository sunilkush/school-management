import mongoose from "mongoose";
import { StudentTimetable } from "../models/StudentTimetable.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toTrimmed = (value) => (typeof value === "string" ? value.trim() : "");

const buildListQuery = ({ schoolId, academicYearId, schoolClassId, sectionId, teacherId, day }) => {
  const query = { schoolId, isActive: true };
  if (academicYearId) query.academicYearId = academicYearId;
  if (schoolClassId) query.schoolClassId = schoolClassId;
  if (sectionId) query.sectionId = sectionId;
  if (teacherId) query.teacherId = teacherId;
  if (day) query.day = day;
  return query;
};

const checkTimeOverlap = async ({ schoolId, academicYearId, schoolClassId, sectionId, day, startTime, endTime, skipId }) => {
  const existingEntries = await StudentTimetable.find({
    schoolId,
    academicYearId,
    schoolClassId,
    sectionId,
    day,
    isActive: true,
    ...(skipId ? { _id: { $ne: skipId } } : {}),
  })
    .select("startTime endTime")
    .lean();

  const hasOverlap = existingEntries.some((entry) => !(endTime <= entry.startTime || startTime >= entry.endTime));

  if (hasOverlap) {
    throw new ApiError(400, "Time slot overlaps with an existing period for this class and section");
  }
};

export const listClassTimetable = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId, day } = req.query;

  const entries = await StudentTimetable.find(
    buildListQuery({
      schoolId: req.user.schoolId,
      academicYearId,
      schoolClassId,
      sectionId,
      day,
    })
  )
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .populate("teacherId", "name email")
    .sort({ day: 1, startTime: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, entries, "Class timetable fetched successfully"));
});

export const listTeacherTimetable = asyncHandler(async (req, res) => {
  const teacherId = req.query.teacherId || req.user._id;
  const { academicYearId, day } = req.query;

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    throw new ApiError(400, "Invalid teacherId");
  }

  const entries = await StudentTimetable.find(
    buildListQuery({
      schoolId: req.user.schoolId,
      academicYearId,
      teacherId,
      day,
    })
  )
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .sort({ day: 1, startTime: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, entries, "Teacher timetable fetched successfully"));
});

export const createClassTimetableEntry = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId, subjectId, teacherId, day, startTime, endTime, room } = req.body;

  if (!academicYearId || !schoolClassId || !sectionId || !subjectId || !teacherId || !day || !startTime || !endTime) {
    throw new ApiError(400, "Missing required timetable fields");
  }

  if (endTime <= startTime) {
    throw new ApiError(400, "End time should be greater than start time");
  }

  await checkTimeOverlap({
    schoolId: req.user.schoolId,
    academicYearId,
    schoolClassId,
    sectionId,
    day,
    startTime,
    endTime,
  });

  const entry = await StudentTimetable.create({
    schoolId: req.user.schoolId,
    academicYearId,
    schoolClassId,
    sectionId,
    subjectId,
    teacherId,
    day,
    startTime,
    endTime,
    room: toTrimmed(room),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, entry, "Class timetable entry created successfully"));
});

export const updateClassTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid timetable id");
  }

  const existing = await StudentTimetable.findOne({ _id: id, schoolId: req.user.schoolId, isActive: true });
  if (!existing) {
    throw new ApiError(404, "Timetable entry not found");
  }

  const payload = {
    academicYearId: req.body.academicYearId || existing.academicYearId,
    schoolClassId: req.body.schoolClassId || existing.schoolClassId,
    sectionId: req.body.sectionId || existing.sectionId,
    subjectId: req.body.subjectId || existing.subjectId,
    teacherId: req.body.teacherId || existing.teacherId,
    day: req.body.day || existing.day,
    startTime: req.body.startTime || existing.startTime,
    endTime: req.body.endTime || existing.endTime,
    room: req.body.room !== undefined ? toTrimmed(req.body.room) : existing.room,
  };

  if (payload.endTime <= payload.startTime) {
    throw new ApiError(400, "End time should be greater than start time");
  }

  await checkTimeOverlap({
    schoolId: req.user.schoolId,
    academicYearId: payload.academicYearId,
    schoolClassId: payload.schoolClassId,
    sectionId: payload.sectionId,
    day: payload.day,
    startTime: payload.startTime,
    endTime: payload.endTime,
    skipId: id,
  });

  const updated = await StudentTimetable.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Class timetable entry updated successfully"));
});

export const deleteClassTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid timetable id");
  }

  const deleted = await StudentTimetable.findOneAndUpdate(
    { _id: id, schoolId: req.user.schoolId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!deleted) {
    throw new ApiError(404, "Timetable entry not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Class timetable entry deleted successfully"));
});
