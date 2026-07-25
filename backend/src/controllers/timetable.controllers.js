import mongoose from "mongoose";
import { TimeSlot } from "../models/TimeSlot.model.js";
import { Room } from "../models/Room.model.js";
import { Timetable } from "../models/Timetable.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const CRUD_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Academic Coordinator", "Exam Coordinator"];
const READ_ROLES = [...CRUD_ROLES, "Teacher", "Student", "Parent", "Staff", "Support Staff"];
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TEACHING_TYPES = ["regular", "substitution", "activity"];

const id = (value) => value?._id?.toString?.() || value?.toString?.() || "";
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ""));
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const roleName = (req) => req.userRole?.name || req.user?.roleId?.name || "";
const requireRole = (req, allowed) => {
  if (!allowed.includes(roleName(req))) throw new ApiError(403, "Forbidden. Insufficient role access.");
};
const success = (res, status, data, message) => res.status(status).json(new ApiResponse(status, data, message));

const normalizeDay = (day) => (typeof day === "string" ? day.toLowerCase() : day);
const normalizeEntryPayload = (payload = {}) => {
  const type = payload.type || "regular";
  const normalized = {
    dayOfWeek: normalizeDay(payload.dayOfWeek),
    timeSlotId: payload.timeSlotId,
    subjectId: TEACHING_TYPES.includes(type) ? payload.subjectId || null : null,
    teacherId: TEACHING_TYPES.includes(type) ? payload.teacherId || null : null,
    roomId: payload.roomId || null,
    type,
    note: payload.note || "",
    status: payload.status || "active",
  };
  return normalized;
};

const resolveSchoolId = (req, source = {}) => {
  const requested = id(source.schoolId ?? req.query?.schoolId ?? req.body?.schoolId);
  const current = id(req.user?.schoolId ?? req.user?.school?._id);
  if (!requested && !current) throw new ApiError(400, "schoolId is required");
  const selected = requested || current;
  if (!isObjectId(selected)) throw new ApiError(400, "Invalid schoolId");
  if (roleName(req) !== "Super Admin" && current && selected !== current) {
    throw new ApiError(403, "You are not allowed to access another school's timetable");
  }
  return selected;
};

const validateIds = (fields) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (value && !isObjectId(value)) throw new ApiError(400, `Invalid ${key}`);
  });
};

const handleDuplicate = (error) => {
  if (error?.code !== 11000) throw error;
  if (error.keyPattern?.schoolId && error.keyPattern?.academicYearId && error.keyPattern?.schoolClassId) {
    throw new ApiError(409, "Timetable period already exists for this section");
  }
  throw new ApiError(409, "Duplicate timetable setup record already exists");
};

const populateTimetable = (query) =>
  query
    .populate("schoolId", "schoolName name code")
    .populate("academicYearId", "name year startDate endDate isActive")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("timeSlotId", "name startTime endTime type order")
    .populate("subjectId", "name code shortName")
    .populate("teacherId", "name email avatar")
    .populate("roomId", "name code type capacity")
    .lean();

const sortTimetable = (rows = []) =>
  [...rows].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayDiff) return dayDiff;
    return (a.timeSlotId?.order ?? 999) - (b.timeSlotId?.order ?? 999);
  });

const validateEntry = (entry) => {
  validateIds({
    academicYearId: entry.academicYearId,
    schoolClassId: entry.schoolClassId,
    sectionId: entry.sectionId,
    timeSlotId: entry.timeSlotId,
    subjectId: entry.subjectId,
    teacherId: entry.teacherId,
    roomId: entry.roomId,
  });
  if (!DAY_ORDER.includes(entry.dayOfWeek)) throw new ApiError(400, "Invalid dayOfWeek");
  if (TEACHING_TYPES.includes(entry.type) && entry.status !== "cancelled") {
    if (!entry.subjectId || !entry.teacherId) throw new ApiError(400, "Subject and teacher are required for regular periods");
  }
};

