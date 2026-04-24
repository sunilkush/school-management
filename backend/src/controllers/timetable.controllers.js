import mongoose from "mongoose";
import { StudentTimetable } from "../models/StudentTimetable.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toTrimmed = (value) => (typeof value === "string" ? value.trim() : "");
const toObjectIdString = (value) => (value ? value.toString() : "");

const buildListQuery = ({ schoolId, academicYearId, schoolClassId, sectionId, teacherId, day }) => {
  const query = { schoolId, isActive: true };
  if (academicYearId) query.academicYearId = academicYearId;
  if (schoolClassId) query.schoolClassId = schoolClassId;
  if (sectionId) query.sectionId = sectionId;
  if (teacherId) query.teacherId = teacherId;
  if (day) query.day = day;
  return query;
};

const checkTimeOverlap = async ({
  schoolId,
  academicYearId,
  schoolClassId,
  sectionId,
  teacherId,
  day,
  startTime,
  endTime,
  skipId,
}) => {
  const commonFilter = {
    schoolId,
    academicYearId,
    day,
    isActive: true,
    ...(skipId ? { _id: { $ne: skipId } } : {}),
  };

  const [classSectionEntries, teacherEntries] = await Promise.all([
    StudentTimetable.find({
      ...commonFilter,
      schoolClassId,
      sectionId,
    })
      .select("startTime endTime")
      .lean(),
    teacherId
      ? StudentTimetable.find({
          ...commonFilter,
          teacherId,
        })
          .select("startTime endTime")
          .lean()
      : [],
  ]);

  const hasClassOverlap = classSectionEntries.some(
    (entry) => !(endTime <= entry.startTime || startTime >= entry.endTime)
  );
  const hasTeacherOverlap = teacherEntries.some(
    (entry) => !(endTime <= entry.startTime || startTime >= entry.endTime)
  );

  if (hasClassOverlap) {
    throw new ApiError(400, "Time slot overlaps with an existing period for this class and section");
  }

  if (hasTeacherOverlap) {
    throw new ApiError(400, "Teacher already has another period in this time slot");
  }
};

const validateForeignKeys = ({ academicYearId, schoolClassId, sectionId, subjectId, teacherId }) => {
  const keyMap = {
    academicYearId,
    schoolClassId,
    sectionId,
    subjectId,
    teacherId,
  };

  Object.entries(keyMap).forEach(([key, value]) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new ApiError(400, `Invalid ${key}`);
    }
  });
};

const verifySchoolOwnership = (req) => {
  const schoolId = toObjectIdString(req.user?.schoolId);
  if (!schoolId) {
    throw new ApiError(400, "Logged-in user does not belong to a school");
  }
  return schoolId;
};

const sortByWeekdayThenTime = (items = []) =>
  [...items].sort(
    (a, b) =>
      dayOrderValue(a.day) - dayOrderValue(b.day) ||
      String(a.startTime).localeCompare(String(b.startTime))
  );

const dayOrderValue = (day) => {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const index = dayOrder.indexOf(day);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const populateTimetable = (query) =>
  query
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .populate("teacherId", "name email")
    .lean();

export const listClassTimetable = asyncHandler(async (req, res) => {
  const schoolId = verifySchoolOwnership(req);
  const { academicYearId, schoolClassId, sectionId, day } = req.query;

  const entries = await populateTimetable(
    StudentTimetable.find(
    buildListQuery({
      schoolId,
      academicYearId,
      schoolClassId,
      sectionId,
      day,
    })
  )
  );

  return res
    .status(200)
    .json(new ApiResponse(200, sortByWeekdayThenTime(entries), "Class timetable fetched successfully"));
});

export const listTeacherTimetable = asyncHandler(async (req, res) => {
  const schoolId = verifySchoolOwnership(req);
  const teacherId = req.query.teacherId || req.user._id;
  const { academicYearId, day } = req.query;

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    throw new ApiError(400, "Invalid teacherId");
  }

  const entries = await populateTimetable(
    StudentTimetable.find(
    buildListQuery({
      schoolId,
      academicYearId,
      teacherId,
      day,
    })
  )
  );

  return res
    .status(200)
    .json(new ApiResponse(200, sortByWeekdayThenTime(entries), "Teacher timetable fetched successfully"));
});

export const createClassTimetableEntry = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId, subjectId, teacherId, day, startTime, endTime, room } = req.body;

  if (!academicYearId || !schoolClassId || !sectionId || !subjectId || !teacherId || !day || !startTime || !endTime) {
    throw new ApiError(400, "Missing required timetable fields");
  }
  validateForeignKeys({ academicYearId, schoolClassId, sectionId, subjectId, teacherId });
  const schoolId = verifySchoolOwnership(req);

  if (endTime <= startTime) {
    throw new ApiError(400, "End time should be greater than start time");
  }

  await checkTimeOverlap({
    schoolId,
    academicYearId,
    schoolClassId,
    sectionId,
    teacherId,
    day,
    startTime,
    endTime,
  });

  const entry = await StudentTimetable.create({
    schoolId,
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
  const schoolId = verifySchoolOwnership(req);
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid timetable id");
  }

  const existing = await StudentTimetable.findOne({ _id: id, schoolId, isActive: true });
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
  validateForeignKeys(payload);

  if (payload.endTime <= payload.startTime) {
    throw new ApiError(400, "End time should be greater than start time");
  }

  await checkTimeOverlap({
    schoolId,
    academicYearId: payload.academicYearId,
    schoolClassId: payload.schoolClassId,
    sectionId: payload.sectionId,
    teacherId: payload.teacherId,
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
  const schoolId = verifySchoolOwnership(req);
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid timetable id");
  }

  const deleted = await StudentTimetable.findOneAndUpdate(
    { _id: id, schoolId, isActive: true },
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
