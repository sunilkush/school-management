import {
  useGetSelfAttendanceHistoryQuery,
  useGetMyTasksQuery,
  useUpdateMyTaskStatusMutation,
  useGetSupportTicketsQuery,
  useCreateSupportTicketMutation,
} from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';
import { STATUS_META, summarizeAttendance } from '../../utils/attendance';

/**
 * The three destinations nearly every role has, and which sat on the placeholder until Phase 9.
 * Between them they account for ~50 entries across the 23 role menus.
 */

/**
 * My own attendance history.
 *
 * **Not the same thing as the `Attendance` module.** That one is the *family* view — a student's
 * record, opened by a parent or the student. This is a staff member's own punch record from
 * `/attendance/self/history`. Two keys, two endpoints, two audiences; mixing them up would show a
 * teacher their child's attendance under their own name.
 */
export const myAttendanceModule = {
  key: 'MyAttendance',
  title: 'My Attendance',
  icon: 'calendar-account-outline',
  // The web sidebar calls the same screen three different things.
  aliases: ['MyMonthlyReport', 'ShiftAttendance'],

  // The endpoint takes ?month=YYYY-MM. `null` (the "This month" chip) means the current month.
  useList: (ctx, { filter }) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (filter ?? 0));
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return useGetSelfAttendanceHistoryQuery({ month });
  },
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  filter: {
    server: true,
    allLabel: 'This month',
    options: [
      { value: 1, label: 'Last month' },
      { value: 2, label: '2 months ago' },
    ],
  },

  // Same arithmetic as the family view — a half day counts as half a day present — so a teacher
  // checking their own percentage never sees a different number from the one the office sees.
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
      subtitle: row.checkInAt
        ? `In ${formatTime(row.checkInAt)}${row.checkOutAt ? ` · Out ${formatTime(row.checkOutAt)}` : ''}`
        : null,
      meta: row.gpsVerified ? 'GPS verified' : null,
      badge: meta ? { label: meta.label, color: meta.color } : null,
    };
  },

  emptyIcon: 'calendar-blank-outline',
  emptyLabel: 'Nothing recorded for this month',

  detail: {
    title: 'Day',
    titleFor: (row) => formatDate(row.date),
    badgeFor: (row) => {
      const meta = STATUS_META[row.status];
      return meta ? { label: meta.label, color: meta.color } : null;
    },
    fields: (row) => [
      { label: 'Checked in', value: row.checkInAt ? formatTime(row.checkInAt) : null },
      { label: 'Checked out', value: row.checkOutAt ? formatTime(row.checkOutAt) : null },
      { label: 'GPS verified', value: row.gpsVerified ? 'Yes' : 'No' },
      { label: 'Marked by', value: row.source === 'self' ? 'You' : row.source },
      { label: 'Remarks', value: row.remarks },
    ],
  },
};

const TASK_PRIORITY_TONES = { low: 'inactive', medium: 'partial', high: 'pending', urgent: 'overdue' };
const TASK_STATUS_TONES = { todo: 'pending', in_progress: 'partial', done: 'active', cancelled: 'inactive' };

