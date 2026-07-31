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

  if (new Date(toDate) < new Date(fromDate)) {
    throw new ApiError(400, "toDate must be after fromDate");
  }

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
  const leave = await HostelLeave.findOne({ _id: req.params.id, schoolId });
  if (!leave) throw new ApiError(404, "Leave not found");
  if (leave.status !== "approved") throw new ApiError(400, "Only approved leaves can be checked out");

  leave.checkOutTime = req.body.checkOutTime ? new Date(req.body.checkOutTime) : new Date();
  await leave.save();
  return res.json(new ApiResponse(200, leave, "Check-out recorded"));
});

// PUT /hostel/leaves/:id/checkin  — record actual check-in time
export const recordCheckIn = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const leave = await HostelLeave.findOne({ _id: req.params.id, schoolId });
  if (!leave) throw new ApiError(404, "Leave not found");

  leave.checkInTime = req.body.checkInTime ? new Date(req.body.checkInTime) : new Date();
  await leave.save();
  return res.json(new ApiResponse(200, leave, "Check-in recorded"));
});

// DELETE /hostel/leaves/:id
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const leave = await HostelLeave.findOneAndDelete({ _id: req.params.id, schoolId });
  if (!leave) throw new ApiError(404, "Leave request not found");
  return res.json(new ApiResponse(200, null, "Leave deleted"));
});
