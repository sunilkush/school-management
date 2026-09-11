import {
  useGetAllSchoolsQuery,
  useGetSubscriptionPlansQuery,
  useGetAuditLogsQuery,
  useGetComplianceReadinessQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';

const COMPLIANCE_READ = ['Super Admin', 'School Admin', 'Receptionist', 'Principal', 'Vice Principal'];

/**
 * Phase 7 — the platform tier. This is the tier that killed the previous mobile app, which cloned
 * Super Admin's whole desktop sidebar onto a phone: backup schedules, restore jobs, the permission
 * matrix, global config. See PLAN.md for what is deliberately NOT here and why.
 *
 * What is here is the part a platform owner genuinely asks away from a desk: which schools are on
 * the system, what they are paying for, and who did what.
 */

/** Every school on the platform. */
export const schoolsModule = {
  key: 'Schools',
  title: 'Schools',
  icon: 'domain',

  servesRole: (ctx) => ctx.is('Super Admin'),
  notForRoleLabel: 'The platform school list is for Super Admin.',

  useList: () => useGetAllSchoolsQuery({}),
  selectRows: (data) => data?.schools ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.email, (row) => row.phone],
  searchPlaceholder: 'Search schools',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    apply: (row, value) => (value === 'active' ? row.isActive !== false : row.isActive === false),
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const active = rows.filter((row) => row.isActive !== false).length;
    return [
      { label: 'Schools', value: rows.length, icon: 'domain' },
      { label: 'Active', value: active, icon: 'check-circle-outline', color: '#22C55E' },
      {
        label: 'Inactive',
        value: rows.length - active,
        icon: 'close-circle-outline',
        color: rows.length - active > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: row.subscriptionPlan ? `Plan: ${row.subscriptionPlan}` : 'No subscription',
    meta: [row.email, row.phone].filter(Boolean).join(' · '),
    badge: {
      label: row.isActive === false ? 'inactive' : 'active',
      tone: row.isActive === false ? 'overdue' : 'active',
    },
  }),

  emptyIcon: 'domain',
  emptyLabel: 'No schools on the platform yet',
  // Suspending or cancelling a school's subscription cuts off every user in it at once. That is
  // not a thing to have one tap away on a phone — the web portal keeps it, with its confirmations.
  footerNote: 'Changing a school’s plan, suspending or cancelling it is done on the web portal.',

  detail: {
    title: 'School',
    titleFor: (row) => row.name,
    badgeFor: (row) => ({
      label: row.isActive === false ? 'inactive' : 'active',
      tone: row.isActive === false ? 'overdue' : 'active',
    }),
    fields: (row) => [
      { label: 'Subscription plan', value: row.subscriptionPlan },
      { label: 'Email', value: row.email },
      { label: 'Phone', value: row.phone },
      { label: 'Website', value: row.website },
      { label: 'Address', value: row.address },
      { label: 'Boards', value: row.boards?.length ? row.boards.map((b) => b.name).join(', ') : null },
      { label: 'On the platform since', value: row.createdAt ? formatDate(row.createdAt) : null },
    ],
  },
};

/** What the platform sells. Read-only — pricing is a business decision, not a phone tap. */
export const subscriptionPlansModule = {
  key: 'SubscriptionPlans',
  title: 'Subscription Plans',
  icon: 'card-text-outline',

  servesRole: (ctx) => ctx.is('Super Admin'),
  notForRoleLabel: 'Subscription plans are managed by Super Admin.',

  useList: () => useGetSubscriptionPlansQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.plans ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name],
  searchPlaceholder: 'Search plans',

  row: (row) => ({
    title: row.name,
    subtitle: row.billingCycle ?? row.duration,
    meta: row.price != null ? formatCurrency(row.price) : null,
    badge: row.isActive === false ? { label: 'retired', tone: 'inactive' } : null,
  }),

  emptyIcon: 'card-text-outline',
  emptyLabel: 'No subscription plans defined',
  footerNote: 'Creating and pricing plans is done on the web portal.',

  detail: {
    title: 'Plan',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Price', value: row.price != null ? formatCurrency(row.price) : null },
      { label: 'Billing cycle', value: row.billingCycle ?? row.duration },
      { label: 'Student limit', value: row.maxStudents != null ? String(row.maxStudents) : null },
      { label: 'Staff limit', value: row.maxStaff != null ? String(row.maxStaff) : null },
      { label: 'Description', value: row.description },
      { label: 'Modules', value: row.modules?.length ? row.modules.join(', ') : null },
    ],
  },
};

const AUDIT_TONES = { success: 'active', failure: 'overdue', failed: 'overdue', error: 'overdue' };

/**
 * Who did what. Genuinely useful on a phone: when something looks wrong, the first question is
 * always "who touched it and when", and that question does not wait for you to reach a desk.
 */
