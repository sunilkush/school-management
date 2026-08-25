import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PTMSession } from "../models/PTMSession.model.js";
import { PTMSlot } from "../models/PTMSlot.model.js";
import { Student } from "../models/student.model.js";
import { notifyUser } from "../utils/notifyService.js";

const resolveSchoolId = (req) =>
  req.user.roleId?.name === "Super Admin" ? req.query.schoolId || req.body.schoolId || req.user.schoolId : req.user.schoolId;

const ensureAccess = (doc, user, notFoundMessage) => {
  if (!doc) throw new ApiError(404, notFoundMessage);
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school record");
  }
};

const ensureParentOwnsStudent = async (studentId, parentId) => {
  const owns = await Student.exists({
    _id: studentId,
    $or: [{ fatherId: parentId }, { motherId: parentId }, { guardianId: parentId }],
  });
  if (!owns) throw new ApiError(403, "This student is not linked with this parent");
};

const generateSlots = (session) => {
  const slots = [];
  const durationMs = session.slotDurationMinutes * 60 * 1000;
  let cursor = new Date(session.startTime);
  const end = new Date(session.endTime);

  while (cursor.getTime() + durationMs <= end.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs);
    slots.push({
      ptmSessionId: session._id,
      schoolId: session.schoolId,
      startTime: new Date(cursor),
      endTime: slotEnd,
    });
    cursor = slotEnd;
  }

  return slots;
};

/* ══════════════════════════ Staff: Sessions ══════════════════════════ */

export const createSession = asyncHandler(async (req, res) => {
  const { title, teacherId, schoolClassId, sectionId, date, startTime, endTime, slotDurationMinutes, location } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!(start < end)) throw new ApiError(400, "startTime must be before endTime");

  const schoolId = resolveSchoolId(req);

  const session = await PTMSession.create({
    schoolId, title, teacherId: teacherId || null, schoolClassId, sectionId,
    date: date || start, startTime: start, endTime: end,
    slotDurationMinutes: slotDurationMinutes || 10, location: location || "",
    createdBy: req.user._id,
  });

  const slotPayloads = generateSlots(session);
  if (!slotPayloads.length) {
    await PTMSession.findByIdAndDelete(session._id);
    throw new ApiError(400, "Time window is too short to generate at least one slot");
  }

  const slots = await PTMSlot.insertMany(slotPayloads, { ordered: true });

  return res.status(201).json(new ApiResponse(201, { session, slots }, "PTM session created successfully"));
});

export const getSessions = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { schoolClassId, sectionId, teacherId, status, from, to } = req.query;

  const filter = { schoolId };
  if (schoolClassId) filter.schoolClassId = schoolClassId;
  if (sectionId) filter.sectionId = sectionId;
  if (teacherId) filter.teacherId = teacherId;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const sessions = await PTMSession.find(filter)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("teacherId", "name")
    .sort({ date: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, sessions, "PTM sessions fetched successfully"));
});

export const getSessionSlots = asyncHandler(async (req, res) => {
  const session = await PTMSession.findById(req.params.id).lean();
  ensureAccess(session, req.user, "PTM session not found");

  const slots = await PTMSlot.find({ ptmSessionId: req.params.id }).sort({ startTime: 1 }).lean();

  return res.status(200).json(new ApiResponse(200, { session, slots }, "Session slots fetched successfully"));
});

export const cancelSession = asyncHandler(async (req, res) => {
  const session = await PTMSession.findById(req.params.id);
  ensureAccess(session, req.user, "PTM session not found");

  if (session.status === "Cancelled") throw new ApiError(400, "Session already cancelled");

  session.status = "Cancelled";
  await session.save();

  await PTMSlot.updateMany(
    { ptmSessionId: session._id, status: { $ne: "Completed" } },
    { $set: { status: "Cancelled" } }
  );

  return res.status(200).json(new ApiResponse(200, session, "PTM session cancelled successfully"));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { attended, notes } = req.body;

  const slot = await PTMSlot.findById(req.params.id);
  ensureAccess(slot, req.user, "PTM slot not found");

  if (slot.status !== "Booked") throw new ApiError(400, "Only a booked slot can be marked");

  slot.attended = !!attended;
  slot.notes = notes || "";
  slot.status = "Completed";
  await slot.save();

  return res.status(200).json(new ApiResponse(200, slot, "Attendance marked successfully"));
});

