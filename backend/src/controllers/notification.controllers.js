import mongoose from "mongoose";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { sendPushToUsers } from "../utils/pushService.js";
import { sendWhatsAppToUsers } from "../utils/whatsappServices.js";
import { sendSmsToUsers } from "../utils/smsServices.js";
import { sendEmailToUsers } from "../utils/mailServices.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const CREATE_ALLOWED_ROLES = [
  "Super Admin",
  "School Admin",
  "Principal",
  "Vice Principal",
  "Exam Coordinator",
  "Receptionist",
  "IT Support",
];

const TARGET_LEVELS = ["all", "role", "user-level", "user"];

const getRoleName = (user) => {
  if (typeof user?.role === "string") return user.role;
  return user?.roleId?.name || user?.role?.name || "";
};

const normalizeText = (value) => String(value || "").trim();

const normalizeArray = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(source.map(normalizeText).filter(Boolean))];
};

const normalizeComparableArray = (value) => normalizeArray(value).map((item) => item.toLowerCase());

const getUserLevelTokens = (user) => {
  const rawValues = [
    user?.level,
    user?.className,
    user?.class,
    user?.profile?.className,
    user?.section,
    user?.department,
    user?.designation,
    getRoleName(user),
  ];

  return normalizeComparableArray(rawValues);
};

const normalizeUserIdentityTokens = (user) => {
  const tokens = [user?._id, user?.id, user?.email, user?.regId]
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
  const roleName = getRoleName(user);
  const roleNameKey = roleName.toLowerCase();
  const userLevels = getUserLevelTokens(user);
  const userIds = normalizeUserIdentityTokens(user).map((token) => token.toLowerCase());

  if (!canNotificationBeSeenNow(notification)) return false;
  // The sender must always see what they sent — otherwise a role/user-targeted broadcast
  // that excludes the sender's own role (e.g. Receptionist → Students) vanishes from their
  // own "sent" history right after creation, looking like the send silently failed.
  if (notification.createdById && `${notification.createdById}` === `${user?._id || ""}`) return true;
  if (notification.level === "all") return true;

  if (notification.level === "role") {
    return normalizeComparableArray(notification.targetRoles).includes(roleNameKey);
  }

  if (notification.level === "user-level") {
    const targetRoles = normalizeComparableArray(notification.targetRoles);
    const targetLevels = normalizeComparableArray(notification.targetLevels);
    const roleAllowed = !targetRoles.length || targetRoles.includes(roleNameKey);
    const levelAllowed = !targetLevels.length || targetLevels.some((level) => userLevels.includes(level));

    return roleAllowed && levelAllowed;
  }

  if (notification.level === "user") {
    const targets = normalizeComparableArray(notification.targetUserIds);
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
        opened: readBy.length || row.deliveryStats?.opened || 0,
        failed: row.deliveryStats?.failed || 0,
      },
    };
  });
};

const getSchoolScopeFilter = (req) => {
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId || null;
  const roleName = getRoleName(req.user);

  return roleName === "Super Admin" || !schoolId
    ? {}
    : {
        $or: [{ schoolId }, { schoolId: null }],
      };
};

const buildQueryFilter = (req) => {
  const filter = getSchoolScopeFilter(req);
  const { level, status, q } = req.query || {};

  if (level && TARGET_LEVELS.includes(level)) filter.level = level;
  if (status && ["draft", "scheduled", "sent"].includes(status)) filter.status = status;
  if (q?.trim()) {
    const safeQ = escapeRegex(q.trim());
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { title: { $regex: safeQ, $options: "i" } },
          { message: { $regex: safeQ, $options: "i" } },
          { createdBy: { $regex: safeQ, $options: "i" } },
        ],
      },
    ];
  }

  return filter;
};

