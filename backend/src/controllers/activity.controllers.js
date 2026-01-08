// controllers/activityController.js
import ActivityLog from "../models/ActivityLog.js";
import { User } from "../models/user.model.js";

// Create a new activity log
export const createActivityLog = async (req, res) => {
  try {
    const { user, action, description, role, school, ipAddress, userAgent, meta } = req.body;

    const log = new ActivityLog({
      user,
      action,
      description,
      role,
      school,
      ipAddress,
      userAgent,
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
    const { school, user, role, startDate, endDate } = req.query;

    let query = {};

    if (school) query.school = school;
    if (user) query.user = user;
    if (role) query.role = role;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .populate("user", "name email")
      .populate("role", "name")
      .populate("school", "name")
      .sort({ createdAt: -1 })
      .limit(1000); // future: add pagination

    res.json({ success: true, data: logs });
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
