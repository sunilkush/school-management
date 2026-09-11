import {
  useGetEmployeesQuery,
  useGetJobPostingsQuery,
  useGetMyAppraisalQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

const HR_READ = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Subject Coordinator', 'Exam Coordinator'];
const DIRECTORY_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];

const POSTING_TONES = { draft: 'inactive', open: 'active', closed: 'overdue', on_hold: 'pending' };

/**
 * The staff directory — who works here, in what role, and how to reach them.
 *
 * Read-only. Creating an employee is a two-call flow (a user account, then an employee record)
 * with a role assignment and a salary structure behind it; the web portal does that properly.
 */
export const staffModule = {
  key: 'Teachers',
  title: 'Staff',
  icon: 'account-tie-outline',
  // The same directory under the labels other roles' sidebars use for it.
  aliases: ['Users', 'Members'],

  servesRole: (ctx) => ctx.is(...DIRECTORY_ROLES),
  notForRoleLabel: 'The staff directory is kept by the school office.',

  useList: () => useGetEmployeesQuery({ limit: 100 }),
  // Employees come back as a bare array; the pagination rides in the response meta, not the data.
  selectRows: (data) => (Array.isArray(data) ? data : data?.employees ?? []),
  rowKey: (row) => row._id,

  searchFields: [
    (row) => row.userId?.name,
    (row) => row.userId?.email,
    (row) => row.userId?.roleId?.name,
    (row) => row.employeeCode,
  ],
  searchPlaceholder: 'Search staff by name or role',

  row: (row) => ({
    title: row.userId?.name ?? 'Staff member',
    subtitle: row.userId?.roleId?.name,
    meta: [row.employeeCode, row.userId?.email].filter(Boolean).join(' · '),
    badge: row.status ? { label: String(row.status).toLowerCase(), tone: row.status === 'Active' ? 'active' : 'inactive' } : null,
  }),

  emptyIcon: 'account-off-outline',
  emptyLabel: 'No staff records yet',

  detail: {
    title: 'Staff',
    titleFor: (row) => row.userId?.name ?? 'Staff member',
    fields: (row) => [
      { label: 'Role', value: row.userId?.roleId?.name },
      { label: 'Employee code', value: row.employeeCode },
      { label: 'Email', value: row.userId?.email },
      { label: 'Phone', value: row.phone ?? row.contactNumber },
      { label: 'Joined', value: row.joiningDate ? formatDate(row.joiningDate) : null },
      { label: 'Academic year', value: row.academicYearId?.name },
    ],
  },
};

/**
 * Open vacancies and how each one is filling up.
 *
 * Read-only, and strictly the *internal* recruitment view: coordinators sit on interview panels, so
 * they can see the pipeline without being able to open or close a posting. Moving a candidate
 * between stages is panel work with interview notes attached and stays on the web portal.
 */
export const recruitmentModule = {
  key: 'Recruitment',
  title: 'Recruitment',
  icon: 'briefcase-search-outline',

  servesRole: (ctx) => ctx.is(...HR_READ),
  notForRoleLabel: 'Recruitment is handled by the school office and interview panels.',

  useList: (ctx, { filter }) => useGetJobPostingsQuery({ status: filter ?? undefined }),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.location],
  searchPlaceholder: 'Search vacancies',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'draft', label: 'Draft' },
      { value: 'closed', label: 'Closed' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const openings = rows.filter((r) => r.status === 'open').reduce((sum, r) => sum + (r.openings || 0), 0);
    const active = rows.reduce((sum, r) => sum + (r.applicants?.active || 0), 0);
    return [
      { label: 'Openings', value: openings, icon: 'door-open' },
      { label: 'Candidates in play', value: active, icon: 'account-search-outline', color: '#2563EB' },
    ];
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.employmentType, row.location].filter(Boolean).join(' · '),
    // Applicants who are still in the running, which is the number that decides whether a posting
    // needs attention — not the total who ever applied.
    meta: `${row.applicants?.active ?? 0} in play of ${row.applicants?.total ?? 0} applied${
      row.applicants?.hired ? ` · ${row.applicants.hired} hired` : ''
    }`,
    badge: row.status ? { label: row.status.replace('_', ' '), tone: POSTING_TONES[row.status] } : null,
  }),

  emptyIcon: 'briefcase-outline',
  emptyLabel: 'No vacancies posted',

  detail: {
    title: 'Vacancy',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status.replace('_', ' '), tone: POSTING_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Employment type', value: row.employmentType },
      { label: 'Openings', value: row.openings != null ? String(row.openings) : null },
      { label: 'Location', value: row.location },
      {
        label: 'Salary range',
        value:
          row.salaryMin || row.salaryMax
            ? `${formatCurrency(row.salaryMin || 0)} – ${formatCurrency(row.salaryMax || 0)}`
            : null,
      },
      { label: 'Description', value: row.description },
      { label: 'Requirements', value: row.requirements?.length ? row.requirements.join('\n') : null },
      { label: 'Applied', value: String(row.applicants?.total ?? 0) },
      { label: 'Still in the running', value: String(row.applicants?.active ?? 0) },
      { label: 'Hired', value: row.applicants?.hired ? String(row.applicants.hired) : null },
    ],
  },
};