/**
 * Turns a Notification's targeting (level/targetRoles/targetUserObjectIds) into a concrete list of
 * User._ids to push to. This is necessarily a best-effort broadcast list, not the precise per-user
 * gate `isVisibleToUser` applies at read time — e.g. "user-level" here falls back to matching by
 * role alone, without re-checking the finer-grained level tokens. GET /notification (in-app) stays
 * the source of truth for who a notice is actually addressed to; push is just the nudge to open it.
 */
const resolveTargetUserIds = async (notification) => {
  const { level, targetRoles, targetUserObjectIds, schoolId } = notification;
  const scopeFilter = schoolId
    ? { schoolId, isActive: true, isDeleted: { $ne: true } }
    : { isActive: true, isDeleted: { $ne: true } };

  if (level === "user") {
    return (targetUserObjectIds || []).map((id) => new mongoose.Types.ObjectId(id));
  }

  if (level === "all") {
    const users = await User.find(scopeFilter).select("_id");
    return users.map((u) => u._id);
  }

  // "role" and "user-level"
  if (targetRoles?.length) {
    const roles = await Role.find({
      name: { $in: targetRoles.map((r) => new RegExp(`^${escapeRegex(r)}$`, "i")) },
    }).select("_id");
    if (!roles.length) return [];

    const users = await User.find({ ...scopeFilter, roleId: { $in: roles.map((r) => r._id) } }).select("_id");
    return users.map((u) => u._id);
  }

  return [];
};

export const listNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find(buildQueryFilter(req)).sort({ createdAt: -1 }).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));

  return sendSuccess(res, {
    message: "Notifications fetched successfully",
    data: mapWithReadState(visibleRows, req.user),
  });
});

