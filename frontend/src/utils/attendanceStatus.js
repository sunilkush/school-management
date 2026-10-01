/** One status map, everywhere a staff member's own attendance is drawn. */
export const ATTENDANCE_STATUS = {
  present: { color: "var(--success)", label: "Present", short: "P" },
  late:    { color: "var(--warning)", label: "Late", short: "L" },
  halfday: { color: "var(--purple)", label: "Half Day", short: "½" },
  absent:  { color: "var(--danger)", label: "Absent", short: "A" },
  leave:   { color: "var(--cyan)", label: "Leave", short: "Lv" },
};

const HALF = { A: "1st half", B: "2nd half" };

export const attendanceLabel = (r) =>
  `${ATTENDANCE_STATUS[r.status]?.label || r.status}${r.halfDaySession ? ` · ${HALF[r.halfDaySession]}` : ""}${r.leaveDays === 0.5 && r.status !== "leave" ? " + ½ leave" : ""}`;

/** "3h 20m" between two moments, or null when either is missing. */
export const workedText = (from, to) => {
  if (!from || !to) return null;
  const mins = Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};
