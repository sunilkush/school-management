import mongoose from "mongoose";
import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { Attendance, ATTENDANCE_ROLES } from "../models/attendance.model.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { holdsRole } from "../utils/actingRole.js";

// Parent checks below look at every role held. A Teacher whose child studies here holds "Parent"
// as an additional role; a primary-role check never saw it, so a leave they filed for their child
// was silently filed for themselves, and they could not see or cancel their child's requests.
const holdsParent = (req) => holdsRole(req.user, "Parent");

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

// Leave is taken in whole school days, and the school's day is IST. The forms send either a plain
// date or a timestamp with the time of day in it, so both ends are compared by their IST day.
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const istDayStart = (date) => new Date(Math.floor((date.getTime() + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS);

/* ── CREATE LEAVE REQUEST ────────────────────────────────────────────────── */
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { userId, role, leaveType, startDate, endDate, totalDays, reason, attachmentUrl } =
    req.body;

  if (!role) throw new ApiError(400, "Role is required");
  if (!startDate) throw new ApiError(400, "Start date is required");
  if (!endDate) throw new ApiError(400, "End date is required");
  if (!totalDays) throw new ApiError(400, "Total days is required");
  if (!reason?.trim()) throw new ApiError(400, "Reason is required");

  // Who the leave is for. A School Admin may file for anyone in their own school (a primary Super
  // Admin for anyone), a Parent for a child verified as their own, everyone else only for
  // themselves. What this replaced had three holes:
  //   - the on-behalf user was never looked up, so a School Admin could file leave against a user of
  //     another school — and a non-ObjectId (the admin form's field says "User ID / Name") was a 500;
  //   - anyone else naming a userId was silently ignored and the leave filed for the CALLER instead;
  //   - it listed "HR", which is not a role in this system.
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const canActOnBehalf = isSuperAdmin || holdsRole(req.user, "School Admin");
  let resolvedUserId = req.user._id;
  let schoolId = req.user.school?._id || req.user.schoolId;

  if (userId && String(userId) !== String(req.user._id)) {
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "userId must be a valid user id");

    if (canActOnBehalf) {
      const target = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).select("schoolId").lean();
      if (!target || (!isSuperAdmin && String(target.schoolId) !== String(schoolId))) {
        throw new ApiError(404, "User not found in your school");
      }
      // The leave belongs to the user's school — a Super Admin usually has none of their own.
      if (isSuperAdmin) schoolId = target.schoolId;
    } else if (holdsParent(req)) {
      await verifyParentChild(req.user._id, userId);
    } else {
      throw new ApiError(403, "You can only request leave for yourself");
    }
    resolvedUserId = userId;
  }

  if (!schoolId) throw new ApiError(400, "School context not found");

  // Checked here rather than trusted from the form: an end date before the start was saved as is,
  // "30 days" could be claimed for a single day, and the same person could file the same days
  // twice and have both approved.
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ApiError(400, "Invalid start or end date");
  const firstDay = istDayStart(start);
  const lastDay = istDayStart(end);
  if (lastDay < firstDay) throw new ApiError(400, "End date cannot be before start date");
  const daysInRange = Math.round((lastDay - firstDay) / DAY_MS) + 1;
  const days = Number(totalDays);
  if (!Number.isFinite(days) || days < 0.5 || days > daysInRange) {
    throw new ApiError(400, `Total days must be between 0.5 and ${daysInRange} for these dates`);
  }

  const clash = await LeaveRequest.findOne({
    schoolId,
    userId: resolvedUserId,
    status: { $in: ["pending", "approved"] },
    startDate: { $lt: new Date(lastDay.getTime() + DAY_MS) },
    endDate: { $gte: firstDay },
  }).select("startDate endDate status").lean();
  if (clash) {
    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
    throw new ApiError(409, `There is already a ${clash.status} leave from ${fmt(clash.startDate)} to ${fmt(clash.endDate)} covering these days`);
  }

  const leaveRequest = await LeaveRequest.create({
    schoolId,
    userId: resolvedUserId,
    role,
    leaveType: leaveType || "casual",
    startDate: start,
    endDate: end,
    totalDays: days,
    reason: reason.trim(),
    attachmentUrl: attachmentUrl?.trim(),
  });

  // The overlap check above and this create are separate steps: a double-click filed the same days
  // twice. If an earlier request now covers these days, it stands and this one is withdrawn.
  const earlier = await LeaveRequest.exists({
    _id: { $ne: leaveRequest._id },
    schoolId,
    userId: resolvedUserId,
    status: { $in: ["pending", "approved"] },
    startDate: { $lt: new Date(lastDay.getTime() + DAY_MS) },
    endDate: { $gte: firstDay },
    $or: [
      { createdAt: { $lt: leaveRequest.createdAt } },
      { createdAt: leaveRequest.createdAt, _id: { $lt: leaveRequest._id } },
    ],
  });
  if (earlier) {
    await LeaveRequest.deleteOne({ _id: leaveRequest._id });
    throw new ApiError(409, "There is already a leave request covering these days");
  }

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

  // Capped: the leave screen asks for the whole list, since it splits it into tabs itself.
  const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 2000);
  const skip = (Number(page) - 1) * pageSize;

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate("userId", "name email role")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    LeaveRequest.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { requests, total, page: Number(page), limit: pageSize },
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
  if (holdsParent(req) && userId) {
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

// Attendance days are UTC midnights; a date picked in the browser may arrive as IST midnight
// (18:30 the day before in UTC), so round to the nearest day rather than truncating.
const toAttendanceDay = (d) => new Date(Math.floor((new Date(d).getTime() + DAY_MS / 2) / DAY_MS) * DAY_MS);

/**
 * An approved leave shows as "Leave" in attendance on each of its days, straight away rather
 * than only once the day is over. Sundays are skipped (no school). A day that already has a
 * record keeps it (they came in after all, or someone marked it), except the end-of-day job's own
 * "absent" (jobs/autoAbsent.job.js), which is exactly what an approval made after the day corrects.
 */
const recordLeaveInAttendance = async (leave, approverId) => {
  const first = toAttendanceDay(leave.startDate);
  const last = toAttendanceDay(leave.endDate);
  const days = [];
  for (let t = first.getTime(); t <= last.getTime() && days.length < 366; t += DAY_MS) {
    const day = new Date(t);
    if (day.getUTCDay() !== 0) days.push(day);
  }
  if (!days.length) return;

  const role = ATTENDANCE_ROLES.includes(leave.role) ? leave.role : "staff";
  const remarks = "On approved leave";
  try {
    await Attendance.bulkWrite([
      ...days.map((date) => ({
        updateOne: {
          filter: { schoolId: leave.schoolId, userId: leave.userId, date },
          update: { $setOnInsert: { role, status: "leave", source: "manual", markedBy: approverId, remarks } },
          upsert: true,
        },
      })),
      {
        updateMany: {
          filter: { schoolId: leave.schoolId, userId: leave.userId, source: "auto", status: "absent", date: { $in: days } },
          update: { $set: { status: "leave", remarks } },
        },
      },
    ], { ordered: false });
  } catch (err) {
    // A check-in for one of these days landed at the same moment; that record stands.
    if (!err?.writeErrors?.every?.((e) => e.code === 11000)) throw err;
  }
};

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

  // Only while still pending, in one update: approve and reject together both saved before, and
  // the last one silently replaced a decision the person had already been shown.
  const decided = await LeaveRequest.findOneAndUpdate(
    { _id: leaveRequest._id, status: "pending" },
    { $set: { status: "approved", approvedBy: req.user._id, approvedAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!decided) throw new ApiError(409, "This leave request was just decided by someone else — refresh to see it");

  await recordLeaveInAttendance(decided, req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, decided, "Leave request approved successfully"));
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

  const decided = await LeaveRequest.findOneAndUpdate(
    { _id: leaveRequest._id, status: "pending" },
    { $set: { status: "rejected", rejectionReason: rejectionReason.trim(), approvedBy: req.user._id, approvedAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!decided) throw new ApiError(409, "This leave request was just decided by someone else — refresh to see it");

  res
    .status(200)
    .json(new ApiResponse(200, decided, "Leave request rejected successfully"));
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
  if (!isOwner && holdsParent(req)) {
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

  // A request approved while this cancel was on its way stays: only a still-pending one is removed.
  const { deletedCount } = await LeaveRequest.deleteOne({ _id: leaveRequest._id, status: "pending" });
  if (!deletedCount) throw new ApiError(409, "This leave request was just decided — refresh to see it");

  res.status(200).json(new ApiResponse(200, null, "Leave request deleted successfully"));
});