const assertNoClashes = async ({ schoolId, academicYearId, dayOfWeek, timeSlotId, teacherId, roomId, skipId }) => {
  const base = compact({ schoolId, academicYearId, dayOfWeek, timeSlotId, status: "active", _id: skipId ? { $ne: skipId } : undefined });
  const checks = [];
  if (teacherId) checks.push(Timetable.exists({ ...base, teacherId }));
  else checks.push(Promise.resolve(null));
  if (roomId) checks.push(Timetable.exists({ ...base, roomId }));
  else checks.push(Promise.resolve(null));
  const [teacherClash, roomClash] = await Promise.all(checks);
  if (teacherClash) throw new ApiError(409, "Teacher already assigned in this time slot");
  if (roomClash) throw new ApiError(409, "Room already booked in this time slot");
};

const currentEnrollmentForUser = async (userId, academicYearId) => {
  const student = await Student.findOne({ userId, isActive: true }).lean();
  if (!student) throw new ApiError(404, "Student profile not found");
  const enrollment = await StudentEnrollment.findOne(
    compact({ studentId: student._id, academicYearId, status: "Active" })
  ).sort({ createdAt: -1 }).lean();
  if (!enrollment) throw new ApiError(404, "Active student enrollment not found");
  return { student, enrollment };
};

export const listTimeSlots = asyncHandler(async (req, res) => {
  requireRole(req, READ_ROLES);
  const schoolId = resolveSchoolId(req);
  const { academicYearId } = req.query;
  if (!academicYearId) throw new ApiError(400, "academicYearId is required");
  validateIds({ academicYearId });
  const rows = await TimeSlot.find({ schoolId, academicYearId, isActive: true }).sort({ order: 1, startTime: 1 }).lean();
  return success(res, 200, rows, "Time slots fetched successfully");
});

export const createTimeSlot = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  const payload = { ...req.body, schoolId, createdBy: req.user._id, updatedBy: req.user._id };
  validateIds({ academicYearId: payload.academicYearId });
  if (!payload.academicYearId || !payload.name || !payload.startTime || !payload.endTime || payload.order === undefined) {
    throw new ApiError(400, "name, startTime, endTime, order, and academicYearId are required");
  }
  if (payload.endTime <= payload.startTime) throw new ApiError(400, "End time must be greater than start time");
  try {
    const row = await TimeSlot.create(payload);
    return success(res, 201, row, "Time slot created successfully");
  } catch (error) { handleDuplicate(error); }
});

export const updateTimeSlot = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  validateIds({ id: req.params.id, academicYearId: req.body.academicYearId });
  if (req.body.endTime && req.body.startTime && req.body.endTime <= req.body.startTime) throw new ApiError(400, "End time must be greater than start time");
  try {
    const row = await TimeSlot.findOneAndUpdate({ _id: req.params.id, schoolId }, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!row) throw new ApiError(404, "Time slot not found");
    return success(res, 200, row, "Time slot updated successfully");
  } catch (error) { handleDuplicate(error); }
});

export const deleteTimeSlot = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req);
  validateIds({ id: req.params.id });
  const row = await TimeSlot.findOneAndUpdate({ _id: req.params.id, schoolId }, { isActive: false, updatedBy: req.user._id }, { new: true });
  if (!row) throw new ApiError(404, "Time slot not found");
  return success(res, 200, row, "Time slot deleted successfully");
});

export const listRooms = asyncHandler(async (req, res) => {
  requireRole(req, READ_ROLES);
  const schoolId = resolveSchoolId(req);
  const rows = await Room.find({ schoolId, isActive: true }).sort({ name: 1 }).lean();
  return success(res, 200, rows, "Rooms fetched successfully");
});

export const createRoom = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  if (!req.body.name) throw new ApiError(400, "Room name is required");
  try {
    const row = await Room.create({ ...req.body, schoolId });
    return success(res, 201, row, "Room created successfully");
  } catch (error) { handleDuplicate(error); }
});

export const updateRoom = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  validateIds({ id: req.params.id });
  try {
    const row = await Room.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true, runValidators: true });
    if (!row) throw new ApiError(404, "Room not found");
    return success(res, 200, row, "Room updated successfully");
  } catch (error) { handleDuplicate(error); }
});

export const deleteRoom = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req);
  validateIds({ id: req.params.id });
  const row = await Room.findOneAndUpdate({ _id: req.params.id, schoolId }, { isActive: false }, { new: true });
  if (!row) throw new ApiError(404, "Room not found");
  return success(res, 200, row, "Room deleted successfully");
});

