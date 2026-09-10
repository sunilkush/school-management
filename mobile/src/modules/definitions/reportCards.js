import {
  useGetMyReportCardsQuery,
  useGetChildReportCardsQuery,
  useGetMyChildrenQuery,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

/**
 * Report cards — the consolidated, weighted marksheet a student or parent receives.
 *
 * Both endpoints return **published cards only**. An unpublished card is still being worked on by
 * the exam team and is not the school's word yet, so there is deliberately no "draft" state here
 * to show; a student simply does not see a card until the school releases it.
 *
 * Generating and publishing cards is exam-team work with its own screens — Phase 5, not this list.
 */
export const reportCardsModule = {
  key: 'ProgressReport',
  title: 'Report Cards',
  icon: 'file-chart-outline',

  servesRole: (ctx) => ctx.is('Student', 'Parent'),
  notForRoleLabel: 'This is a student’s own report card. Generating and publishing cards for a class is exam-team work, coming in Phase 5.',

  // userId again — ReportCard.studentId refs User, so this matches homework/attendance and is the
  // opposite of the Fees module's Student._id.
  scope: {
    activeFor: (ctx) => ctx.is('Parent'),
    useOptions: (ctx) => useGetMyChildrenQuery(undefined, { skip: !ctx.is('Parent') }),
    selectOptions: (data) => (data ?? []).map((child) => ({ value: child.userId, label: child.name })),
    emptyLabel: 'No children are linked to your account yet',
  },

  useList: (ctx, { scope }) => {
    const isParent = ctx.is('Parent');
    const mine = useGetMyReportCardsQuery(undefined, { skip: isParent });
    const child = useGetChildReportCardsQuery(scope, { skip: !isParent || !scope });
    return isParent ? child : mine;
  },
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.templateId?.name ?? 'Report card',
    subtitle: row.totals?.grade ? `Grade ${row.totals.grade}` : null,
    meta: [
      row.totals?.percentage != null ? `${row.totals.percentage}%` : null,
      row.rank ? `Rank ${row.rank}` : null,
      row.publishedAt ? formatDate(row.publishedAt) : null,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.totals?.resultStatus
      ? { label: row.totals.resultStatus, tone: row.totals.resultStatus === 'PASS' ? 'active' : 'overdue' }
      : null,
  }),

  emptyIcon: 'file-document-outline',
  emptyLabel: 'No report cards have been published yet',

  detail: {
    title: 'Report Card',
    titleFor: (row) => row.templateId?.name ?? 'Report card',
    badgeFor: (row) =>
      row.totals?.resultStatus
        ? { label: row.totals.resultStatus, tone: row.totals.resultStatus === 'PASS' ? 'active' : 'overdue' }
        : null,
    // A marksheet is subject rows, not a fixed set of fields — so the subjects expand into the
    // field list rather than being crammed into one. Each shows the weighted percentage the card
    // was actually computed from, not raw marks from a single exam.
    fields: (row) => [
      ...(row.subjects ?? []).map((subject) => ({
        label: subject.subjectName ?? 'Subject',
        value: [
          subject.weightedPercentage != null ? `${subject.weightedPercentage}%` : null,
          subject.grade ? `Grade ${subject.grade}` : null,
          subject.isPassed === false ? 'Not passed' : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
      ...(row.coScholastic ?? []).map((area) => ({
        label: area.area,
        value: area.grade || '—',
      })),
      {
        label: 'Overall',
        value: [
          row.totals?.obtainedMarks != null && row.totals?.maximumMarks != null
            ? `${row.totals.obtainedMarks} / ${row.totals.maximumMarks}`
            : null,
          row.totals?.percentage != null ? `${row.totals.percentage}%` : null,
          row.totals?.grade ? `Grade ${row.totals.grade}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      },
      { label: 'Rank in class', value: row.rank ? String(row.rank) : null },
      {
        label: 'Attendance',
        value: row.attendance?.totalDays
          ? `${row.attendance.presentDays} of ${row.attendance.totalDays} days (${row.attendance.percentage}%)`
          : null,
      },
      { label: 'Class teacher’s remarks', value: row.classTeacherRemarks },
      { label: 'Published', value: row.publishedAt ? formatDate(row.publishedAt) : null },
    ],
  },
};
