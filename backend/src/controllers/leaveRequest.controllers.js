import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ── CREATE LEAVE REQUEST ────────────────────────────────────────────────── */
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { userId, role, leaveType, startDate, endDate, totalDays, reason, attachmentUrl } =
    req.body;

  if (!role) throw new ApiError(400, "Role is required");
  if (!startDate) throw new ApiError(400, "Start date is required");
  if (!endDate) throw new ApiError(400, "End date is required");
  if (!totalDays) throw new ApiError(400, "Total days is required");
  if (!reason?.trim()) throw new ApiError(400, "Reason is required");

  const resolvedUserId = userId || req.user._id;
  const schoolId = req.user.school?._id || req.user.schoolId;

  if (!schoolId) throw new ApiError(400, "School context not found");

  const leaveRequest = await LeaveRequest.create({
    schoolId,
    userId: resolvedUserId,
    role,
    leaveType: leaveType || "casual",
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalDays,
    reason: reason.trim(),
    attachmentUrl: attachmentUrl?.trim(),
  });

  res.status(201).json(new ApiResponse(201, leaveRequest, "Leave request created successfully"));
});

/* ── GET ALL LEAVE REQUESTS (Admin) ─────────────────────────────────────── */
export const getLeaveRequests = asyncHandler(async (req, res) => {
  const {
    schoolId: querySchoolId,
    status,
    role,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const isSuperAdmin = req.user.role?.name === "Super Admin";
  const schoolId = isSuperAdmin ? querySchoolId : req.user.school?._id || req.user.schoolId;

  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const filter = { schoolId };
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (userId) filter.userId = userId;
  if (startDate) filter.startDate = { $gte: new Date(startDate) };
  if (endDate) filter.endDate = { ...filter.endDate, $lte: new Date(endDate) };

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate("userId", "name email role")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LeaveRequest.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { requests, total, page: Number(page), limit: Number(limit) },
      "Leave requests fetched successfully"
    )
  );
});

/* ── GET MY LEAVE REQUESTS ───────────────────────────────────────────────── */
export const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const { status, year } = req.query;

  const schoolId = req.user.school?._id || req.user.schoolId;
  const filter = { userId: req.user._id, schoolId };

  if (status) filter.status = status;
  if (year) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);
    filter.startDate = { $gte: start, $lte: end };
  }

  const requests = await LeaveRequest.find(filter)
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, requests, "My leave requests fetched successfully"));
});

/* ── APPROVE LEAVE REQUEST ───────────────────────────────────────────────── */
export const approveLeaveRequest = asyncHandler(async (req, res) => {
  const isSuperAdmin = (req.userRole?.name || "").toLowerCase() === "super admin";
  const schoolId = req.user.school?._id || req.user.schoolId;

  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new ApiError(404, "Leave request not found");
  if (!isSuperAdmin && leaveRequest.schoolId.toString() !== schoolId?.toString())
    throw new ApiError(403, "Access denied");
  if (leaveRequest.status !== "pending")
    throw new ApiError(400, "Request already processed");

  leaveRequest.status = "approved";
  leaveRequest.approvedBy = req.user._id;
  leaveRequest.approvedAt = new Date();
  await leaveRequest.save();

  res
    .status(200)
    .json(new ApiResponse(200, leaveRequest, "Leave request approved successfully"));
});

/* ── REJECT LEAVE REQUEST ────────────────────────────────────────────────── */
export const rejectLeaveRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason?.trim()) throw new ApiError(400, "Rejection reason is required");

  const isSuperAdmin = (req.userRole?.name || "").toLowerCase() === "super admin";
  const schoolId = req.user.school?._id || req.user.schoolId;

  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new ApiError(404, "Leave request not found");
  if (!isSuperAdmin && leaveRequest.schoolId.toString() !== schoolId?.toString())
    throw new ApiError(403, "Access denied");
  if (leaveRequest.status !== "pending")
    throw new ApiError(400, "Request already processed");

  leaveRequest.status = "rejected";
  leaveRequest.rejectionReason = rejectionReason.trim();
  leaveRequest.approvedBy = req.user._id;
  leaveRequest.approvedAt = new Date();
  await leaveRequest.save();

  res
    .status(200)
    .json(new ApiResponse(200, leaveRequest, "Leave request rejected successfully"));
});

/* ── DELETE LEAVE REQUEST ────────────────────────────────────────────────── */
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new ApiError(404, "Leave request not found");

  const isOwner = leaveRequest.userId.toString() === req.user._id.toString();
  const isAdmin =
    req.user.role?.name === "Super Admin" || req.user.role?.name === "School Admin";

  if (!isOwner && !isAdmin) throw new ApiError(403, "Access denied");

  if (leaveRequest.status !== "pending")
    throw new ApiError(400, "Cannot cancel processed request");

  await leaveRequest.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Leave request deleted successfully"));
});
