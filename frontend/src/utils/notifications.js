import httpClient from "../api/httpClient";

const normalizeArray = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(source.map((item) => String(item).trim()).filter(Boolean))];
};

export const getNotifications = async (params = {}) => {
  const response = await httpClient.get("/notifications", { params });
  return response.data?.data || [];
};

export const getNotificationAnalytics = async () => {
  const response = await httpClient.get("/notifications/analytics");
  return response.data?.data || {};
};

export const saveNotifications = async (payload) => {
  const response = await httpClient.post("/notifications", payload);
  return response.data?.data;
};

/**
 * The bell in the top bar listens for this, so reading a notification anywhere (the dropdown, the
 * Notifications page, the Communication hub) updates its count at once rather than on its next check.
 */
export const NOTIFICATIONS_CHANGED = "notifications:changed";
const announceChange = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
};

/** Unread count and the newest few — polled by the bell. Never served from the GET cache. */
export const getUnreadNotifications = async () => {
  const response = await httpClient.get("/notifications/unread", { noCache: true });
  const data = response.data?.data || {};
  return { count: Number(data.count) || 0, latest: Array.isArray(data.latest) ? data.latest : [] };
};

export const markNotificationAsRead = async (id) => {
  const response = await httpClient.patch(`/notifications/${id}/read`);
  announceChange();
  return response.data?.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await httpClient.patch("/notifications/read-all");
  announceChange();
  return response.data?.data;
};

const getUserLevelTokens = (user) => {
  const rawValues = [
    user?.level,
    user?.className,
    user?.class,
    user?.profile?.className,
    user?.section,
    user?.department,
    user?.designation,
    user?.role?.name,
    user?.roleId?.name,
  ];

  return normalizeArray(rawValues).map((value) => value.toLowerCase());
};

export const getUserIdentityTokens = (user) =>
  normalizeArray([user?._id, user?.id, user?.email, user?.regId]).map((value) => value.toLowerCase());

export const isNotificationVisibleToUser = (notification, user) => {
  if (notification?.isRead !== undefined) return true;

  const roleName = (typeof user?.role === "string" ? user.role : user?.role?.name || user?.roleId?.name || "").toLowerCase();
  const userIds = getUserIdentityTokens(user);
  const userLevels = getUserLevelTokens(user);

  if (notification.level === "all") return true;

  if (notification.level === "role") {
    return normalizeArray(notification.targetRoles)
      .map((role) => role.toLowerCase())
      .includes(roleName);
  }

  if (notification.level === "user-level") {
    const targetRoles = normalizeArray(notification.targetRoles).map((role) => role.toLowerCase());
    const targetLevels = normalizeArray(notification.targetLevels).map((level) => level.toLowerCase());
    const roleAllowed = !targetRoles.length || targetRoles.includes(roleName);
    const levelAllowed = !targetLevels.length || targetLevels.some((level) => userLevels.includes(level));
    return roleAllowed && levelAllowed;
  }

  if (notification.level === "user") {
    const targets = normalizeArray(notification.targetUserIds).map((id) => id.toLowerCase());
    return userIds.some((id) => targets.includes(id));
  }

  return false;
};

export const getVisibleNotificationsForUser = (notifications, user) =>
  (notifications || []).filter((item) => isNotificationVisibleToUser(item, user));

export const createNotificationPayload = ({
  title,
  message,
  level = "all",
  targetRoles = [],
  targetLevels = [],
  targetUserIds = [],
  channels = { inApp: true },
  timezone = "UTC",
  scheduledAt = null,
  status,
}) => ({
  title: title.trim(),
  message: message.trim(),
  level,
  targetRoles: normalizeArray(targetRoles),
  targetLevels: normalizeArray(targetLevels),
  targetUserIds: normalizeArray(targetUserIds),
  channels,
  timezone,
  scheduledAt,
  status,
});