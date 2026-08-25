// controllers/activityController.js
import ActivityLog from "../models/ActivityLog.model.js";
import { User } from "../models/user.model.js";

// Create a new activity log
export const createActivityLog = async (req, res) => {
  try {
    const { action, description, meta } = req.body;

    // user/role/school/ipAddress/userAgent must come from the authenticated request, never the
    // body — any signed-in user (Student, Parent, ...) could otherwise forge a log entry
    // attributed to an arbitrary other user, role, or school, and Super Admin/School
    // Admin/IT Support/Principal read this collection back as a trusted audit trail
    // (getActivityLogs below). Mirrors how autoAudit.middleware.js derives the same fields.
    const log = new ActivityLog({
      user: req.user._id,
      action,
      description,
      role: req.user.roleId?._id || req.user.roleId,
      school: req.user.schoolId?._id || req.user.schoolId || null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || "",
      meta,
    });

    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create activity log" });
  }
};

// Get all logs with optional filters: school, user, role, date range
export const getActivityLogs = async (req, res) => {
  try {
    const { school, user, role, startDate, endDate, page = 1, limit = 100 } = req.query;

    let query = {};

    // Non-Super-Admin callers (School Admin, IT Support, Principal) must never see another
    // school's activity logs — without this, an empty/omitted `school` query param returned
    // every school's logs, since the filter was only ever applied when explicitly passed.
    const requesterRole = req.userRole?.name;
    if (requesterRole === "Super Admin") {
      if (school) query.school = school;
    } else {
      const ownSchoolId = req.user?.school?._id || req.user?.schoolId;
      if (!ownSchoolId) {
        return res.status(400).json({ success: false, message: "School context not found" });
      }
      query.school = ownSchoolId;
    }
    if (user) query.user = user;
    if (role) query.role = role;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 100, 1), 1000);
    const skip = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("user", "name email")
        .populate("role", "name")
        .populate("school", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};

// Optional: Delete a log (admin only)
export const deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    await ActivityLog.findByIdAndDelete(id);
    res.json({ success: true, message: "Activity log deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete activity log" });
  }
};