export const createNotification = asyncHandler(async (req, res) => {
  const roleName = getRoleName(req.user);

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
    status,
  } = req.body || {};

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!message?.trim()) throw new ApiError(400, "Message is required");
  if (!TARGET_LEVELS.includes(level)) throw new ApiError(400, "Invalid level value");

  const normalizedTargetRoles = normalizeArray(targetRoles);
  const normalizedTargetLevels = normalizeArray(targetLevels);
  const normalizedTargetUserIds = normalizeArray(targetUserIds);

  if ((level === "role" || level === "user-level") && !normalizedTargetRoles.length) {
    throw new ApiError(400, "targetRoles is required for selected level");
  }
  if (level === "user-level" && !normalizedTargetLevels.length) {
    throw new ApiError(400, "targetLevels is required for user-level notifications");
  }
  if (level === "user" && !normalizedTargetUserIds.length) {
    throw new ApiError(400, "targetUserIds is required for user notifications");
  }

  const normalizedChannels = {
    inApp: channels?.inApp !== false,
    email: Boolean(channels?.email),
    sms: Boolean(channels?.sms),
    whatsapp: Boolean(channels?.whatsapp),
    push: Boolean(channels?.push),
  };

  if (!Object.values(normalizedChannels).some(Boolean)) {
    throw new ApiError(400, "At least one delivery channel is required");
  }

  const scheduledDate = toDateOrNull(scheduledAt);
  if (scheduledAt && !scheduledDate) throw new ApiError(400, "Invalid scheduledAt datetime");

  const finalStatus =
    status === "draft" ? "draft" : scheduledDate && scheduledDate.getTime() > Date.now() ? "scheduled" : "sent";

  const created = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    level,
    targetRoles: level === "all" || level === "user" ? [] : normalizedTargetRoles,
    targetLevels: level === "user-level" ? normalizedTargetLevels : [],
    targetUserIds: level === "user" ? normalizedTargetUserIds : [],
    targetUserObjectIds: normalizedTargetUserIds.filter((item) => mongoose.Types.ObjectId.isValid(item)),
    channels: normalizedChannels,
    timezone: normalizeText(timezone) || "UTC",
    scheduledAt: scheduledDate,
    status: finalStatus,
    deliveryStats: {
      sent: normalizedChannels.inApp && finalStatus !== "draft" ? 1 : 0,
      opened: 0,
      failed: 0,
    },
    createdBy: req.user?.name || req.user?.fullName || req.user?.email || "Unknown",
    createdById: req.user?._id,
    schoolId: req.user?.schoolId?._id || req.user?.schoolId || null,
  });

  let result = created;

  const anyExternalChannel =
    normalizedChannels.push || normalizedChannels.whatsapp || normalizedChannels.email || normalizedChannels.sms;

  if (anyExternalChannel && finalStatus === "sent") {
    const targetUserIds = await resolveTargetUserIds(created);

    if (normalizedChannels.push) {
      const pushResult = await sendPushToUsers(targetUserIds, { title: created.title, body: created.message, data: { notificationId: String(created._id) } });

      if (!pushResult.skipped) {
        result = await Notification.findByIdAndUpdate(
          created._id,
          { $inc: { "deliveryStats.sent": pushResult.sent, "deliveryStats.failed": pushResult.failed } },
          { new: true }
        );
      }
    }

    if (normalizedChannels.whatsapp) {
      const whatsappResult = await sendWhatsAppToUsers(targetUserIds, { title: created.title, body: created.message });

      if (!whatsappResult.skipped) {
        result = await Notification.findByIdAndUpdate(
          created._id,
          { $inc: { "deliveryStats.sent": whatsappResult.sent, "deliveryStats.failed": whatsappResult.failed } },
          { new: true }
        );
      }
    }

    if (normalizedChannels.email) {
      const emailResult = await sendEmailToUsers(targetUserIds, { title: created.title, body: created.message });

      if (!emailResult.skipped) {
        result = await Notification.findByIdAndUpdate(
          created._id,
          { $inc: { "deliveryStats.sent": emailResult.sent, "deliveryStats.failed": emailResult.failed } },
          { new: true }
        );
      }
    }

    if (normalizedChannels.sms) {
      const smsResult = await sendSmsToUsers(targetUserIds, { title: created.title, body: created.message });

      if (!smsResult.skipped) {
        result = await Notification.findByIdAndUpdate(
          created._id,
          { $inc: { "deliveryStats.sent": smsResult.sent, "deliveryStats.failed": smsResult.failed } },
          { new: true }
        );
      }
    }
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: "Notification created successfully",
    data: result,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid notification id");

  const token = getPrimaryUserToken(req.user);
  const existing = await Notification.findOne({ _id: id, ...getSchoolScopeFilter(req) }).lean();
  if (!existing || !isVisibleToUser(existing, req.user)) throw new ApiError(404, "Notification not found");

  const update = existing.readBy?.includes(token)
    ? { $set: { readBy: existing.readBy } }
    : {
        $addToSet: { readBy: token },
        $push: { readReceipts: { userToken: token, readAt: new Date() } },
      };

  const updated = await Notification.findByIdAndUpdate(id, update, { new: true }).lean();

  return sendSuccess(res, {
    message: "Notification marked as read",
    data: mapWithReadState([updated], req.user)[0],
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const token = getPrimaryUserToken(req.user);
  const rows = await Notification.find(getSchoolScopeFilter(req)).sort({ createdAt: -1 }).lean();
  const visibleRows = rows.filter((row) => isVisibleToUser(row, req.user));
  const unreadIds = visibleRows.filter((row) => !(row.readBy || []).includes(token)).map((row) => row._id);

  if (!unreadIds.length) {
    return sendSuccess(res, {
      message: "No notifications to update",
      data: { updatedCount: 0 },
    });
  }

  await Notification.updateMany(
    { _id: { $in: unreadIds } },
    {
      $addToSet: { readBy: token },
      $push: { readReceipts: { userToken: token, readAt: new Date() } },
    }
  );

  return sendSuccess(res, {
    message: "All visible notifications marked as read",
    data: { updatedCount: unreadIds.length },
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
      if (row.status === "draft") acc.draft += 1;
      return acc;
    },
    { total: 0, sent: 0, opened: 0, failed: 0, scheduled: 0, draft: 0 }
  );

  return sendSuccess(res, {
    message: "Notification analytics fetched",
    data: analytics,
  });
});