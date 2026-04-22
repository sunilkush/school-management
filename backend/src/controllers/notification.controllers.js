import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const CREATE_ALLOWED_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];

const getUserLevelTokens = (user) => {
  const rawValues = [
    user?.level,
    user?.className,
    user?.class,
    user?.profile?.className,
    user?.section,
    user?.department,
    user?.roleId?.name,
    user?.role?.name,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return [...new Set(rawValues)];
};

const normalizeUserIdentityTokens = (user) => {
  const tokens = [user?._id, user?.id, user?.email]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return [...new Set(tokens)];
};

const isVisibleToUser = (notification, user) => {
  const roleName = user?.roleId?.name || user?.role?.name;
  const userLevels = getUserLevelTokens(user);
  const userIds = normalizeUserIdentityTokens(user);

  if (notification.level === "all") return true;

  if (notification.level === "role") {
    return (notification.targetRoles || []).includes(roleName);
  }

  if (notification.level === "user-level") {
    const targetRoles = notification.targetRoles || [];
    const targetLevels = notification.targetLevels || [];

    const roleAllowed = !targetRoles.length || targetRoles.includes(roleName);
    const levelAllowed = !targetLevels.length || targetLevels.some((level) => userLevels.includes(level));

    return roleAllowed && levelAllowed;
  }

  if (notification.level === "user") {
    const targets = notification.targetUserIds || [];
    return userIds.some((token) => targets.includes(token));
  }

  return false;
};

export const listNotifications = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId || null;
  const roleName = req.user?.roleId?.name || req.user?.role?.name;

  const baseFilter =
    roleName === "Super Admin" || !schoolId
      ? {}
      : {
          $or: [{ schoolId }, { schoolId: null }],
        };

  const rows = await Notification.find(baseFilter).sort({ createdAt: -1 }).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));

  return sendSuccess(res, {
    message: "Notifications fetched successfully",
    data: visibleRows,
  });
});

export const createNotification = asyncHandler(async (req, res) => {
  const roleName = req.user?.roleId?.name || req.user?.role?.name;

  if (!CREATE_ALLOWED_ROLES.includes(roleName)) {
    throw new ApiError(403, "Forbidden. You are not allowed to create notifications.");
  }

  const { title, message, level = "all", targetRoles = [], targetLevels = [], targetUserIds = [] } = req.body || {};

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!message?.trim()) throw new ApiError(400, "Message is required");
  if (!["all", "role", "user-level", "user"].includes(level)) {
    throw new ApiError(400, "Invalid level value");
  }

  if ((level === "role" || level === "user-level") && !targetRoles.length) {
    throw new ApiError(400, "targetRoles is required for selected level");
  }

  if (level === "user-level" && !targetLevels.length) {
    throw new ApiError(400, "targetLevels is required for user-level notifications");
  }

  if (level === "user" && !targetUserIds.length) {
    throw new ApiError(400, "targetUserIds is required for user notifications");
  }

  const created = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    level,
    targetRoles: targetRoles.map((item) => String(item).trim()).filter(Boolean),
    targetLevels: targetLevels.map((item) => String(item).trim()).filter(Boolean),
    targetUserIds: targetUserIds.map((item) => String(item).trim()).filter(Boolean),
    createdBy: req.user?.name || req.user?.fullName || req.user?.email || "Unknown",
    createdById: req.user?._id,
    schoolId: req.user?.schoolId?._id || req.user?.schoolId || null,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Notification created successfully",
    data: created,
  });
});
