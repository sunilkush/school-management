import {
  useGetScholarshipSchemesQuery,
  useGetScholarshipAwardsQuery,
  useDecideScholarshipAwardMutation,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

// scholarship.routes.js — READERS see, APPROVERS decide. The accounts desk sets schemes up and
// raises requests but does not approve its own.
const READERS = ['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Vice Principal', 'Receptionist'];
const APPROVERS = ['Super Admin', 'School Admin', 'Principal'];

const AWARD_TONES = { pending: 'pending', approved: 'active', rejected: 'overdue', revoked: 'inactive' };

function schemeValue(scheme) {
  return scheme.discountType === 'percent'
    ? `${scheme.value}% off`
    : `${formatCurrency(scheme.value || 0)} off`;
}

/**
 * Scholarship schemes — the named concessions a school offers, and how many funded places are left.
 *
 * Two things the backend is careful about that this screen must not blur:
 *
 * 1. **Pending awards count against the cap.** A place promised is a place gone; discovering at
 *    approval time that the last one was taken is how a school over-commits. So `remaining` is
 *    already net of pending, and it is shown as-is rather than recomputed from `approved`.
 * 2. **Percentages sum, they do not compound.** Two 20% schemes are 40% off, not 36%. Nothing here
 *    multiplies discounts together.
 *
 * Read-only: creating a scheme sets a school's giveaway policy for a year, which is not a
 * phone-sized decision.
 */
export const scholarshipSchemesModule = {
  key: 'Scholarships',
  title: 'Scholarships',
  icon: 'school-outline',

  servesRole: (ctx) => ctx.is(...READERS),
  notForRoleLabel: 'Scholarship schemes are managed by the accounts team and school leadership.',

  useList: () => useGetScholarshipSchemesQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code, (row) => row.category],
  searchPlaceholder: 'Search schemes',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'open', label: 'Places left' },
      { value: 'full', label: 'Full' },
    ],
    apply: (row, value) => (value === 'full' ? Boolean(row.usage?.isFull) : !row.usage?.isFull),
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const awarded = rows.reduce((sum, row) => sum + (row.usage?.approved || 0), 0);
    const waiting = rows.reduce((sum, row) => sum + (row.usage?.pending || 0), 0);
    return [
      { label: 'Schemes', value: rows.length, icon: 'school-outline' },
      { label: 'Awarded', value: awarded, icon: 'check-decagram-outline', color: '#22C55E' },
      {
        label: 'Awaiting decision',
        value: waiting,
        icon: 'clock-outline',
        color: waiting > 0 ? '#F59E0B' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: [row.code, row.category].filter(Boolean).join(' · '),
    meta: [
      schemeValue(row),
      row.usage?.maxAwards == null
        ? `${row.usage?.approved ?? 0} awarded · no cap`
        : `${row.usage.remaining} of ${row.usage.maxAwards} places left`,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.usage?.isFull ? { label: 'full', tone: 'overdue' } : null,
  }),

  emptyIcon: 'school-outline',
  emptyLabel: 'No scholarship schemes set up',

  detail: {
    title: 'Scheme',
    titleFor: (row) => row.name,
    badgeFor: (row) => (row.usage?.isFull ? { label: 'full', tone: 'overdue' } : null),
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Category', value: row.category },
      { label: 'Concession', value: schemeValue(row) },
      { label: 'Description', value: row.description },
      { label: 'Eligibility', value: row.eligibility },
      {
        label: 'Funded places',
        value:
          row.usage?.maxAwards == null
            ? 'No cap'
            : `${row.usage.remaining} left of ${row.usage.maxAwards}`,
      },
      // Spelled out so the cap arithmetic is never a mystery: pending is part of what is used up.
      {
        label: 'Places used',
        value: `${row.usage?.approved ?? 0} approved, ${row.usage?.pending ?? 0} awaiting a decision (both count against the cap)`,
      },
      { label: 'Needs approval', value: row.requiresApproval ? 'Yes' : 'No' },
      { label: 'Valid from', value: row.validFrom ? formatDate(row.validFrom) : null },
      { label: 'Valid until', value: row.validUntil ? formatDate(row.validUntil) : null },
    ],
  },
};

