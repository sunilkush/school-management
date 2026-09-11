import { useGetAttendanceRecordsQuery, useGetMonthlyAttendanceReportQuery } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';
import { STATUS_META, summarizeAttendance } from '../../utils/attendance';

// attendance.routes.js VIEW_ROLES / REPORT_ROLES — broad, because plenty of staff read attendance
// without being able to mark it.
const VIEW_ROLES = [
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Class Teacher',
  'Accountant', 'Hostel Warden', 'Exam Coordinator', 'Subject Coordinator', 'Receptionist',
];

/** `{ month, year }` for N months back, in the 1-12 form the report endpoint wants. */
function monthsAgo(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/**
 * The school-wide attendance browser.
 *
 * **Five sidebar entries are this one screen.** "Attendance Table", "Attendance Dashboard",
 * "Student Attendance", "Teacher Attendance" and "Staff Attendance" are all
 * `GET /attendance` with a different `role` filter — so they are one descriptor with a role chip
 * row, not five files. Building them separately is exactly how the previous app reached 294
 * screens.
 *
 * Read-only: marking is `MarkAttendance` (a roster, built in Phase 3) and correcting a past record
 * is a deliberate act the web portal handles with an audit trail.
 */
export const adminAttendanceModule = {
  key: 'AttendanceTable',
  title: 'Attendance',
  icon: 'clipboard-check-outline',
  aliases: ['AttendanceDashboard', 'StudentAttendance', 'TeacherAttendance', 'StaffAttendance'],

  servesRole: (ctx) => ctx.is(...VIEW_ROLES),
  notForRoleLabel: 'School-wide attendance is available to teaching and office staff.',

  // The role chip IS the filter — it is what separates the five sidebar entries from each other.
  useList: (ctx, { filter }) => useGetAttendanceRecordsQuery({ role: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.items ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.userId?.name, (row) => row.schoolClassId?.name],
  searchPlaceholder: 'Search by person or class',

  filter: {
    server: true,
    allLabel: 'Everyone',
    options: [
      { value: 'student', label: 'Students' },
      { value: 'teacher', label: 'Teachers' },
      { value: 'staff', label: 'Staff' },
    ],
  },

  summary: (rows) => {
    const { counts, total, percentage } = summarizeAttendance(rows);
    if (total === 0) return [];
    return [
      { label: 'Present', value: percentage, suffix: '%', icon: 'chart-donut', color: STATUS_META.present.color },
      { label: 'Absent', value: counts.absent, icon: STATUS_META.absent.icon, color: STATUS_META.absent.color },
      { label: 'Late', value: counts.late, icon: STATUS_META.late.icon, color: STATUS_META.late.color },
    ];
  },

  row: (row) => {
    const meta = STATUS_META[row.status];
    return {
      title: row.userId?.name ?? 'Unknown',
      subtitle: [row.schoolClassId?.name, row.sectionId?.name, row.subjectId?.name].filter(Boolean).join(' · '),
      meta: row.date ? formatDate(row.date) : null,
      badge: meta ? { label: meta.label, color: meta.color } : null,
    };
  },

  emptyIcon: 'clipboard-remove-outline',
  emptyLabel: 'No attendance records match',
  footerNote: 'Showing the most recent 100 records. Use the web portal for a full export.',

  detail: {
    title: 'Record',
    titleFor: (row) => row.userId?.name ?? 'Record',
    badgeFor: (row) => {
      const meta = STATUS_META[row.status];
      return meta ? { label: meta.label, color: meta.color } : null;
    },
    fields: (row) => [
      { label: 'Date', value: row.date ? formatDate(row.date) : null },
      { label: 'Role', value: row.role },
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' ') },
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Marked by', value: row.markedBy?.name },
      { label: 'GPS verified', value: row.gpsVerified ? 'Yes' : null },
      { label: 'Remarks', value: row.remarks },
    ],
  },
};

/**
 * The monthly attendance percentage per person.
 *
 * **Three sidebar entries, one aggregate.** "Attendance Reports", "Monthly Report" and
 * "Attendance Analytics" are all `GET /attendance/report/monthly` — the same numbers under three
 * labels.
 */
export const attendanceReportModule = {
  key: 'AttendanceReports',
  title: 'Monthly Report',
  icon: 'chart-box-outline',
  aliases: ['MonthlyReport', 'AttendanceAnalytics'],

  servesRole: (ctx) => ctx.is(...VIEW_ROLES),
  notForRoleLabel: 'Attendance reports are available to teaching and office staff.',

  useList: (ctx, { filter }) => {
    const { month, year } = monthsAgo(filter ?? 0);
    return useGetMonthlyAttendanceReportQuery({ month, year });
  },
  selectRows: (data) => (Array.isArray(data) ? data : data?.report ?? []),
  rowKey: (row) => String(row.userId),

  searchFields: [(row) => row.name, (row) => row.email],
  searchPlaceholder: 'Search by name',

  filter: {
    server: true,
    allLabel: 'This month',
    options: [
      { value: 1, label: 'Last month' },
      { value: 2, label: '2 months ago' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const average = Math.round(rows.reduce((sum, r) => sum + (r.attendancePercentage || 0), 0) / rows.length);
    // Who is actually in trouble is the point of this report, so it gets its own tile rather than
    // being something you have to scroll for.
    const below75 = rows.filter((r) => (r.attendancePercentage || 0) < 75).length;
    return [
      { label: 'Average', value: average, suffix: '%', icon: 'chart-donut' },
      { label: 'People', value: rows.length, icon: 'account-group-outline' },
      {
        label: 'Below 75%',
        value: below75,
        icon: 'alert-outline',
        color: below75 > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => {
    const pct = Math.round(row.attendancePercentage || 0);
    return {
      title: row.name ?? 'Unknown',
      subtitle: row.email,
      meta: `${row.presentDays ?? 0} of ${row.totalDays ?? 0} days`,
      unread: pct < 75,
      badge: {
        label: `${pct}%`,
        color: pct >= 90 ? STATUS_META.present.color : pct >= 75 ? STATUS_META.late.color : STATUS_META.absent.color,
      },
    };
  },

  emptyIcon: 'chart-box-outline',
  emptyLabel: 'Nothing recorded for this month',

  detail: {
    title: 'Monthly Attendance',
    titleFor: (row) => row.name ?? 'Person',
    fields: (row) => [
      { label: 'Attendance', value: `${Math.round(row.attendancePercentage || 0)}%` },
      { label: 'Present days', value: `${row.presentDays ?? 0} of ${row.totalDays ?? 0}` },
      // The per-status counts the percentage was computed from — so a disputed number can be
      // checked rather than just disbelieved.
      ...Object.entries(row.statusBreakdown ?? {}).map(([status, count]) => ({
        label: STATUS_META[status]?.label ?? status,
        value: String(count),
      })),
    ],
  },
};