/* ══════════════════════════ Parent: Booking ══════════════════════════ */

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { schoolClassId, sectionId } = req.query;

  if (!schoolClassId || !sectionId) {
    throw new ApiError(400, "schoolClassId and sectionId are required");
  }

  const sessions = await PTMSession.find({ schoolId, schoolClassId, sectionId, status: "Scheduled" })
    .populate("teacherId", "name")
    .lean();

  const sessionIds = sessions.map((s) => s._id);
  const slots = await PTMSlot.find({ ptmSessionId: { $in: sessionIds }, status: "Available" })
    .sort({ startTime: 1 })
    .lean();

  const sessionMap = new Map(sessions.map((s) => [`${s._id}`, s]));
  const enriched = slots.map((slot) => ({
    ...slot,
    session: sessionMap.get(`${slot.ptmSessionId}`) || null,
  }));

  return res.status(200).json(new ApiResponse(200, enriched, "Available slots fetched successfully"));
});

export const bookSlot = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const parentId = req.user._id;

  if (req.user.roleId?.name === "Parent") {
    await ensureParentOwnsStudent(studentId, parentId);
  }

  // Unlike every other handler in this file, this had no ensureAccess check at all — a School
  // Admin (or a Parent whose child-ownership check above only confirms parentage, not school)
  // could book/claim any other school's PTM slot by guessing its _id. Fetch-then-check first,
  // then scope both the student lookup and the atomic update to that slot's real school.
  const existingSlot = await PTMSlot.findById(req.params.id);
  ensureAccess(existingSlot, req.user, "PTM slot not found");

  const student = await Student.findOne({ _id: studentId, schoolId: existingSlot.schoolId }).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const slot = await PTMSlot.findOneAndUpdate(
    { _id: req.params.id, status: "Available", schoolId: existingSlot.schoolId },
    {
      $set: {
        status: "Booked",
        studentId,
        studentName: student.userId?.name || "",
        parentId,
        bookedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!slot) throw new ApiError(400, "This slot is no longer available");

  const session = await PTMSession.findById(slot.ptmSessionId).select("title location").lean();
  const timeRange = `${new Date(slot.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
  await notifyUser({
    schoolId: slot.schoolId,
    userId: parentId,
    title: "PTM slot confirmed",
    message: `Your PTM slot for ${student.userId?.name || "your child"} (${session?.title || "PTM"}) is confirmed for ${timeRange}${session?.location ? ` at ${session.location}` : ""}.`,
    channels: { inApp: true, email: true },
    createdById: req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, slot, "Slot booked successfully"));
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const slot = await PTMSlot.findById(req.params.id);
  ensureAccess(slot, req.user, "PTM slot not found");

  if (slot.status !== "Booked") throw new ApiError(400, "Only a booked slot can be cancelled");

  if (req.user.roleId?.name === "Parent" && `${slot.parentId}` !== `${req.user._id}`) {
    throw new ApiError(403, "You can only cancel your own booking");
  }

  slot.status = "Available";
  slot.studentId = null;
  slot.studentName = "";
  slot.parentId = null;
  slot.bookedAt = null;
  slot.cancelReason = req.body?.reason || "";
  await slot.save();

  return res.status(200).json(new ApiResponse(200, slot, "Booking cancelled successfully"));
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const filter = req.user.roleId?.name === "Parent"
    ? { parentId: req.user._id }
    : { schoolId: resolveSchoolId(req) };

  const slots = await PTMSlot.find(filter)
    .populate({ path: "ptmSessionId", select: "title date location teacherId schoolClassId sectionId", populate: [{ path: "teacherId", select: "name" }, { path: "schoolClassId", select: "name" }, { path: "sectionId", select: "name" }] })
    .sort({ startTime: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, slots, "Bookings fetched successfully"));
});
