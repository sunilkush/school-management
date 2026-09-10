import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useCreateNotificationMutation,
} from '../../store/api/apiSlice';
import { formatDate, timeAgo } from '../../utils/format';

// backend/src/controllers/notification.controllers.js CREATE_ALLOWED_ROLES — broadcast is gated by
// role NAME server-side, not by the permissions array, so gating the compose FAB on `can()` would
// hide it from roles the backend actually allows.
const BROADCAST_ROLES = [
  'Super Admin',
  'School Admin',
  'Principal',
  'Vice Principal',
  'Exam Coordinator',
  'Receptionist',
  'IT Support',
];

const LEVEL_TONES = { urgent: 'overdue', high: 'pending', normal: 'active', low: 'inactive' };

/**
 * Pilot module #1 — the simplest shape: a read-only list with a per-record detail and one
 * side effect (opening a notification marks it read).
 */
export const notificationsModule = {
  key: 'Notifications',
  title: 'Notifications',
  icon: 'bell-outline',

  // GET /notifications returns the visible rows as a bare array, already carrying the caller's own
  // `isRead` flag (mapWithReadState). There is no server-side pagination or unread filter.
  useList: () => useGetNotificationsQuery(),
  selectRows: (data) => data ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.message],
  searchPlaceholder: 'Search notifications',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'unread', label: 'Unread' },
      { value: 'urgent', label: 'Urgent' },
    ],
    apply: (row, value) => (value === 'unread' ? !row.isRead : row.level === 'urgent'),
  },

  row: (row) => ({
    title: row.title,
    subtitle: row.message,
    meta: timeAgo(row.createdAt),
    unread: !row.isRead,
    badge: row.level && row.level !== 'normal' ? { label: row.level, tone: LEVEL_TONES[row.level] } : null,
  }),

  emptyIcon: 'bell-off-outline',
  emptyLabel: 'No notifications yet',

  detail: {
    title: 'Notification',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.level ? { label: row.level, tone: LEVEL_TONES[row.level] } : null),
    fields: (row) => [
      { label: 'Message', value: row.message },
      { label: 'Sent', value: formatDate(row.createdAt) },
      { label: 'Priority', value: row.level ?? 'normal' },
    ],
    // Opening one is what marks it read — there is no separate "mark as read" button to forget.
    useOnOpen: useMarkNotificationReadMutation,
    onOpenArg: (row) => (row.isRead ? null : row._id),
  },

  create: {
    title: 'New Broadcast',
    label: 'Compose',
    icon: 'bullhorn-outline',
    submitLabel: 'Send Notification',
    allow: (ctx) => ctx.is(...BROADCAST_ROLES),
    useMutation: useCreateNotificationMutation,
    intro: 'Everyone this reaches is decided server-side from the target roles you pick.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      {
        name: 'level',
        label: 'Priority',
        type: 'select',
        initial: 'normal',
        required: true,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
      {
        name: 'targetRoles',
        label: 'Send to',
        type: 'select',
        required: true,
        options: [
          { value: 'Student', label: 'Students' },
          { value: 'Parent', label: 'Parents' },
          { value: 'Teacher', label: 'Teachers' },
          { value: 'Staff', label: 'Staff' },
        ],
      },
    ],
    buildPayload: (values) => ({
      title: values.title.trim(),
      message: values.message.trim(),
      level: values.level,
      targetRoles: [values.targetRoles],
      channels: { inApp: true },
    }),
  },
};
