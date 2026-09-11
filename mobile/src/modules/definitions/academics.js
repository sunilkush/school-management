import {
  useGetSubjectsQuery,
  useGetLessonPlansQuery,
  useGetSportsTeamsQuery,
  useGetMyAchievementsQuery,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

const LP_READ = [
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal',
  'Teacher', 'Subject Coordinator', 'Exam Coordinator',
];
const SPORTS_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Sports Teacher'];
const SUBJECT_READ = [
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal',
  'Teacher', 'Class Teacher', 'Subject Coordinator', 'Exam Coordinator',
];

/** The subjects the school teaches. */
export const subjectsModule = {
  key: 'Subjects',
  title: 'Subjects',
  icon: 'book-open-variant',

  servesRole: (ctx) => ctx.is(...SUBJECT_READ),
  notForRoleLabel: 'The subject list is maintained by the school office.',

  useList: () => useGetSubjectsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.subjects ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code, (row) => row.category],
  searchPlaceholder: 'Search subjects',

  row: (row) => ({
    title: row.name,
    subtitle: [row.code, row.category].filter(Boolean).join(' · '),
    meta: row.maxMarks != null ? `Max ${row.maxMarks}${row.passMarks != null ? ` · pass ${row.passMarks}` : ''}` : null,
    badge: row.type ? { label: row.type, tone: 'inactive' } : null,
  }),

  emptyIcon: 'book-off-outline',
  emptyLabel: 'No subjects set up yet',
  // Adding a subject rewires exams, timetables and report cards behind it — a setup act, not a
  // phone one.
  footerNote: 'Subjects are created on the web portal, where the exam and timetable links are set up too.',

  detail: {
    title: 'Subject',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Short name', value: row.shortName },
      { label: 'Category', value: row.category },
      { label: 'Type', value: row.type },
      { label: 'Maximum marks', value: row.maxMarks != null ? String(row.maxMarks) : null },
      { label: 'Pass marks', value: row.passMarks != null ? String(row.passMarks) : null },
      { label: 'Description', value: row.description },
    ],
  },
};

const LP_TONES = { draft: 'pending', approved: 'active', completed: 'inactive' };

/** What a teacher plans to cover, and when. */
export const lessonPlansModule = {
  key: 'LessonPlans',
  title: 'Lesson Plans',
  icon: 'notebook-outline',

  servesRole: (ctx) => ctx.is(...LP_READ),
  notForRoleLabel: 'Lesson plans are kept by teaching staff.',

  useList: (ctx, { filter }) => useGetLessonPlansQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.items ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.subjectId?.name, (row) => row.teacherId?.name],
  searchPlaceholder: 'Search by title, subject or teacher',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'approved', label: 'Approved' },
      { value: 'completed', label: 'Done' },
    ],
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.subjectId?.name, row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' · '),
    meta: [row.plannedDate ? formatDate(row.plannedDate) : null, row.teacherId?.name].filter(Boolean).join(' · '),
    unread: row.status === 'draft',
    badge: row.status ? { label: row.status, tone: LP_TONES[row.status] } : null,
  }),

  emptyIcon: 'notebook-outline',
  emptyLabel: 'No lesson plans yet',
  // Writing one is a long-form document — objectives, content, methods, assessment. A phone can
  // show it; typing it belongs at a desk.
  footerNote: 'Lesson plans are written on the web portal.',

  detail: {
    title: 'Lesson Plan',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.status ? { label: row.status, tone: LP_TONES[row.status] } : null),
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' ') },
      { label: 'Teacher', value: row.teacherId?.name },
      { label: 'Planned for', value: row.plannedDate ? formatDate(row.plannedDate) : null },
      { label: 'Duration', value: row.duration ? `${row.duration} minutes` : null },
      { label: 'Objectives', value: row.objectives },
      { label: 'Content', value: row.content },
      { label: 'Teaching methods', value: row.teachingMethods },
      { label: 'Resources', value: row.resources },
      { label: 'Assessment', value: row.assessment },
    ],
  },
};

/** School teams and who is in them. */
export const sportsModule = {
  key: 'Sports',
  title: 'Sports',
  icon: 'trophy-outline',

  servesRole: (ctx) => ctx.is(...SPORTS_ROLES),
  notForRoleLabel: 'Team management is handled by the sports staff. Your own achievements are under “My Achievements”.',

  useList: () => useGetSportsTeamsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.teams ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.sportType, (row) => row.coachId?.name],
  searchPlaceholder: 'Search teams',

  summary: (rows) => {
    if (rows.length === 0) return [];
    const players = rows.reduce((sum, row) => sum + (row.members?.length || 0), 0);
    return [
      { label: 'Teams', value: rows.length, icon: 'trophy-outline' },
      { label: 'Players', value: players, icon: 'account-group-outline', color: '#2563EB' },
    ];
  },

  row: (row) => ({
    title: row.name,
    subtitle: [row.sportType, row.category].filter(Boolean).join(' · '),
    meta: [
      row.coachId?.name ? `Coach ${row.coachId.name}` : null,
      `${row.members?.length ?? 0} player${row.members?.length === 1 ? '' : 's'}`,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.isActive === false ? { label: 'inactive', tone: 'inactive' } : null,
  }),

  emptyIcon: 'trophy-broken',
  emptyLabel: 'No teams set up',

  detail: {
    title: 'Team',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Sport', value: row.sportType },
      { label: 'Category', value: row.category },
      { label: 'Coach', value: row.coachId?.name },
      { label: 'Players', value: String(row.members?.length ?? 0) },
      {
        label: 'Squad',
        value: row.members?.length
          ? row.members.map((m) => m.name ?? m.studentName).filter(Boolean).join('\n')
          : null,
      },
    ],
  },
};

/** A student's or parent's own achievements — the self-service half of Sports. */
export const myAchievementsModule = {
  key: 'MyAchievements',
  title: 'My Achievements',
  icon: 'medal-outline',

  useList: () => useGetMyAchievementsQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.achievements ?? []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.title ?? row.name,
    subtitle: [row.category, row.level].filter(Boolean).join(' · '),
    meta: row.achievedOn ?? row.date ? formatDate(row.achievedOn ?? row.date) : null,
    badge: row.position ? { label: row.position, tone: 'active' } : null,
  }),

  emptyIcon: 'medal-outline',
  emptyLabel: 'No achievements recorded yet',

  detail: {
    title: 'Achievement',
    titleFor: (row) => row.title ?? row.name ?? 'Achievement',
    fields: (row) => [
      { label: 'Category', value: row.category },
      { label: 'Level', value: row.level },
      { label: 'Position', value: row.position },
      { label: 'Awarded on', value: row.achievedOn ?? row.date ? formatDate(row.achievedOn ?? row.date) : null },
      { label: 'Event', value: row.eventName ?? row.event },
      { label: 'Details', value: row.description },
    ],
  },
};
