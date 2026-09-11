import {
  useGetQuestionsQuery,
  useGetAssignedClassesQuery,
  useGetPTMSessionsQuery,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';

const TEACHING_ROLES = [
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal',
  'Teacher', 'Class Teacher', 'Subject Coordinator', 'Exam Coordinator',
];
// ptm.routes.js PTM_STAFF_ROLES.
const PTM_STAFF = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Class Teacher'];

const DIFFICULTY_TONES = { easy: 'active', medium: 'pending', hard: 'overdue' };

const QUESTION_TYPE_LABELS = {
  mcq_single: 'Multiple choice',
  mcq_multi: 'Multiple answers',
  true_false: 'True / false',
  fill_blank: 'Fill in the blank',
  match: 'Matching',
};

/**
 * The question bank — what is available to build a paper from.
 *
 * Read-only. Writing a question means options, correct answers, marks and negative marks, and it
 * is done in bulk while building a paper; that is `PaperBuilder`'s job on the web. What a phone is
 * good for is checking whether a chapter has enough questions before you plan an exam.
 *
 * **Correct answers are not shown.** The endpoint returns them, and a teacher may legitimately see
 * them — but this screen can be open in front of a class, and a stray glance at an answer key is a
 * cost with no matching benefit on a phone.
 */
export const questionBankModule = {
  key: 'QuestionBank',
  title: 'Question Bank',
  icon: 'help-circle-outline',

  servesRole: (ctx) => ctx.is(...TEACHING_ROLES),
  notForRoleLabel: 'The question bank is for teaching staff.',

  useList: (ctx, { filter }) => useGetQuestionsQuery({ difficulty: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.questions ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.statement ?? row.text, (row) => row.subjectId?.name, (row) => row.tags?.join(' ')],
  searchPlaceholder: 'Search questions',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const marks = rows.reduce((sum, row) => sum + (row.marks || 0), 0);
    return [
      { label: 'Questions', value: rows.length, icon: 'help-circle-outline' },
      { label: 'Total marks', value: marks, icon: 'counter', color: '#2563EB' },
    ];
  },

  row: (row) => ({
    title: row.statement ?? row.text ?? 'Question',
    subtitle: [row.subjectId?.name, row.chapterId?.name].filter(Boolean).join(' · '),
    meta: [
      QUESTION_TYPE_LABELS[row.questionType] ?? row.questionType,
      row.marks != null ? `${row.marks} mark${row.marks === 1 ? '' : 's'}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.difficulty ? { label: row.difficulty, tone: DIFFICULTY_TONES[row.difficulty] } : null,
  }),

  emptyIcon: 'help-rhombus-outline',
  emptyLabel: 'No questions in the bank yet',
  footerNote: 'Questions are written and papers are built on the web portal.',

  detail: {
    title: 'Question',
    titleFor: (row) => row.statement ?? row.text ?? 'Question',
    badgeFor: (row) => (row.difficulty ? { label: row.difficulty, tone: DIFFICULTY_TONES[row.difficulty] } : null),
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Chapter', value: row.chapterId?.name },
      { label: 'Type', value: QUESTION_TYPE_LABELS[row.questionType] ?? row.questionType },
      { label: 'Marks', value: row.marks != null ? String(row.marks) : null },
      { label: 'Negative marks', value: row.negativeMarks ? String(row.negativeMarks) : null },
      // Options without the answer key — see the note at the top.
      { label: 'Options', value: row.options?.length ? row.options.map((o) => `• ${o.text ?? o}`).join('\n') : null },
      { label: 'Tags', value: row.tags?.length ? row.tags.join(', ') : null },
      { label: 'Written by', value: row.createdBy?.name },
    ],
  },
};

/**
 * The classes a teacher actually teaches, with how many students are in each.
 *
 * Same endpoint the mark-attendance roster uses to populate its class chips, so what a teacher
 * sees here is exactly the set they can mark.
 */
export const assignedClassesModule = {
  key: 'AssignedClasses',
  title: 'My Classes',
  icon: 'google-classroom',
  // "My Class" is the class teacher's own label for the same list.
  aliases: ['MyClass'],

  servesRole: (ctx) => ctx.is(...TEACHING_ROLES),
  notForRoleLabel: 'This is the teaching staff’s own class list.',

  useList: (ctx) => {
    const schoolId = ctx.user?.school?._id ?? ctx.user?.schoolId;
    const year = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
    const academicYearId = year.data?._id ?? year.data?.academicYear?._id;
    const classes = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
    if (year.isLoading) return { ...classes, isLoading: true };
    return classes;
  },
  selectRows: (data) => (Array.isArray(data) ? data : data?.classes ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name],
  searchPlaceholder: 'Search your classes',

  summary: (rows) => {
    if (rows.length === 0) return [];
    return [
      { label: 'Classes', value: rows.length, icon: 'google-classroom' },
      {
        label: 'Students',
        value: rows.reduce((sum, row) => sum + (row.studentCount || 0), 0),
        icon: 'account-group-outline',
        color: '#2563EB',
      },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: row.sections?.map((s) => s.name).filter(Boolean).join(', '),
    meta: [
      `${row.studentCount ?? 0} student${row.studentCount === 1 ? '' : 's'}`,
      row.subjects?.length ? row.subjects.map((s) => s.name ?? s).filter(Boolean).join(', ') : null,
    ]
      .filter(Boolean)
      .join(' · '),
    // `role` says whether you are the class teacher here or just teach a subject — worth showing,
    // because it decides what you are responsible for.
    badge: row.role?.includes('classTeacher') ? { label: 'class teacher', tone: 'active' } : null,
  }),

  emptyIcon: 'google-classroom',
  emptyLabel: 'You are not assigned to any class this year',

  detail: {
    title: 'Class',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Sections', value: row.sections?.map((s) => s.name).filter(Boolean).join(', ') },
      { label: 'Students', value: String(row.studentCount ?? 0) },
      { label: 'Subjects you teach', value: row.subjects?.map((s) => s.name ?? s).filter(Boolean).join(', ') },
      { label: 'Your role here', value: row.role?.join(', ') },
    ],
  },
};

const PTM_TONES = { Scheduled: 'pending', Completed: 'active', Cancelled: 'overdue' };

/**
 * Parent-teacher meeting sessions, from the staff side — what is scheduled and how full it is.
 *
 * The parent's half (booking a slot) is a separate bespoke screen, `PTMBooking`, because booking
 * means picking one of many live slots grouped by session.
 */
export const ptmSessionsModule = {
  key: 'PTM',
  title: 'Parent Meetings',
  icon: 'account-supervisor-outline',

  servesRole: (ctx) => ctx.is(...PTM_STAFF),
  notForRoleLabel: 'This is the staff view. Parents book a slot from “PTM Booking”.',

  useList: () => useGetPTMSessionsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.sessions ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.teacherId?.name, (row) => row.schoolClassId?.name],
  searchPlaceholder: 'Search sessions',

  row: (row) => ({
    title: row.title,
    subtitle: [row.schoolClassId?.name, row.sectionId?.name, row.teacherId?.name].filter(Boolean).join(' · '),
    meta: [
      row.date ? formatDate(row.date) : null,
      row.startTime && row.endTime ? `${formatTime(row.startTime)} – ${formatTime(row.endTime)}` : null,
      row.location,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.status ? { label: row.status.toLowerCase(), tone: PTM_TONES[row.status] } : null,
  }),

  emptyIcon: 'account-supervisor-outline',
  emptyLabel: 'No parent meetings scheduled',
  footerNote: 'Scheduling a session and marking who attended is done on the web portal.',

  detail: {
    title: 'Session',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status.toLowerCase(), tone: PTM_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' ') },
      { label: 'Teacher', value: row.teacherId?.name },
      { label: 'Date', value: row.date ? formatDate(row.date) : null },
      {
        label: 'Time',
        value: row.startTime && row.endTime ? `${formatTime(row.startTime)} – ${formatTime(row.endTime)}` : null,
      },
      { label: 'Slot length', value: row.slotDurationMinutes ? `${row.slotDurationMinutes} minutes` : null },
      { label: 'Location', value: row.location },
    ],
  },
};