export const listTimetable = asyncHandler(async (req, res) => {
  requireRole(req, READ_ROLES);
  const schoolId = resolveSchoolId(req);
  const { academicYearId, schoolClassId, sectionId, teacherId, dayOfWeek, day } = req.query;
  validateIds({ academicYearId, schoolClassId, sectionId, teacherId });
  const selectedTeacherId = req.path.endsWith("/teacher") && !teacherId ? req.user._id : teacherId;
  const rows = await populateTimetable(Timetable.find(compact({ schoolId, academicYearId, schoolClassId, sectionId, teacherId: selectedTeacherId, dayOfWeek: normalizeDay(dayOfWeek || day), status: "active" })));
  return success(res, 200, sortTimetable(rows), "Timetable fetched successfully");
});

export const createTimetableEntry = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  const entry = { ...normalizeEntryPayload(req.body), schoolId, academicYearId: req.body.academicYearId, schoolClassId: req.body.schoolClassId, sectionId: req.body.sectionId, createdBy: req.user._id, updatedBy: req.user._id };
  validateEntry(entry);
  await assertNoClashes(entry);
  try {
    const created = await Timetable.create(entry);
    const populated = await populateTimetable(Timetable.findById(created._id));
    return success(res, 201, populated, "Timetable entry created successfully");
  } catch (error) { handleDuplicate(error); }
});

export const bulkSaveTimetable = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  const { academicYearId, schoolClassId, sectionId, entries = [] } = req.body;
  if (!academicYearId || !schoolClassId || !sectionId || !Array.isArray(entries)) throw new ApiError(400, "Bulk timetable payload is invalid");
  const saved = [];
  for (const raw of entries) {
    const entry = { ...normalizeEntryPayload(raw), schoolId, academicYearId, schoolClassId, sectionId, updatedBy: req.user._id };
    validateEntry(entry);
    const existing = await Timetable.findOne({ schoolId, academicYearId, schoolClassId, sectionId, dayOfWeek: entry.dayOfWeek, timeSlotId: entry.timeSlotId }).lean();
    await assertNoClashes({ ...entry, skipId: existing?._id });
    const row = await Timetable.findOneAndUpdate(
      { schoolId, academicYearId, schoolClassId, sectionId, dayOfWeek: entry.dayOfWeek, timeSlotId: entry.timeSlotId },
      { $set: entry, $setOnInsert: { createdBy: req.user._id } },
      { new: true, runValidators: true, upsert: true }
    );
    saved.push(row);
  }
  const rows = await populateTimetable(Timetable.find({ _id: { $in: saved.map((row) => row._id) } }));
  return success(res, 200, sortTimetable(rows), "Timetable saved successfully");
});

export const updateTimetableEntry = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  validateIds({ id: req.params.id });
  const existing = await Timetable.findOne({ _id: req.params.id, schoolId });
  if (!existing) throw new ApiError(404, "Timetable entry not found");
  const patch = { ...normalizeEntryPayload({ ...existing.toObject(), ...req.body }), academicYearId: req.body.academicYearId || existing.academicYearId, schoolClassId: req.body.schoolClassId || existing.schoolClassId, sectionId: req.body.sectionId || existing.sectionId, updatedBy: req.user._id };
  const merged = { ...existing.toObject(), ...patch, academicYearId: req.body.academicYearId || existing.academicYearId, schoolClassId: req.body.schoolClassId || existing.schoolClassId, sectionId: req.body.sectionId || existing.sectionId };
  validateEntry(merged);
  await assertNoClashes({ ...merged, skipId: existing._id });
  try {
    const row = await Timetable.findByIdAndUpdate(existing._id, patch, { new: true, runValidators: true });
    const populated = await populateTimetable(Timetable.findById(row._id));
    return success(res, 200, populated, "Timetable entry updated successfully");
  } catch (error) { handleDuplicate(error); }
});

export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req);
  validateIds({ id: req.params.id });
  const row = await Timetable.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!row) throw new ApiError(404, "Timetable entry not found");
  return success(res, 200, row, "Timetable entry deleted successfully");
});

