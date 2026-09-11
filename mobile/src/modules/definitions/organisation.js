import {
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  useGetFaqsQuery,
  useGetAlumniQuery,
  useGetCounselingSessionsQuery,
  useGetEmergencyAlertsQuery,
} from '../../store/api/apiSlice';
import { formatDate, timeAgo } from '../../utils/format';

const ADMIN_ONLY = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];
const COUNSELLING_ROLES = [...ADMIN_ONLY, 'Counselor'];

/** Departments the school is organised into. */
export const departmentsModule = {
  key: 'Departments',
  title: 'Departments',
  icon: 'office-building-outline',

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY),
  notForRoleLabel: 'Departments are maintained by the school office.',

  useList: () => useGetDepartmentsQuery({}),
  selectRows: (data) => data?.departments ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code, (row) => row.head?.name],
  searchPlaceholder: 'Search departments',

  row: (row) => ({
    title: row.name,
    subtitle: row.code,
    meta: row.head?.name ? `Head: ${row.head.name}` : null,
    badge: row.status && row.status !== 'active' ? { label: row.status, tone: 'inactive' } : null,
  }),

  emptyIcon: 'office-building-outline',
  emptyLabel: 'No departments set up',

  detail: {
    title: 'Department',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Head of department', value: row.head?.name },
      { label: 'Description', value: row.description },
      { label: 'Status', value: row.status },
    ],
  },
};

/** Job titles, and the department each sits in. */
export const designationsModule = {
  key: 'Designations',
  title: 'Designations',
  icon: 'badge-account-outline',

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY),
  notForRoleLabel: 'Designations are maintained by the school office.',

  useList: () => useGetDesignationsQuery({}),
  selectRows: (data) => data?.designations ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.departmentId?.name],
  searchPlaceholder: 'Search designations',

  row: (row) => ({
    title: row.title,
    subtitle: row.departmentId?.name,
    meta: row.level != null ? `Level ${row.level}` : null,
    badge: row.status && row.status !== 'active' ? { label: row.status, tone: 'inactive' } : null,
  }),

  emptyIcon: 'badge-account-outline',
  emptyLabel: 'No designations set up',

  detail: {
    title: 'Designation',
    titleFor: (row) => row.title,
    fields: (row) => [
      { label: 'Department', value: row.departmentId?.name },
      { label: 'Level', value: row.level != null ? String(row.level) : null },
      { label: 'Description', value: row.description },
    ],
  },
};

/** Frequently asked questions — the one module here that needs no role gate. */
export const faqsModule = {
  key: 'Faqs',
  title: 'FAQs',
  icon: 'frequently-asked-questions',

  useList: () => useGetFaqsQuery({}),
  selectRows: (data) => data?.faqs ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.question, (row) => row.answer, (row) => row.category],
  searchPlaceholder: 'Search questions',

  row: (row) => ({
    title: row.question,
    subtitle: row.answer,
    meta: row.category,
  }),

  emptyIcon: 'comment-question-outline',
  emptyLabel: 'No questions answered yet',

  detail: {
    title: 'FAQ',
    titleFor: (row) => row.question,
    fields: (row) => [
      { label: 'Answer', value: row.answer },
      { label: 'Category', value: row.category },
    ],
  },
};

/** Former students, and where they went. */
export const alumniModule = {
  key: 'Alumni',
  title: 'Alumni',
  icon: 'account-school-outline',

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY),
  notForRoleLabel: 'The alumni register is kept by the school office.',

  useList: () => useGetAlumniQuery({ limit: 100 }),
  selectRows: (data) => data?.alumni ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [
    (row) => row.studentName ?? row.name,
    (row) => row.currentInstitution,
    (row) => row.currentOccupation,
  ],
  searchPlaceholder: 'Search alumni',

  row: (row) => ({
    title: row.studentName ?? row.name ?? 'Alumnus',
    subtitle: [row.currentOccupation, row.currentInstitution].filter(Boolean).join(' · '),
    meta: row.graduationYear ? `Class of ${row.graduationYear}` : null,
  }),

  emptyIcon: 'account-school-outline',
  emptyLabel: 'No alumni recorded yet',

  detail: {
    title: 'Alumnus',
    titleFor: (row) => row.studentName ?? row.name ?? 'Alumnus',
    fields: (row) => [
      { label: 'Graduated', value: row.graduationYear ? String(row.graduationYear) : null },
      { label: 'Last class', value: row.lastClass ?? row.className },
      { label: 'Now studying / working at', value: row.currentInstitution },
      { label: 'Occupation', value: row.currentOccupation },
      { label: 'Email', value: row.email },
      { label: 'Phone', value: row.phone },
    ],
  },
};

