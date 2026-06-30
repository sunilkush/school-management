import { LoginLog } from "../models/LoginLog.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

/* ── Internal helper — called from loginUser ────────────────────────────── */
export const recordLoginEvent = async ({ userId, schoolId, userRole, academicYearId, req, status = "success" }) => {
  try {
    const ua = req.headers["user-agent"] || "";
    const browser = parseBrowser(ua);
    const os = parseOS(ua);
    await LoginLog.create({
      userId,
      schoolId,
      userRole,
      academicYearId,
      ipAddress: req.ip || req.connection?.remoteAddress || "",
      deviceInfo: ua.slice(0, 250),
      browser,
      os,
      loginTime: new Date(),
      status,
    });
  } catch (err) {
    console.error("[LoginLog] Failed to record login event:", err.message);
  }
};

/* ── Internal helper — called from logoutUser ───────────────────────────── */
export const recordLogoutEvent = async (logId) => {
  try {
    if (!logId || !mongoose.Types.ObjectId.isValid(logId)) return;
    await LoginLog.findByIdAndUpdate(logId, { logoutTime: new Date() });
  } catch (err) {
    console.error("[LoginLog] Failed to record logout:", err.message);
  }
};

/* ── Simple UA parsers ──────────────────────────────────────────────────── */
const parseBrowser = (ua = "") => {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Opera")) return "Opera";
  return "Unknown";
};

const parseOS = (ua = "") => {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
};

/* ── API: Create log (manual / from client) ─────────────────────────────── */
export const createLoginLog = asyncHandler(async (req, res) => {
  const log = await LoginLog.create(req.body);
  res.status(201).json(new ApiResponse(201, log, "Login log created"));
});

/* ── API: Get logs for a specific user ──────────────────────────────────── */
export const getLoginLogsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Users can only see their own logs; admins can see anyone's
  const isAdmin = ["Super Admin", "School Admin"].includes(req.userRole?.name);
  if (!isAdmin && req.user._id.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const query = { userId };
  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    LoginLog.find(query).sort({ loginTime: -1 }).skip(skip).limit(Number(limit)),
    LoginLog.countDocuments(query),
  ]);

  res.status(200).json(new ApiResponse(200, {
    logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  }, "Login logs fetched"));
});

/* ── API: Get logs for a school ─────────────────────────────────────────── */
export const getLoginLogsBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    LoginLog.find({ schoolId })
      .populate("userId", "name email")
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoginLog.countDocuments({ schoolId }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  }, "School login logs fetched"));
});

/* ── API: Get logs for an academic year ─────────────────────────────────── */
export const getLoginLogsByAcademicYear = asyncHandler(async (req, res) => {
  const { academicYearId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    LoginLog.find({ academicYearId })
      .populate("userId", "name email")
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoginLog.countDocuments({ academicYearId }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  }, "Academic year login logs fetched"));
});

/* ── API: All logs with filters (admin) ─────────────────────────────────── */
export const getLoginLogs = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, userRole, status, startDate, endDate, page = 1, limit = 20 } = req.query;

  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const query = {};

  if (isSuperAdmin) {
    if (schoolId) query.schoolId = schoolId;
  } else {
    query.schoolId = req.user.schoolId;
  }

  if (academicYearId) query.academicYearId = academicYearId;
  if (userRole) query.userRole = userRole;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.loginTime = {};
    if (startDate) query.loginTime.$gte = new Date(startDate);
    if (endDate) query.loginTime.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    LoginLog.find(query)
      .populate("userId", "name email")
      .populate("schoolId", "name")
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LoginLog.countDocuments(query),
  ]);

  res.status(200).json(new ApiResponse(200, {
    logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  }, "Login logs fetched"));
});

/* ── API: Set logout time ───────────────────────────────────────────────── */
export const setLogoutTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const log = await LoginLog.findByIdAndUpdate(id, { logoutTime: new Date() }, { new: true });
  if (!log) return res.status(404).json({ success: false, message: "Log not found" });
  res.status(200).json(new ApiResponse(200, log, "Logout time recorded"));
});

/* ── API: Login stats ───────────────────────────────────────────────────── */
export const getLoginStats = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.userRole?.name === "Super Admin";
  const { academicYearId } = req.query;
  const schoolId = isSuperAdmin ? req.query.schoolId : req.user.schoolId;

  const match = {};
  if (schoolId) match.schoolId = new mongoose.Types.ObjectId(schoolId);
  if (academicYearId) match.academicYearId = new mongoose.Types.ObjectId(academicYearId);

  const stats = await LoginLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$userRole",
        totalLogins: { $sum: 1 },
        successfulLogins: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
        failedLogins: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        lastLogin: { $max: "$loginTime" },
      },
    },
    { $sort: { totalLogins: -1 } },
  ]);

  // Daily trend (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyTrend = await LoginLog.aggregate([
    { $match: { ...match, loginTime: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$loginTime" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json(new ApiResponse(200, { stats, dailyTrend }, "Login stats fetched"));
});