/**
 * Individual awards — who has been given what, and what is still waiting on a decision.
 *
 * Approving here is genuinely useful away from a desk: a request sits blocking a family's fee bill
 * until someone says yes or no. Note the backend will not let the accounts desk approve its own
 * requests, and this mirrors that — `APPROVERS` is narrower than `READERS`.
 */
export const scholarshipAwardsModule = {
  key: 'ScholarshipAwards',
  title: 'Scholarship Awards',
  icon: 'hand-heart-outline',

  servesRole: (ctx) => ctx.is(...READERS),
  notForRoleLabel: 'Scholarship awards are managed by the accounts team and school leadership.',

  useList: (ctx, { filter }) => useGetScholarshipAwardsQuery({ status: filter ?? undefined }),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentId?.userId?.name, (row) => row.schemeId?.name, (row) => row.reason],
  searchPlaceholder: 'Search by student or scheme',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'pending', label: 'Awaiting decision' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const pending = rows.filter((row) => row.status === 'pending').length;
    return [
      {
        label: 'Awaiting decision',
        value: pending,
        icon: 'clock-alert-outline',
        color: pending > 0 ? '#F59E0B' : '#94A3B8',
      },
      { label: 'Awards', value: rows.length, icon: 'hand-heart-outline' },
    ];
  },

  row: (row) => ({
    title: row.studentId?.userId?.name ?? 'Student',
    subtitle: row.schemeId?.name,
    meta: [row.requestedAt ? formatDate(row.requestedAt) : null, row.reason].filter(Boolean).join(' · '),
    unread: row.status === 'pending',
    badge: { label: row.status, tone: AWARD_TONES[row.status] },
  }),

  emptyIcon: 'hand-heart-outline',
  emptyLabel: 'No scholarship awards yet',

  detail: {
    title: 'Award',
    titleFor: (row) => row.studentId?.userId?.name ?? 'Award',
    badgeFor: (row) => ({ label: row.status, tone: AWARD_TONES[row.status] }),
    fields: (row) => [
      { label: 'Scheme', value: row.schemeId?.name },
      { label: 'Why', value: row.reason },
      { label: 'Requested on', value: row.requestedAt ? formatDate(row.requestedAt) : null },
      { label: 'Decided by', value: row.approvedBy?.name },
      { label: 'Decided on', value: row.approvedAt ? formatDate(row.approvedAt) : null },
      { label: 'Decision note', value: row.decisionNote },
      { label: 'Revoked on', value: row.revokedAt ? formatDate(row.revokedAt) : null },
    ],
    actions: [
      {
        key: 'approve',
        label: 'Approve',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => ctx.is(...APPROVERS) && row?.status === 'pending',
        useMutation: useDecideScholarshipAwardMutation,
        title: 'Approve Award',
        submitLabel: 'Approve',
        fields: [{ name: 'note', label: 'Note (optional)', type: 'textarea' }],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          decision: 'approved',
          note: values.note?.trim() || '',
        }),
      },
      {
        key: 'reject',
        label: 'Reject',
        icon: 'close',
        tone: 'danger',
        allow: (ctx, row) => ctx.is(...APPROVERS) && row?.status === 'pending',
        useMutation: useDecideScholarshipAwardMutation,
        title: 'Reject Award',
        submitLabel: 'Reject',
        // A rejection frees a funded place and the family will ask why — the reason is required.
        fields: [{ name: 'note', label: 'Reason for rejecting', type: 'textarea', required: true }],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          decision: 'rejected',
          note: values.note.trim(),
        }),
      },
    ],
  },
};