const SESSION_TONES = { Scheduled: 'pending', Completed: 'active', Cancelled: 'overdue' };

/**
 * Counselling sessions.
 *
 * Read-only here, and deliberately so: the notes on a counselling record are the most sensitive
 * text in the whole system. Writing them belongs somewhere private and considered, not on a phone
 * that might be handed to someone.
 */
export const counsellingModule = {
  key: 'CounselingSessions',
  title: 'Counselling',
  icon: 'account-heart-outline',

  servesRole: (ctx) => ctx.is(...COUNSELLING_ROLES),
  notForRoleLabel: 'Counselling records are kept by the counsellor and school leadership.',

  useList: (ctx, { filter }) => useGetCounselingSessionsQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.sessions ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentName ?? row.studentId?.userId?.name, (row) => row.reason ?? row.topic],
  searchPlaceholder: 'Search by student',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'Scheduled', label: 'Scheduled' },
      { value: 'Completed', label: 'Completed' },
    ],
  },

  row: (row) => ({
    title: row.studentName ?? row.studentId?.userId?.name ?? 'Student',
    subtitle: row.reason ?? row.topic,
    meta: row.sessionDate ?? row.date ? formatDate(row.sessionDate ?? row.date) : null,
    unread: row.status === 'Scheduled',
    badge: row.status ? { label: row.status.toLowerCase(), tone: SESSION_TONES[row.status] } : null,
  }),

  emptyIcon: 'account-heart-outline',
  emptyLabel: 'No counselling sessions recorded',
  footerNote: 'Session notes are written on the web portal.',

  detail: {
    title: 'Session',
    titleFor: (row) => row.studentName ?? row.studentId?.userId?.name ?? 'Session',
    badgeFor: (row) => (row.status ? { label: row.status.toLowerCase(), tone: SESSION_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Date', value: row.sessionDate ?? row.date ? formatDate(row.sessionDate ?? row.date) : null },
      { label: 'Counsellor', value: row.counselorId?.name ?? row.counsellor?.name },
      { label: 'Reason', value: row.reason ?? row.topic },
      { label: 'Follow up on', value: row.followUpDate ? formatDate(row.followUpDate) : null },
    ],
  },
};

/** Emergency alerts that have been raised. */
export const emergencyAlertsModule = {
  key: 'EmergencyAlerts',
  title: 'Emergency Alerts',
  icon: 'alert-octagon-outline',

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY, 'Security', 'Medical Officer'),
  notForRoleLabel: 'Emergency alerts are handled by school leadership, security and the medical officer.',

  useList: () => useGetEmergencyAlertsQuery({ limit: 50 }),
  selectRows: (data) => data?.alerts ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.message, (row) => row.type],
  searchPlaceholder: 'Search alerts',

  row: (row) => ({
    title: row.title ?? row.type ?? 'Alert',
    subtitle: row.message,
    meta: row.createdAt ? timeAgo(row.createdAt) : null,
    unread: row.status === 'active' || row.isActive,
    badge:
      row.status === 'active' || row.isActive
        ? { label: 'active', tone: 'overdue' }
        : { label: 'resolved', tone: 'inactive' },
  }),

  emptyIcon: 'shield-check-outline',
  emptyLabel: 'No emergency alerts — which is the good outcome',
  // Raising one notifies the whole school at once. That is not a phone tap away, even for the
  // people allowed to do it.
  footerNote: 'Raising an alert notifies everyone at once, so it is done from the web portal.',

  detail: {
    title: 'Alert',
    titleFor: (row) => row.title ?? row.type ?? 'Alert',
    fields: (row) => [
      { label: 'Type', value: row.type },
      { label: 'Message', value: row.message },
      { label: 'Raised by', value: row.raisedBy?.name ?? row.createdBy?.name },
      { label: 'Raised', value: row.createdAt ? formatDate(row.createdAt) : null },
      { label: 'Resolved', value: row.resolvedAt ? formatDate(row.resolvedAt) : null },
    ],
  },
};
