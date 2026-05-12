export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const dayLabel = (day) => day.charAt(0).toUpperCase() + day.slice(1);
export const getId = (value) => value?._id || value;
export const getName = (value, fallback = "—") => value?.name || value?.schoolName || value?.code || fallback;
export const buildGrid = (entries = []) => entries.reduce((grid, entry) => {
  const slotId = getId(entry.timeSlotId);
  if (!grid[slotId]) grid[slotId] = {};
  grid[slotId][entry.dayOfWeek] = entry;
  return grid;
}, {});
export const schoolIdFromUser = (user) => user?.schoolId?._id || user?.schoolId || user?.school?._id || "";
