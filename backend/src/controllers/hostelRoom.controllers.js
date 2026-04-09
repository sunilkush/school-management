import { HostelRoom } from "../models/HostelRoom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;
const resolveAcademicYearId = (req) => req.body?.academicYearId || null;

export const getHostelRooms = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const filter = schoolId ? { schoolId } : {};

  const rooms = await HostelRoom.find(filter).sort({ createdAt: -1 });

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
  const updates = {};

  if (req.body.roomNumber !== undefined) updates.roomNumber = req.body.roomNumber;
  if (req.body.capacity !== undefined) updates.capacity = req.body.capacity;

  const room = await HostelRoom.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!room) throw new ApiError(404, "Hostel room not found");

  return res.status(200).json(new ApiResponse(200, room, "Hostel room updated successfully"));
});

export const deleteHostelRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const room = await HostelRoom.findByIdAndDelete(id);

  if (!room) throw new ApiError(404, "Hostel room not found");

  return res.status(200).json(new ApiResponse(200, null, "Hostel room deleted successfully"));
});

export const assignStudentToRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentName } = req.body;

  if (!studentName) throw new ApiError(400, "studentName is required");

  const room = await HostelRoom.findById(id);
  if (!room) throw new ApiError(404, "Hostel room not found");

  if (room.students.length >= room.capacity) {
    throw new ApiError(400, "Room is full");
  }

  room.students.push({ name: studentName });
  await room.save();

  return res.status(200).json(new ApiResponse(200, room, "Student assigned successfully"));
});
