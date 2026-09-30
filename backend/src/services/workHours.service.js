/**
 * What a day of self check-in counts as, from the hours between check-in and check-out:
 *   - under halfDayHours (4.5 h by default) → absent
 *   - from halfDayHours → half day: "A" if most of it was in the first half of school hours,
 *     "B" if in the second
 *   - from fullDayHours → full day. That is 8 h by default but never more than the school's own
 *     hours: check-in closes and the auto-checkout fires at School Ends, so a 7-hour school could
 *     otherwise never give anyone a full day.
 */
const toMinutes = (hm, fallback) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback;
};

export const dayRules = (attendanceHours = {}) => {
  const start = toMinutes(attendanceHours.startTime, 8 * 60);
  const end = toMinutes(attendanceHours.endTime, 15 * 60);
  const spanHours = Math.max((end - start) / 60, 0);
  const fullDayHours = Math.min(Number(attendanceHours.fullDayHours ?? 8), spanHours || 24);
  const halfDayHours = Math.min(Number(attendanceHours.halfDayHours ?? 4.5), fullDayHours);
  return { start, end, spanHours, fullDayHours, halfDayHours };
};

/**
 * @param record  attendance row with date (UTC midnight of the IST day), checkInAt, checkOutAt, status
 * @returns { status, halfDaySession, workedHours }
 */
export const statusFromWorkedHours = (record, attendanceHours) => {
  const rules = dayRules(attendanceHours);
  const inAt = new Date(record.checkInAt).getTime();
  const outAt = new Date(record.checkOutAt).getTime();
  const workedHours = Math.max(outAt - inAt, 0) / 3600000;

  if (workedHours >= rules.fullDayHours) {
    return { status: record.status === "late" ? "late" : "present", halfDaySession: null, workedHours };
  }
  if (workedHours >= rules.halfDayHours) {
    // Midpoint of school hours on that day, as an instant (IST is UTC+5:30).
    const dayStart = new Date(record.date).getTime();
    const mid = dayStart + ((rules.start + rules.end) / 2 - 330) * 60000;
    const firstHalf = Math.max(Math.min(outAt, mid) - inAt, 0);
    const secondHalf = Math.max(outAt - Math.max(inAt, mid), 0);
    return { status: "halfday", halfDaySession: firstHalf >= secondHalf ? "A" : "B", workedHours };
  }
  return { status: "absent", halfDaySession: null, workedHours };
};

export const describeWorked = ({ status, halfDaySession, workedHours }) => {
  const h = `${Math.floor(workedHours)}h ${Math.round((workedHours % 1) * 60)}m`;
  if (status === "halfday") return `Worked ${h}: half day (${halfDaySession === "A" ? "first" : "second"} half)`;
  if (status === "absent") return `Worked ${h}: less than a half day`;
  return `Worked ${h}`;
};