/** Tasks assigned to me. */
export const myTasksModule = {
  key: 'MyTasks',
  title: 'My Tasks',
  icon: 'checkbox-marked-outline',
  aliases: ['TaskManagement'],

  useList: (ctx, { filter }) => useGetMyTasksQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => (Array.isArray(data) ? data : data?.tasks ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.description],
  searchPlaceholder: 'Search tasks',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'todo', label: 'To do' },
      { value: 'in_progress', label: 'Doing' },
      { value: 'done', label: 'Done' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const open = rows.filter((row) => row.status !== 'done' && row.status !== 'cancelled').length;
    const overdue = rows.filter(
      (row) => row.dueDate && new Date(row.dueDate).getTime() < Date.now() && row.status !== 'done'
    ).length;
    return [
      { label: 'Open', value: open, icon: 'checkbox-blank-outline', color: open > 0 ? '#2563EB' : '#94A3B8' },
      { label: 'Overdue', value: overdue, icon: 'clock-alert-outline', color: overdue > 0 ? '#EF4444' : '#94A3B8' },
    ];
  },

  row: (row) => ({
    title: row.title,
    subtitle: row.description,
    meta: [
      row.dueDate ? `Due ${formatDate(row.dueDate)}` : null,
      row.assignedBy?.name ? `from ${row.assignedBy.name}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: row.status === 'todo',
    badge: row.priority ? { label: row.priority, tone: TASK_PRIORITY_TONES[row.priority] } : null,
  }),

  emptyIcon: 'checkbox-marked-circle-outline',
  emptyLabel: 'No tasks assigned to you',

  detail: {
    title: 'Task',
    titleFor: (row) => row.title,
    badgeFor: (row) => ({ label: row.status?.replace('_', ' '), tone: TASK_STATUS_TONES[row.status] }),
    fields: (row) => [
      { label: 'Details', value: row.description },
      { label: 'Priority', value: row.priority },
      { label: 'Due', value: row.dueDate ? formatDate(row.dueDate) : null },
      { label: 'Assigned by', value: row.assignedBy?.name },
      { label: 'Also assigned to', value: row.assignedTo?.map((u) => u.name).filter(Boolean).join(', ') },
      { label: 'Completed', value: row.completedAt ? formatDate(row.completedAt) : null },
    ],
    actions: [
      {
        key: 'start',
        label: 'Mark as in progress',
        icon: 'play',
        allow: (ctx, row) => row?.status === 'todo',
        useMutation: useUpdateMyTaskStatusMutation,
        // `myStatus` sets THIS assignee's own status. A task can be assigned to several people and
        // each tracks their own progress, so this never closes the task for everybody else.
        buildArg: (row) => ({ id: row._id, myStatus: 'in_progress' }),
      },
      {
        key: 'done',
        label: 'Mark as done',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => row?.status !== 'done' && row?.status !== 'cancelled',
        useMutation: useUpdateMyTaskStatusMutation,
        buildArg: (row) => ({ id: row._id, myStatus: 'done' }),
      },
    ],
  },
};

const TICKET_TONES = { Open: 'pending', 'In Progress': 'partial', Resolved: 'active', Closed: 'inactive' };

/** Raising and following a support ticket. */
export const supportTicketsModule = {
  key: 'SupportTickets',
  title: 'Support',
  icon: 'lifebuoy',
  // "Contact Support" is the same queue under the label other roles' sidebars use.
  aliases: ['ContactSupport'],

  useList: (ctx, { filter }) => useGetSupportTicketsQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => (Array.isArray(data) ? data : data?.tickets ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.description, (row) => row.category],
  searchPlaceholder: 'Search tickets',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'In Progress', label: 'In progress' },
      { value: 'Resolved', label: 'Resolved' },
    ],
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.category, row.priority].filter(Boolean).join(' · '),
    meta: row.createdAt ? formatDate(row.createdAt) : null,
    unread: row.status === 'Open',
    badge: row.status ? { label: row.status.toLowerCase(), tone: TICKET_TONES[row.status] } : null,
  }),

  emptyIcon: 'lifebuoy',
  emptyLabel: 'You have raised no support tickets',

  detail: {
    title: 'Ticket',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status.toLowerCase(), tone: TICKET_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Category', value: row.category },
      { label: 'Priority', value: row.priority },
      { label: 'What is wrong', value: row.description },
      { label: 'Raised', value: row.createdAt ? formatDate(row.createdAt) : null },
      { label: 'Assigned to', value: row.assignedTo?.name },
      { label: 'Resolved by', value: row.resolvedBy?.name },
      { label: 'Resolved on', value: row.resolvedAt ? formatDate(row.resolvedAt) : null },
      // Replies from whoever is handling it — the reason a reporter opens the ticket again.
      {
        label: 'Updates',
        value: row.updates?.length
          ? row.updates.map((u) => `• ${u.message ?? u.note ?? ''}`.trim()).join('\n')
          : null,
      },
    ],
    // Closing a ticket is the support desk's call, not the reporter's, so no action here.
  },

  create: {
    title: 'Raise a Ticket',
    label: 'Raise ticket',
    submitLabel: 'Send',
    // Anyone signed in can ask for help.
    allow: () => true,
    useMutation: useCreateSupportTicketMutation,
    fields: [
      { name: 'title', label: 'What is the problem', required: true },
      { name: 'description', label: 'Describe it', type: 'textarea', required: true },
      {
        name: 'category',
        label: 'Area',
        type: 'select',
        initial: 'General',
        required: true,
        options: ['General', 'Technical', 'Academic', 'Finance', 'Transport', 'Hostel', 'Library', 'Other'].map(
          (value) => ({ value, label: value })
        ),
      },
      {
        name: 'priority',
        label: 'How urgent',
        type: 'select',
        initial: 'Medium',
        required: true,
        options: ['Low', 'Medium', 'High', 'Urgent'].map((value) => ({ value, label: value })),
      },
    ],
    buildPayload: (values) => ({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      priority: values.priority,
    }),
  },
};
