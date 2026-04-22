import httpClient from "../api/httpClient";

export const getNotifications = async () => {
  const response = await httpClient.get("/notifications");
  return response.data?.data || [];
};

export const saveNotifications = async (payload) => {
  const response = await httpClient.post("/notifications", payload);
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
 
}) => ({
  
  title: title.trim(),
  message: message.trim(),
  level,
  targetRoles,
  targetLevels,
  targetUserIds,
 
});