export const auditLogsModule = {
  key: 'AuditLogs',
  title: 'Audit Log',
  icon: 'history',
  aliases: ['ActivityLogs'],

  servesRole: (ctx) => ctx.is('Super Admin', 'School Admin'),
  notForRoleLabel: 'The audit log is available to Super Admin and School Admin.',

  useList: () => useGetAuditLogsQuery({ limit: 100 }),
  // GET /audit-logs answers with a bare `{ success, data, pagination }` rather than the codebase's
  // usual ApiResponse wrapper, so `data` is already the array by the time axiosBaseQuery unwraps it.
  selectRows: (data) => (Array.isArray(data) ? data : data?.logs ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.actorName, (row) => row.action, (row) => row.module, (row) => row.actorEmail],
  searchPlaceholder: 'Search by person, action or module',

  summary: (rows) => {
    if (rows.length === 0) return [];
    const failed = rows.filter((row) => row.status && row.status !== 'success').length;
    return [
      { label: 'Entries', value: rows.length, icon: 'history' },
      {
        label: 'Failed',
        value: failed,
        icon: 'alert-circle-outline',
        color: failed > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: `${row.actorName ?? 'Someone'} · ${row.action}`,
    subtitle: [row.module, row.entityType].filter(Boolean).join(' · '),
    meta: row.createdAt ? timeAgo(row.createdAt) : null,
    unread: Boolean(row.status && row.status !== 'success'),
    badge: row.status ? { label: row.status, tone: AUDIT_TONES[row.status] ?? 'inactive' } : null,
  }),

  emptyIcon: 'history',
  emptyLabel: 'Nothing in the audit log',

  detail: {
    title: 'Audit Entry',
    titleFor: (row) => row.action,
    badgeFor: (row) => (row.status ? { label: row.status, tone: AUDIT_TONES[row.status] ?? 'inactive' } : null),
    fields: (row) => [
      { label: 'Who', value: [row.actorName, row.actorEmail].filter(Boolean).join(' · ') },
      { label: 'Action', value: row.action },
      { label: 'Module', value: row.module },
      { label: 'Record', value: [row.entityType, row.entityId].filter(Boolean).join(' · ') },
      { label: 'When', value: row.createdAt ? formatDate(row.createdAt) : null },
      { label: 'IP address', value: row.ipAddress },
      { label: 'Device', value: row.userAgent },
    ],
  },
};

/**
 * Government compliance readiness — which student records are not complete enough to file.
 *
 * Two things this is **not**, and the wording here is deliberate:
 *
 * - It is **not a UDISE+ integration**. No such API exists. This is the school's own record-keeping
 *   against what UDISE+, PEN and APAAR ask for; nothing is submitted anywhere from here.
 * - It does **not hold full Aadhaar numbers**. The backend never stores one, so there is nothing of
 *   that kind to display.
 *
 * The list is the students who are *not* ready, because a list of the ones who are is not work.
 */
export const complianceModule = {
  key: 'Compliance',
  title: 'Compliance',
  icon: 'shield-check-outline',

  servesRole: (ctx) => ctx.is(...COMPLIANCE_READ),
  notForRoleLabel: 'Compliance records are kept by the school office and leadership.',

  useList: () => useGetComplianceReadinessQuery({}),
  // The report lists only incomplete students — capped server-side at 500.
  selectRows: (data) => data?.students ?? [],
  rowKey: (row) => String(row.studentId ?? row._id),

  searchFields: [(row) => row.name ?? row.studentName, (row) => row.className],
  searchPlaceholder: 'Search students',

  row: (row) => ({
    title: row.name ?? row.studentName ?? 'Student',
    subtitle: [row.className, row.sectionName].filter(Boolean).join(' '),
    // Naming the actual gaps is the whole point — "incomplete" alone tells the office nothing.
    meta: row.missing?.length ? `Missing: ${row.missing.map((m) => m.label ?? m.key).join(', ')}` : null,
    unread: true,
    badge: { label: 'not ready', tone: 'pending' },
  }),

  emptyIcon: 'shield-check-outline',
  emptyLabel: 'Every student record is complete',
  footerNote:
    'This is the school’s own record-keeping for UDISE+, PEN and APAAR — nothing is submitted to any government system from here.',

  detail: {
    title: 'Student',
    titleFor: (row) => row.name ?? row.studentName ?? 'Student',
    fields: (row) => [
      { label: 'Class', value: [row.className, row.sectionName].filter(Boolean).join(' ') },
      {
        label: 'Missing before this can be filed',
        value: row.missing?.length ? row.missing.map((m) => `• ${m.label ?? m.key}`).join('\n') : null,
      },
      { label: 'PEN', value: row.pen },
      { label: 'APAAR ID', value: row.apaarId },
    ],
  },
};
