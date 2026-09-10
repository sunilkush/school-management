// Exact enum from backend/src/models/attendance.model.js — note "halfday", not "half-day".
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'halfday', 'leave'];

// Colors match the web app's attendance status tags exactly (frontend/src/components/attendance/
// StatusTag.jsx antd `Tag` color names present→green, absent→red, late→orange, halfday→gold,
// leave→blue — translated to antd's actual preset hex values so both apps render the same colors).
export const STATUS_META = {
  present: { label: 'Present', color: '#52C41A', icon: 'check-circle-outline' },
  absent: { label: 'Absent', color: '#FF4D4F', icon: 'close-circle-outline' },
  late: { label: 'Late', color: '#FA8C16', icon: 'clock-alert-outline' },
  halfday: { label: 'Half Day', color: '#FAAD14', icon: 'clock-time-four-outline' },
  leave: { label: 'Leave', color: '#1677FF', icon: 'calendar-remove-outline' },
};

export function summarizeAttendance(records = []) {
  const counts = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0 };
  for (const record of records) {
    if (counts[record.status] !== undefined) counts[record.status] += 1;
  }
  const total = records.length;
  const presentLike = counts.present + counts.halfday * 0.5;
  const percentage = total > 0 ? Math.round((presentLike / total) * 100) : 0;
  return { counts, total, percentage };
}

export function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
