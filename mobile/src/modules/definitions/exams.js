import { useGetExamsQuery } from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';

const STATUS_TONES = { published: 'active', completed: 'inactive', draft: 'pending' };

function whenLabel(exam) {
  if (!exam.examDate) return null;
  const day = formatDate(exam.examDate);
  return exam.startTime ? `${day}, ${formatTime(exam.startTime)}` : day;
}

/**
 * The exam schedule — what is coming, when, and for how long.
 *
 * The backend already scopes this to the caller: a Student's list is filtered to their own class
 * and section by `getExamsService`, so no client-side narrowing is applied on top, which would
 * risk hiding an exam they are actually sitting.
 *
 * Results are a separate module ([Grades]) because they arrive later and answer a different
 * question. Admit cards are per-exam (`/exams/:id/admit-cards`) and need their own fetch inside
 * the detail — still open, noted in PLAN.md rather than faked here.
 */
export const examsModule = {
  key: 'Exams',
  title: 'Exams',
  icon: 'pencil-box-outline',

  useList: () => useGetExamsQuery({}),
  selectRows: (data) => data?.exams ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.subjectId?.name, (row) => row.examCode],
  searchPlaceholder: 'Search exams',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'completed', label: 'Done' },
    ],
    apply: (row, value) => {
      if (value === 'completed') return row.status === 'completed';
      // Upcoming means "not yet sat" — an exam whose date has passed but which the school has not
      // marked completed is still shown as done rather than lingering as upcoming forever.
      if (row.status === 'completed') return false;
      return row.examDate ? new Date(row.examDate).getTime() >= Date.now() - 86400000 : true;
    },
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.subjectId?.name, row.schoolClassId?.name].filter(Boolean).join(' · '),
    meta: [whenLabel(row), row.totalMarks != null ? `${row.totalMarks} marks` : null].filter(Boolean).join(' · '),
    badge: row.status ? { label: row.status, tone: STATUS_TONES[row.status] } : null,
  }),

  emptyIcon: 'pencil-off-outline',
  emptyLabel: 'No exams scheduled',

  detail: {
    title: 'Exam',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status, tone: STATUS_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' · ') },
      { label: 'Exam code', value: row.examCode },
      { label: 'Type', value: row.examType },
      { label: 'Date', value: whenLabel(row) },
      {
        label: 'Time',
        value:
          row.startTime && row.endTime ? `${formatTime(row.startTime)} – ${formatTime(row.endTime)}` : null,
      },
      { label: 'Duration', value: row.durationMinutes ? `${row.durationMinutes} minutes` : null },
      { label: 'Total marks', value: row.totalMarks != null ? String(row.totalMarks) : null },
      { label: 'Passing marks', value: row.passingMarks != null ? String(row.passingMarks) : null },
    ],
  },
};
