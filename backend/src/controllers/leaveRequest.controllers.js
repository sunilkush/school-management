import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* Verify the given child userId is actually linked to this parent as
   father/mother/guardian — same check used across the parent portal. */
const verifyParentChild = async (parentId, childUserId) => {
  const child = await Student.findOne({
    userId: childUserId,
    $or: [{ fatherId: parentId }, { motherId: parentId }, { guardianId: parentId }],
  }).select("_id");
  if (!child) throw new ApiError(403, "You are not authorized to access this child's data");
  return child;
};

/* ── CREATE LEAVE REQUEST ────────────────────────────────────────────────── */
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { userId, role, leaveType, startDate, endDate, totalDays, reason, attachmentUrl } =
    req.body;

  if (!role) throw new ApiError(400, "Role is required");
  if (!startDate) throw new ApiError(400, "Start date is required");
  if (!endDate) throw new ApiError(400, "End date is required");
  if (!totalDays) throw new ApiError(400, "Total days is required");
  if (!reason?.trim()) throw new ApiError(400, "Reason is required");

  // Privileged roles can submit leave on behalf of another user outright;
  // a Parent may only do so for a child verified as their own.
  const canActOnBehalf = ["Super Admin", "HR"].includes(req.userRole?.name);
  const isParent = req.userRole?.name === "Parent";
  let resolvedUserId = req.user._id;
  if (canActOnBehalf && userId) {
    resolvedUserId = userId;
  } else if (isParent && userId) {
    await verifyParentChild(req.user._id, userId);
    resolvedUserId = userId;
  }
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

  const isSuperAdmin = req.userRole?.name === "Super Admin";
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
  const { status, year, userId } = req.query;

  const schoolId = req.user.school?._id || req.user.schoolId;

  // A Parent viewing a specific child's leave requests must pass that
  // child's userId explicitly and have it verified — otherwise this
  // always falls back to the caller's own requests.
  let targetUserId = req.user._id;
  if (req.userRole?.name === "Parent" && userId) {
    await verifyParentChild(req.user._id, userId);
    targetUserId = userId;
  }

  const filter = { userId: targetUserId, schoolId };

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
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const isSchoolAdmin = req.userRole?.name === "School Admin";
  // School Admin can only delete leave requests within their own school
  const isSameSchool = leaveRequest.schoolId?.toString() === req.user.schoolId?.toString();
  // A Parent may cancel a leave request that belongs to their own verified child
  let isOwnChild = false;
  if (!isOwner && req.userRole?.name === "Parent") {
    const child = await Student.findOne({
      userId: leaveRequest.userId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id");
    isOwnChild = Boolean(child);
  }

  if (!isOwner && !isOwnChild && !(isSuperAdmin || (isSchoolAdmin && isSameSchool))) {
    throw new ApiError(403, "Access denied");
  }

  if (leaveRequest.status !== "pending")
    throw new ApiError(400, "Cannot cancel processed request");

  await leaveRequest.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Leave request deleted successfully"));
});
