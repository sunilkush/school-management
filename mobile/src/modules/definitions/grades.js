import { useGetMyGradesQuery } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

/**
 * Exam results — the marks from each individual exam, as published.
 *
 * Not the same thing as [Report Cards], and deliberately a separate module: a result is one
 * exam's marks, a report card is the weighted consolidation across several. Students routinely
 * want the first ("what did I get in the maths test?") long before the second exists.
 *
 * Published results only — an unpublished result is still being entered by the teacher.
 */
export const gradesModule = {
  key: 'Grades',
  title: 'Results',
  icon: 'chart-line',

  // /student-portal/me/grades resolves the student from the caller, so there is no child variant
  // to point a parent at. Parent's own 'Grades' entry gets the per-child view in Phase 5.
  servesRole: (ctx) => ctx.is('Student'),
  notForRoleLabel: 'These are a student’s own exam results. The parent view of a child’s results is coming in Phase 5.',

  useList: () => useGetMyGradesQuery(),
  selectRows: (data) => data?.grades ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.examId?.title],
  searchPlaceholder: 'Search exams',

  summary: (rows) => {
    if (rows.length === 0) return [];
    const average = Math.round(rows.reduce((sum, row) => sum + (row.percentage || 0), 0) / rows.length);
    const failed = rows.filter((row) => row.resultStatus === 'FAIL').length;
    const tiles = [{ label: 'Average', value: average, suffix: '%', icon: 'chart-donut' }];
    // Only shown when there is something to act on — a zero here would just be noise.
    if (failed > 0) tiles.push({ label: 'Not passed', value: failed, icon: 'alert-circle-outline', color: '#EF4444' });
    return tiles;
  },

  row: (row) => ({
    title: row.examId?.title ?? 'Exam',
    subtitle: row.grade ? `Grade ${row.grade}` : null,
    meta: [
      row.percentage != null ? `${row.percentage}%` : null,
      row.rank ? `Rank ${row.rank}` : null,
      row.examId?.examDate ? formatDate(row.examId.examDate) : null,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.resultStatus
      ? { label: row.resultStatus, tone: row.resultStatus === 'PASS' ? 'active' : 'overdue' }
      : null,
  }),

  emptyIcon: 'clipboard-text-outline',
  emptyLabel: 'No results published yet',

  detail: {
    title: 'Result',
    titleFor: (row) => row.examId?.title ?? 'Exam',
    badgeFor: (row) =>
      row.resultStatus ? { label: row.resultStatus, tone: row.resultStatus === 'PASS' ? 'active' : 'overdue' } : null,
    // Same shape as a report card's detail: one row per subject, since a marksheet is subject
    // rows and not a fixed set of fields.
    fields: (row) => [
      ...(row.subjects ?? []).map((subject) => ({
        label: subject.subjectName ?? 'Subject',
        value: [
          `${subject.obtainedMarks} / ${subject.totalMarks}`,
          subject.isPassed === false ? 'Not passed' : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
      {
        label: 'Total',
        value: `${row.totalObtainedMarks} / ${row.totalMaximumMarks} · ${row.percentage}%${row.grade ? ` · Grade ${row.grade}` : ''}`,
      },
      { label: 'Rank in class', value: row.rank ? String(row.rank) : null },
      { label: 'Exam date', value: row.examId?.examDate ? formatDate(row.examId.examDate) : null },
      { label: 'Published', value: row.publishedAt ? formatDate(row.publishedAt) : null },
    ],
  },
};
