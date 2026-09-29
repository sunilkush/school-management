import mongoose from "mongoose";
import { HostelRoom } from "../models/HostelRoom.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;
const resolveAcademicYearId = (req) => req.body?.academicYearId || null;

export const getHostelRooms = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const rooms = await HostelRoom.find({ schoolId }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, rooms, "Hostel rooms fetched successfully"));
});

export const createHostelRoom = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const { roomNumber, capacity } = req.body;

  if (!roomNumber || !capacity) {
    throw new ApiError(400, "roomNumber and capacity are required");
  }

  const room = await HostelRoom.create({
    schoolId,
    academicYearId: resolveAcademicYearId(req),
    roomNumber,
    capacity,
    students: [],
  });

  return res.status(201).json(new ApiResponse(201, room, "Hostel room created successfully"));
});

export const updateHostelRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");
  const updates = {};

  if (req.body.roomNumber !== undefined) updates.roomNumber = req.body.roomNumber;
  const filter = { _id: id, schoolId };
  if (req.body.capacity !== undefined) {
    updates.capacity = Number(req.body.capacity);
    // A room cannot hold fewer beds than the students already in it. Before, a room of four could be
    // set to two and stayed "4 / 2" with nobody told which two had no bed.
    filter.$expr = { $lte: [{ $size: { $ifNull: ["$students", []] } }, updates.capacity] };
  }

  const room = await HostelRoom.findOneAndUpdate(filter, updates, { new: true, runValidators: true });

  if (!room) {
    const existing = await HostelRoom.findOne({ _id: id, schoolId }).select("students").lean();
    if (!existing) throw new ApiError(404, "Hostel room not found");
    throw new ApiError(409, `${existing.students.length} students are in this room. Move some out before lowering its capacity.`);
  }

  return res.status(200).json(new ApiResponse(200, room, "Hostel room updated successfully"));
});

export const deleteHostelRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");
  // Deleting a room with students in it removed their only record of where they sleep.
  const room = await HostelRoom.findOneAndDelete({ _id: id, schoolId, "students.0": { $exists: false } });

  if (!room) {
    const existing = await HostelRoom.exists({ _id: id, schoolId });
    if (!existing) throw new ApiError(404, "Hostel room not found");
    throw new ApiError(409, "Move the students out of this room before deleting it");
  }

  return res.status(200).json(new ApiResponse(200, null, "Hostel room deleted successfully"));
});

export const assignStudentToRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentName, studentId } = req.body;
  const schoolId = resolveSchoolId(req);

  if (!schoolId) throw new ApiError(400, "schoolId is required");
  if (!studentName) throw new ApiError(400, "studentName is required");

  const room = await HostelRoom.findOne({ _id: id, schoolId });
  if (!room) throw new ApiError(404, "Hostel room not found");

  let name = String(studentName).trim();
  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid studentId");
    const student = await User.findOne({ _id: studentId, schoolId, isDeleted: { $ne: true } })
      .select("name roleId")
      .populate("roleId", "name")
      .lean();
    if (!student || student.roleId?.name !== "Student") throw new ApiError(404, "Student not found in this school");
    name = student.name || name;

    // One bed per student. Only this room was checked before, so the same child could be put in
    // every room in the hostel.
    const elsewhere = await HostelRoom.findOne({ schoolId, "students.studentId": studentId }).select("roomNumber").lean();
    if (elsewhere) {
      throw new ApiError(409, `This student is already in room ${elsewhere.roomNumber}. Remove them from it first.`);
    }
  } else if (room.students.some((student) => student.name?.trim().toLowerCase() === name.toLowerCase())) {
    throw new ApiError(400, "Student is already assigned to this room");
  }

  // The free-bed check and the push happen in one update, so two wardens filling the last bed at
  // the same moment cannot both succeed.
  const updated = await HostelRoom.findOneAndUpdate(
    { _id: room._id, schoolId, $expr: { $lt: [{ $size: { $ifNull: ["$students", []] } }, "$capacity"] } },
    { $push: { students: { name, ...(studentId ? { studentId } : {}) } } },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(400, "Room is full");

  return res.status(200).json(new ApiResponse(200, updated, "Student assigned successfully"));
});

export const removeStudentFromRoom = asyncHandler(async (req, res) => {
  const { id, studentId } = req.params;
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const room = await HostelRoom.findOne({ _id: id, schoolId });
  if (!room) throw new ApiError(404, "Hostel room not found");

  const initialCount = room.students.length;
  room.students = room.students.filter((student) => student._id.toString() !== studentId);

  if (room.students.length === initialCount) {
    throw new ApiError(404, "Student assignment not found in this room");
  }

  await room.save();

  return res.status(200).json(new ApiResponse(200, room, "Student unassigned successfully"));
});
