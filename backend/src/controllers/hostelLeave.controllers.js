import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { HostelLeave } from "../models/HostelLeave.model.js";
import { HostelRoom } from "../models/HostelRoom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolIdFromReq as resolveSchoolId } from "../utils/resolveSchoolId.js";

// POST /hostel/leaves
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const {
    studentId, leaveType, fromDate, toDate, reason,
    parentPhone, destinationAddress, isEmergency, roomNumber, academicYearId,
  } = req.body;

  if (!studentId || !leaveType || !fromDate || !toDate || !reason) {
    throw new ApiError(400, "studentId, leaveType, fromDate, toDate and reason are required");
  }

  if (Number.isNaN(new Date(fromDate).getTime()) || Number.isNaN(new Date(toDate).getTime())) {
    throw new ApiError(400, "Invalid fromDate or toDate");
  }
  if (new Date(toDate) < new Date(fromDate)) {
    throw new ApiError(400, "toDate must be after fromDate");
  }

  // The student must be one of this school's students. Unchecked, another school's user id was
  // saved and the response populated it with that child's name, email and phone.
  if (!mongoose.Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid studentId");
  const student = await User.findOne({ _id: studentId, schoolId, isDeleted: { $ne: true } })
    .select("roleId")
    .populate("roleId", "name")
    .lean();
  if (!student || student.roleId?.name !== "Student") throw new ApiError(404, "Student not found in this school");

  // Check for overlapping approved/pending leave
  const overlap = await HostelLeave.findOne({
    schoolId,
    studentId,
    status: { $in: ["pending", "approved"] },
    $or: [
      { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } },
    ],
  });
  if (overlap) {
    throw new ApiError(409, "An overlapping leave request already exists for this student");
  }

  // Try to get roomNumber from existing hostel allocation if not provided
  let room = roomNumber;
  if (!room) {
    const hostelAlloc = await HostelRoom.findOne({ schoolId, "students.studentId": studentId }).select("roomNumber");
    room = hostelAlloc?.roomNumber || "";
  }

  const leave = await HostelLeave.create({
    schoolId, studentId, leaveType, fromDate, toDate, reason,
    parentPhone, destinationAddress, isEmergency: !!isEmergency,
    roomNumber: room, academicYearId: academicYearId || null,
  });

  await leave.populate("studentId", "name email phone");

  return res.status(201).json(new ApiResponse(201, leave, "Leave request submitted"));
});

// GET /hostel/leaves
export const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { status, leaveType, studentId, fromDate, toDate, page = 1, limit = 25 } = req.query;

  const filter = { schoolId };
  if (status)    filter.status    = status;
  if (leaveType) filter.leaveType = leaveType;
  if (studentId) filter.studentId = studentId;
  if (fromDate || toDate) {
    filter.fromDate = {};
    if (fromDate) filter.fromDate.$gte = new Date(fromDate);
    if (toDate)   filter.fromDate.$lte = new Date(toDate);
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await HostelLeave.countDocuments(filter);

  const leaves = await HostelLeave.find(filter)
    .populate("studentId", "name email phone admissionNo")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const summary = await HostelLeave.aggregate([
    { $match: { schoolId: filter.schoolId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return res.json(new ApiResponse(200, { leaves, total, summary }, "Leave requests fetched"));
});

// GET /hostel/leaves/:id
export const getLeaveById = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const leave = await HostelLeave.findOne({ _id: req.params.id, schoolId })
    .populate("studentId", "name email phone admissionNo avatar")
    .populate("approvedBy", "name");
  if (!leave) throw new ApiError(404, "Leave request not found");
  return res.json(new ApiResponse(200, leave, "Leave fetched"));
});

// PUT /hostel/leaves/:id/status
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { status, approvalNote, rejectionReason } = req.body;

  if (!["approved", "rejected", "cancelled"].includes(status)) {
    throw new ApiError(400, "status must be approved, rejected, or cancelled");
  }

  const leave = await HostelLeave.findOne({ _id: req.params.id, schoolId });
  if (!leave) throw new ApiError(404, "Leave request not found");
  if (leave.status !== "pending") {
    throw new ApiError(409, `Leave is already ${leave.status}`);
  }

  leave.status          = status;
  leave.approvedBy      = req.user._id;
  leave.approvalNote    = approvalNote || "";
  leave.rejectionReason = rejectionReason || "";
  await leave.save();

  await leave.populate("studentId", "name email phone");

  return res.json(new ApiResponse(200, leave, `Leave ${status}`));
});

// PUT /hostel/leaves/:id/checkout  — record actual check-out time
export const recordCheckOut = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const at = req.body.checkOutTime ? new Date(req.body.checkOutTime) : new Date();
  if (Number.isNaN(at.getTime())) throw new ApiError(400, "Invalid checkOutTime");

  // Once, and only on an approved leave. A second call used to move the recorded time.
  const leave = await HostelLeave.findOneAndUpdate(
    { _id: req.params.id, schoolId, status: "approved", checkOutTime: null },
    { $set: { checkOutTime: at } },
    { new: true }
  );
  if (!leave) {
    const existing = await HostelLeave.findOne({ _id: req.params.id, schoolId }).select("status checkOutTime").lean();
    if (!existing) throw new ApiError(404, "Leave not found");
    if (existing.status !== "approved") throw new ApiError(400, "Only approved leaves can be checked out");
    throw new ApiError(409, "Check-out is already recorded for this leave");
  }
  return res.json(new ApiResponse(200, leave, "Check-out recorded"));
});

// PUT /hostel/leaves/:id/checkin  — record actual check-in time
export const recordCheckIn = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const at = req.body.checkInTime ? new Date(req.body.checkInTime) : new Date();
  if (Number.isNaN(at.getTime())) throw new ApiError(400, "Invalid checkInTime");

  // A student can only come back from a leave they went out on. This took any leave, even a
  // pending, rejected or cancelled one, and before any check-out, so the register showed children
  // "back" who had never left.
  const leave = await HostelLeave.findOneAndUpdate(
    { _id: req.params.id, schoolId, status: "approved", checkOutTime: { $ne: null, $lte: at }, checkInTime: null },
    { $set: { checkInTime: at } },
    { new: true }
  );
  if (!leave) {
    const existing = await HostelLeave.findOne({ _id: req.params.id, schoolId }).select("status checkOutTime checkInTime").lean();
    if (!existing) throw new ApiError(404, "Leave not found");
    if (existing.status !== "approved") throw new ApiError(400, "Only approved leaves can be checked in");
    if (!existing.checkOutTime) throw new ApiError(400, "Record the check-out before the check-in");
    if (existing.checkInTime) throw new ApiError(409, "Check-in is already recorded for this leave");
    throw new ApiError(400, "Check-in cannot be before the check-out");
  }
  return res.json(new ApiResponse(200, leave, "Check-in recorded"));
});

// DELETE /hostel/leaves/:id
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const leave = await HostelLeave.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!leave) throw new ApiError(404, "Leave request not found");
  return res.json(new ApiResponse(200, null, "Leave deleted"));
});
