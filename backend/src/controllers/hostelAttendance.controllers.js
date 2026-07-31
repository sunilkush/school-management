import { HostelAttendance } from "../models/HostelAttendance.model.js";
import { HostelRoom } from "../models/HostelRoom.model.js";
import { HostelLeave } from "../models/HostelLeave.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolIdFromReq as resolveSchoolId } from "../utils/resolveSchoolId.js";

// POST /hostel/attendance  — mark attendance
export const markHostelAttendance = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { date, session, records, academicYearId } = req.body;

  if (!date || !session || !Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "date, session and records are required");
  }

  if (!["morning", "evening", "night"].includes(session)) {
    throw new ApiError(400, "session must be morning, evening or night");
  }

  const attendDate = new Date(date);
  attendDate.setHours(0, 0, 0, 0);

  // Upsert — allow re-marking
  const existing = await HostelAttendance.findOne({ schoolId, date: attendDate, session });
  if (existing) {
    existing.records    = records;
    existing.markedBy   = req.user._id;
    existing.academicYearId = academicYearId || null;
    await existing.save();
    await existing.populate("records.studentId", "name admissionNo");
    return res.json(new ApiResponse(200, existing, "Attendance updated"));
  }

  const attendance = await HostelAttendance.create({
    schoolId, date: attendDate, session, records,
    markedBy: req.user._id, academicYearId: academicYearId || null,
  });

  await attendance.populate("records.studentId", "name admissionNo");

  return res.status(201).json(new ApiResponse(201, attendance, "Attendance marked"));
});

// GET /hostel/attendance  — list attendance records
export const getHostelAttendance = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { date, session, page = 1, limit = 30 } = req.query;

  const filter = { schoolId };
  if (session) filter.session = session;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: d, $lte: end };
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await HostelAttendance.countDocuments(filter);

  const records = await HostelAttendance.find(filter)
    .populate("markedBy", "name")
    .populate("records.studentId", "name admissionNo")
    .sort({ date: -1, session: 1 })
    .skip(skip)
    .limit(Number(limit));

  return res.json(new ApiResponse(200, { records, total }, "Attendance fetched"));
});

// GET /hostel/attendance/today  — get today's data with student list for marking
export const getTodayAttendanceSheet = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { session = "morning", academicYearId } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Get all hostel students — sourced from HostelRoom, the room the Rooms/Allocations
  // pages actually assign students to (the older Hostel model has no working create path).
  const roomFilter = { schoolId };
  if (academicYearId) roomFilter.academicYearId = academicYearId;

  const rooms = await HostelRoom.find(roomFilter).populate("students.studentId", "name phone");

  const hostelStudents = [];
  rooms.forEach((room) => {
    room.students.forEach((s) => {
      // Assignments made before the studentId link existed only have a name snapshot —
      // they can't be attendance-tracked until re-assigned with a real student.
      if (!s.studentId) return;
      hostelStudents.push({
        studentId: s.studentId._id,
        name: s.studentId.name || s.name,
        phone: s.studentId.phone,
        roomNumber: room.roomNumber,
      });
    });
  });

  // Get approved leaves today
  const leavesToday = await HostelLeave.find({
    schoolId, status: "approved",
    fromDate: { $lte: end }, toDate: { $gte: today },
  }).select("studentId");
  const onLeaveIds = new Set(leavesToday.map((l) => l.studentId.toString()));

  // Existing attendance for today+session
  const existing = await HostelAttendance.findOne({
    schoolId, date: { $gte: today, $lte: end }, session,
  });

  const markedMap = {};
  if (existing) {
    existing.records.forEach((r) => {
      markedMap[r.studentId.toString()] = { status: r.status, note: r.note || "" };
    });
  }

  const sheet = hostelStudents.map((h) => {
    const sid = h.studentId?.toString();
    return {
      studentId: h.studentId,
      name: h.name,
      phone: h.phone,
      roomNumber: h.roomNumber,
      isOnLeave: onLeaveIds.has(sid),
      status: markedMap[sid]?.status || (onLeaveIds.has(sid) ? "leave" : "present"),
      note: markedMap[sid]?.note || "",
    };
  });

  return res.json(new ApiResponse(200, { sheet, alreadyMarked: !!existing, session, date: today }, "Attendance sheet ready"));
});

// GET /hostel/attendance/summary  — monthly summary
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { month, year } = req.query;

  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year)  || new Date().getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate   = new Date(y, m, 0, 23, 59, 59);

  const summary = await HostelAttendance.aggregate([
    { $match: { schoolId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, session: "$session" },
        totalPresent: { $sum: "$totalPresent" },
        totalAbsent:  { $sum: "$totalAbsent" },
        totalOnLeave: { $sum: "$totalOnLeave" },
      },
    },
    { $sort: { "_id.day": 1, "_id.session": 1 } },
  ]);

  return res.json(new ApiResponse(200, summary, "Attendance summary fetched"));
});