export const copyWeekTimetable = asyncHandler(async (req, res) => {
  requireRole(req, CRUD_ROLES);
  const schoolId = resolveSchoolId(req, req.body);
  const { fromSchoolClassId, fromSectionId, toSchoolClassId, toSectionId, academicYearId } = req.body;
  validateIds({ fromSchoolClassId, fromSectionId, toSchoolClassId, toSectionId, academicYearId });
  const source = await Timetable.find({ schoolId, academicYearId, schoolClassId: fromSchoolClassId, sectionId: fromSectionId, status: "active" }).lean();
  const copied = [];
  for (const src of source) {
    const entry = { ...src, _id: undefined, schoolClassId: toSchoolClassId, sectionId: toSectionId, createdBy: req.user._id, updatedBy: req.user._id };
    await assertNoClashes(entry);
    const row = await Timetable.findOneAndUpdate(
      { schoolId, academicYearId, schoolClassId: toSchoolClassId, sectionId: toSectionId, dayOfWeek: src.dayOfWeek, timeSlotId: src.timeSlotId },
      { $set: entry },
      { upsert: true, new: true, runValidators: true }
    );
    copied.push(row);
  }
  const rows = await populateTimetable(Timetable.find({ _id: { $in: copied.map((row) => row._id) } }));
  return success(res, 200, sortTimetable(rows), "Weekly timetable copied successfully");
});

export const myTeacherTimetable = asyncHandler(async (req, res) => {
  requireRole(req, ["Teacher", "Subject Coordinator", "Class Teacher", "Lab Technician", ...CRUD_ROLES, "Staff", "Support Staff"]);
  const schoolId = resolveSchoolId(req);
  const { academicYearId } = req.query;
  const rows = await populateTimetable(Timetable.find(compact({ schoolId, academicYearId, teacherId: req.user._id, status: "active" })));
  return success(res, 200, sortTimetable(rows), "Teacher timetable fetched successfully");
});

export const myStudentTimetable = asyncHandler(async (req, res) => {
  requireRole(req, ["Student"]);
  const { academicYearId } = req.query;
  const { enrollment } = await currentEnrollmentForUser(req.user._id, academicYearId);
  const rows = await populateTimetable(Timetable.find({ schoolId: enrollment.schoolId, academicYearId: enrollment.academicYearId, schoolClassId: enrollment.schoolClassId, sectionId: enrollment.sectionId, status: "active" }));
  return success(res, 200, sortTimetable(rows), "Student timetable fetched successfully");
});

export const childTimetable = asyncHandler(async (req, res) => {
  requireRole(req, ["Parent", ...CRUD_ROLES]);
  const { academicYearId } = req.query;
  validateIds({ studentId: req.params.studentId, academicYearId });
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) throw new ApiError(404, "Student not found");
  if (roleName(req) === "Parent" && ![id(student.fatherId), id(student.motherId), id(student.guardianId)].includes(id(req.user._id))) {
    throw new ApiError(403, "You are not allowed to view this child's timetable");
  }
  const enrollment = await StudentEnrollment.findOne(compact({ studentId: student._id, academicYearId, status: "Active" })).sort({ createdAt: -1 }).lean();
  if (!enrollment) throw new ApiError(404, "Active student enrollment not found");
  const rows = await populateTimetable(Timetable.find({ schoolId: enrollment.schoolId, academicYearId: enrollment.academicYearId, schoolClassId: enrollment.schoolClassId, sectionId: enrollment.sectionId, status: "active" }));
  return success(res, 200, sortTimetable(rows), "Child timetable fetched successfully");
});

export const classSectionTimetable = asyncHandler(async (req, res) => {
  requireRole(req, READ_ROLES);
  const schoolId = resolveSchoolId(req);
  const { academicYearId } = req.query;
  const { schoolClassId, sectionId } = req.params;
  validateIds({ academicYearId, schoolClassId, sectionId });
  const rows = await populateTimetable(Timetable.find(compact({ schoolId, academicYearId, schoolClassId, sectionId, status: "active" })));
  return success(res, 200, sortTimetable(rows), "Class section timetable fetched successfully");
});

// Backward-compatible aliases used by older frontend paths.
export const listClassTimetable = listTimetable;
export const listTeacherTimetable = listTimetable;
export const createClassTimetableEntry = createTimetableEntry;
export const updateClassTimetableEntry = updateTimetableEntry;
export const deleteClassTimetableEntry = deleteTimetableEntry;