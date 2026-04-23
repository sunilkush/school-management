import mongoose from "mongoose";
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
const getPrimaryUserToken = (user) => normalizeUserIdentityTokens(user)[0] || "guest";

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const canCreateRole = (roleName) => CREATE_ALLOWED_ROLES.includes(roleName);

const canNotificationBeSeenNow = (notification) => {
  if (notification.status !== "scheduled") return true;
  if (!notification.scheduledAt) return true;
  return new Date(notification.scheduledAt).getTime() <= Date.now();
};

const isVisibleToUser = (notification, user) => {
  const roleName = user?.roleId?.name || user?.role?.name;
  const userLevels = getUserLevelTokens(user);
  const userIds = normalizeUserIdentityTokens(user);
  if (!canNotificationBeSeenNow(notification)) return false;
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

const mapWithReadState = (rows, user) => {
  const tokens = normalizeUserIdentityTokens(user);
  return rows.map((row) => {
    const readBy = row.readBy || [];
    const isRead = tokens.some((token) => readBy.includes(token));

    return {
      ...row,
      isRead,
      deliveryStats: {
        sent: row.deliveryStats?.sent || 0,
        opened: row.readBy?.length || row.deliveryStats?.opened || 0,
        failed: row.deliveryStats?.failed || 0,
      },
    };
  });
};

const getSchoolScopeFilter = (req) => {
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId || null;
  const roleName = req.user?.roleId?.name || req.user?.role?.name;
  
  return roleName === "Super Admin" || !schoolId
    ? {}
    : {
        $or: [{ schoolId }, { schoolId: null }],
      };
};

export const listNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find(getSchoolScopeFilter(req)).sort({ createdAt: -1 }).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));
  const rowsWithRead = mapWithReadState(visibleRows, req.user);

  return sendSuccess(res, {
    message: "Notifications fetched successfully",
    data: rowsWithRead,
  });
});

export const createNotification = asyncHandler(async (req, res) => {
  const roleName = req.user?.roleId?.name || req.user?.role?.name;

  if (!canCreateRole(roleName)) {
    throw new ApiError(403, "Forbidden. You are not allowed to create notifications.");
  }

  const {
    title,
    message,
    level = "all",
    targetRoles = [],
    targetLevels = [],
    targetUserIds = [],
    channels = {},
    timezone = "UTC",
    scheduledAt = null,
  } = req.body || {};


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
  const normalizedChannels = {
    inApp: channels?.inApp !== false,
    email: Boolean(channels?.email),
    sms: Boolean(channels?.sms),
    whatsapp: Boolean(channels?.whatsapp),
  };

  if (!Object.values(normalizedChannels).some(Boolean)) {
    throw new ApiError(400, "At least one delivery channel is required");
  }

  const scheduledDate = toDateOrNull(scheduledAt);
  if (scheduledAt && !scheduledDate) {
    throw new ApiError(400, "Invalid scheduledAt datetime");
  }
  const created = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    level,
    targetRoles: targetRoles.map((item) => String(item).trim()).filter(Boolean),
    targetLevels: targetLevels.map((item) => String(item).trim()).filter(Boolean),
    targetUserIds: targetUserIds.map((item) => String(item).trim()).filter(Boolean),
    channels: normalizedChannels,
    timezone: String(timezone || "UTC").trim(),
    scheduledAt: scheduledDate,
    status: scheduledDate && scheduledDate.getTime() > Date.now() ? "scheduled" : "sent",
    deliveryStats: {
      sent: normalizedChannels.inApp ? 1 : 0,
      opened: 0,
      failed: 0,
    },
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
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid notification id");
  }

  const token = getPrimaryUserToken(req.user);

  const updated = await Notification.findOneAndUpdate(
    { _id: id, ...getSchoolScopeFilter(req) },
    {
      $addToSet: {
        readBy: token,
        readReceipts: {
          userToken: token,
          readAt: new Date(),
        },
      },
    },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Notification not found");

  return sendSuccess(res, {
    message: "Notification marked as read",
    data: {
      ...updated,
      isRead: true,
      deliveryStats: {
        sent: updated.deliveryStats?.sent || 0,
        opened: updated.readBy?.length || 0,
        failed: updated.deliveryStats?.failed || 0,
      },
    },
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const token = getPrimaryUserToken(req.user);

  const rows = await Notification.find(getSchoolScopeFilter(req)).sort({ createdAt: -1 }).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));
  const ids = visibleRows.map((row) => row._id);

  if (!ids.length) {
    return sendSuccess(res, {
      message: "No notifications to update",
      data: { updatedCount: 0 },
    });
  }

  await Notification.updateMany(
    { _id: { $in: ids } },
    {
      $addToSet: {
        readBy: token,
        readReceipts: {
          userToken: token,
          readAt: new Date(),
        },
      },
    }
  );

  return sendSuccess(res, {
    message: "All visible notifications marked as read",
    data: { updatedCount: ids.length },
  });
});

export const notificationAnalytics = asyncHandler(async (req, res) => {
  const rows = await Notification.find(getSchoolScopeFilter(req)).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));

  const analytics = visibleRows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.sent += row.deliveryStats?.sent || 0;
      acc.opened += row.readBy?.length || row.deliveryStats?.opened || 0;
      acc.failed += row.deliveryStats?.failed || 0;
      if (row.status === "scheduled") acc.scheduled += 1;
      return acc;
    },
    { total: 0, sent: 0, opened: 0, failed: 0, scheduled: 0 }
  );

  return sendSuccess(res, {
    message: "Notification analytics fetched",
    data: analytics,
  });
});