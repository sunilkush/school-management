const STORAGE_KEY = "school_mgmt_notifications_v1";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "sys-1",
    title: "Welcome to notifications",
    message: "School dashboard now supports level-wise notifications for all users.",
    level: "all",
    targetRoles: [],
    targetLevels: [],
    targetUserIds: [],
    createdAt: "2026-04-10T07:30:00.000Z",
    createdBy: "System",
  },
  {
    id: "sys-2",
    title: "Teacher update",
    message: "Please complete attendance entries before 4:00 PM today.",
    level: "role",
    targetRoles: ["Teacher"],
    targetLevels: [],
    targetUserIds: [],
    createdAt: "2026-04-10T08:00:00.000Z",
    createdBy: "Academic Office",
  },
  {
    id: "sys-3",
    title: "Class 10 notice",
    message: "Class 10 students have exam orientation in Auditorium A.",
    level: "user-level",
    targetRoles: ["Student", "Parent"],
    targetLevels: ["Class 10"],
    targetUserIds: [],
    createdAt: "2026-04-10T08:30:00.000Z",
    createdBy: "Examination Cell",
  },
];

const parseNotifications = (rawValue) => {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getNotifications = () => {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;

  const stored = parseNotifications(window.localStorage.getItem(STORAGE_KEY));
  if (stored) {
    return stored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
  return DEFAULT_NOTIFICATIONS;
};

export const saveNotifications = (notifications) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

const getUserLevelTokens = (user) => {
  const rawValues = [
    user?.level,
    user?.className,
    user?.class,
    user?.profile?.className,
    user?.section,
    user?.department,
    user?.role?.name,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return [...new Set(rawValues)];
};

export const getUserIdentity = (user) => String(user?._id || user?.id || user?.email || "guest");

export const isNotificationVisibleToUser = (notification, user) => {
  const roleName = user?.role?.name;
  const userId = getUserIdentity(user);
  const userLevels = getUserLevelTokens(user);

  if (notification.level === "all") return true;

  if (notification.level === "role") {
    return notification.targetRoles?.includes(roleName);
  }

  if (notification.level === "user-level") {
    const roleAllowed =
      !notification.targetRoles?.length || notification.targetRoles.includes(roleName);
    const levelAllowed =
      !notification.targetLevels?.length ||
      notification.targetLevels.some((level) => userLevels.includes(level));
    return roleAllowed && levelAllowed;
  }

  if (notification.level === "user") {
    return notification.targetUserIds?.includes(userId);
  }

  return false;
};

export const getVisibleNotificationsForUser = (notifications, user) =>
  (notifications || []).filter((item) => isNotificationVisibleToUser(item, user));

export const createNotificationPayload = ({
  title,
  message,
  level,
  targetRoles = [],
  targetLevels = [],
  targetUserIds = [],
  createdBy = "Unknown",
}) => ({
  id: `ntf-${Date.now()}`,
  title: title.trim(),
  message: message.trim(),
  level,
  targetRoles,
  targetLevels,
  targetUserIds,
  createdAt: new Date().toISOString(),
  createdBy,
});