const STATUS_LABELS = {
  pending: 'Not started',
  self_submitted: 'Self-assessment submitted',
  reviewed: 'Reviewed',
  finalised: 'Finalised',
};

const STATUS_TONES = {
  pending: 'pending',
  self_submitted: 'partial',
  reviewed: 'partial',
  finalised: 'active',
};

/**
 * My appraisal — the staff member's own review, and nobody else's.
 *
 * Two things this screen must not do, both of which the backend already enforces and neither of
 * which is worked around here:
 *
 * 1. **Self and reviewer scores are never merged into one number.** They are two separate opinions
 *    recorded side by side, so they are listed side by side.
 * 2. **The reviewer's scores are not visible until the review is finalised.** The endpoint blanks
 *    them before that, so there is simply nothing to show — and the screen says *why* rather than
 *    rendering empty rows that look like a reviewer who wrote nothing.
 *
 * Submitting the self-assessment is not here: the form is one score per criterion, and the criteria
 * live on the cycle rather than being fixed, so it is a runtime-built form like Surveys. That is a
 * once-a-year sit-down task and stays on the web portal for now.
 */
export const myAppraisalModule = {
  key: 'MyAppraisal',
  title: 'My Appraisal',
  icon: 'star-check-outline',

  useList: () => useGetMyAppraisalQuery(),
  // The endpoint answers with a single review or null — "no appraisal open" is a normal state, so
  // it becomes an empty list rather than an error.
  selectRows: (data) => (data ? [data] : []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.cycleId?.name ?? 'Appraisal',
    subtitle:
      row.cycleId?.periodStart && row.cycleId?.periodEnd
        ? `${formatDate(row.cycleId.periodStart)} – ${formatDate(row.cycleId.periodEnd)}`
        : null,
    meta: row.selfSubmittedAt ? `You submitted on ${formatDate(row.selfSubmittedAt)}` : 'Your self-assessment is not in yet',
    unread: row.status === 'pending',
    badge: { label: STATUS_LABELS[row.status] ?? row.status, tone: STATUS_TONES[row.status] },
  }),

  emptyIcon: 'star-outline',
  emptyLabel: 'You have no appraisal open right now',
  footerNote: 'Filling in your self-assessment is done on the web portal.',

  detail: {
    title: 'Appraisal',
    titleFor: (row) => row.cycleId?.name ?? 'Appraisal',
    badgeFor: (row) => ({ label: STATUS_LABELS[row.status] ?? row.status, tone: STATUS_TONES[row.status] }),
    fields: (row) => {
      const finalised = row.status === 'finalised';
      return [
        {
          label: 'Period',
          value:
            row.cycleId?.periodStart && row.cycleId?.periodEnd
              ? `${formatDate(row.cycleId.periodStart)} – ${formatDate(row.cycleId.periodEnd)}`
              : null,
        },
        { label: 'Reviewer', value: row.reviewerId?.name },
        // Your own scores, always visible — they are yours.
        ...(row.selfScores ?? []).map((entry) => ({
          label: `You rated: ${entry.criterion}`,
          value: `${entry.score} / 5${entry.comment ? ` — ${entry.comment}` : ''}`,
        })),
        { label: 'Your overall comment', value: row.selfComment },
        { label: 'Submitted on', value: row.selfSubmittedAt ? formatDate(row.selfSubmittedAt) : null },
        // The reviewer's half, only once it is settled.
        ...(finalised
          ? (row.reviewerScores ?? []).map((entry) => ({
              label: `Reviewer rated: ${entry.criterion}`,
              value: `${entry.score} / 5${entry.comment ? ` — ${entry.comment}` : ''}`,
            }))
          : []),
        { label: 'Reviewer’s comment', value: finalised ? row.reviewerComment : null },
        { label: 'Overall score', value: finalised && row.overallScore != null ? `${row.overallScore} / 5` : null },
        { label: 'Band', value: finalised ? row.overallBand : null },
        { label: 'Goals', value: finalised && row.goals?.length ? row.goals.join('\n') : null },
        {
          label: 'Your reviewer’s assessment',
          value: finalised ? null : 'Not shared until the review is finalised.',
        },
      ];
    },
  },
};
