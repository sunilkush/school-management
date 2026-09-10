import { useGetMyAttendanceQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';
import { STATUS_META, summarizeAttendance } from '../../utils/attendance';

/** `{ month, year }` for N months back from today, in the 1-12 form the endpoint expects. */
function monthsAgo(offset) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/**
 * Attendance, as the person it belongs to sees it — a student's own record, or a parent's
 * selected child's.
 *
 * **Marking** attendance is not here. That is a teacher standing in front of a class tapping
 * through a roster, which is a bespoke grid (Phase 3, still to build), not a list of records.
 * This module is the read side only, and says so rather than showing a teacher an empty list.
 */
export const attendanceModule = {
  key: 'Attendance',
  title: 'Attendance',
  icon: 'calendar-check-outline',

  // `/attendance/my` would technically answer for a School Admin or Teacher too — with THEIR OWN
  // attendance record. But "Attendance" in an admin's or teacher's nav means the class roster and
  // the school-wide table, so showing them their personal record under that label would be
  // quietly wrong rather than merely empty.
  servesRole: (ctx) => ctx.is('Student', 'Parent'),
  notForRoleLabel: 'This is a student’s own attendance record. Marking a class and the school-wide attendance table are separate screens, still to come in this phase.',

  // A Parent MUST name a child here — `/attendance/my` 400s without a childId for that role
  // rather than defaulting to anything. `userId`, not `_id`: the backend verifies ownership with
  // `Student.findOne({ userId: childId })`.
  scope: {
    activeFor: (ctx) => ctx.is('Parent'),
    useOptions: (ctx) => useGetMyChildrenQuery(undefined, { skip: !ctx.is('Parent') }),
    selectOptions: (data) => (data ?? []).map((child) => ({ value: child.userId, label: child.name })),
    emptyLabel: 'No children are linked to your account yet',
  },

  useList: (ctx, { filter, scope }) => {
    const { month, year } = monthsAgo(filter ?? 0);
    const isParent = ctx.is('Parent');
    return useGetMyAttendanceQuery(
      { month, year, childId: isParent ? scope : undefined },
      // Asking for a parent's attendance before a child is chosen is a guaranteed 400.
      { skip: isParent && !scope }
    );
  },
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  // Server-side: the endpoint filters by month/year, so this picks the month rather than
  // narrowing rows already fetched. `null` (the "All" chip) means the current month.
  filter: {
    server: true,
    allLabel: 'This month',
    options: [
      { value: 1, label: 'Last month' },
      { value: 2, label: '2 months ago' },
    ],
  },

  // Percentage counts a half day as half a day present — the same arithmetic the web portal's
  // attendance report uses, so the two never disagree in front of a parent.
  summary: (rows) => {
    const { counts, total, percentage } = summarizeAttendance(rows);
    if (total === 0) return [];
    return [
      { label: 'Attendance', value: percentage, suffix: '%', icon: 'chart-donut', color: STATUS_META.present.color },
      { label: 'Present', value: counts.present, icon: STATUS_META.present.icon, color: STATUS_META.present.color },
      { label: 'Absent', value: counts.absent, icon: STATUS_META.absent.icon, color: STATUS_META.absent.color },
      { label: 'Late', value: counts.late, icon: STATUS_META.late.icon, color: STATUS_META.late.color },
    ];
  },

  row: (row) => {
    const meta = STATUS_META[row.status];
    return {
      title: formatDate(row.date, { weekday: 'short', day: 'numeric', month: 'short' }),
      subtitle: row.remarks || null,
      meta: row.subjectId?.name ?? null,
      // A tone name would flatten five statuses into three; attendance has its own long-standing
      // colour vocabulary shared with the web app, so pass the colour through directly.
      badge: meta ? { label: meta.label, color: meta.color } : null,
    };
  },

  emptyIcon: 'calendar-blank-outline',
  emptyLabel: 'No attendance recorded for this month',
};
