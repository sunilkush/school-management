import {
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useGetBoardsQuery,
  useGetAcademicYearsBySchoolQuery,
  useGetActiveAcademicYearQuery,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

const SETUP_READ = [
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal',
  'Teacher', 'Class Teacher', 'Subject Coordinator', 'Exam Coordinator',
];
const ADMIN_ONLY = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];

/** The caller's school id, as the backend expects it on these query params. */
function schoolIdOf(ctx) {
  return ctx.user?.school?._id ?? ctx.user?.schoolId ?? null;
}

/**
 * The school's own structure — classes, sections, boards and academic years.
 *
 * All read-only. These four are what everything else hangs off: a class drives the timetable, the
 * fee structure, the report card and the roster. Creating one on a phone, between two other
 * things, is how a school ends up with "Class 5" and "class 5". The web portal owns setup; this is
 * for looking something up while you are standing in a corridor.
 */

/** Classes for the active academic year. */
export const classesModule = {
  key: 'Classes',
  title: 'Classes',
  icon: 'google-classroom',

  servesRole: (ctx) => ctx.is(...SETUP_READ),
  notForRoleLabel: 'The class list is maintained by the school office.',

  // Two hops: the class list is scoped to an academic year, and the session only carries a school.
  useList: (ctx) => {
    const schoolId = schoolIdOf(ctx);
    const year = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
    const academicYearId = year.data?._id ?? year.data?.academicYear?._id;
    const classes = useGetSchoolClassesQuery(
      { schoolId, academicYearId },
      { skip: !schoolId || !academicYearId }
    );
    // While the year is still resolving there is nothing to show — report that as loading rather
    // than as an empty class list, which would read as "this school has no classes".
    if (year.isLoading) return { ...classes, isLoading: true };
    return classes;
  },
  selectRows: (data) => (Array.isArray(data) ? data : data?.classes ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name],
  searchPlaceholder: 'Search classes',

  row: (row) => ({
    title: row.name,
    subtitle: row.boardId?.name ?? row.board?.name,
    meta: row.sections?.length ? `${row.sections.length} section${row.sections.length === 1 ? '' : 's'}` : null,
  }),

  emptyIcon: 'google-classroom',
  emptyLabel: 'No classes set up for this academic year',
  footerNote: 'Classes are created on the web portal, where the subject and fee links are set up too.',

  detail: {
    title: 'Class',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Board', value: row.boardId?.name ?? row.board?.name },
      { label: 'Sections', value: row.sections?.map((s) => s.name ?? s).filter(Boolean).join(', ') },
      { label: 'Subjects', value: row.subjects?.map((s) => s.name ?? s).filter(Boolean).join(', ') },
    ],
  },
};

/** Sections, and who the class teacher is. */
export const sectionsModule = {
  key: 'ClassSections',
  title: 'Sections',
  icon: 'view-grid-outline',
  // The web sidebar also calls the class-teacher mapping by its own name; it is this same list,
  // which already carries the class teacher on every row.
  aliases: ['ClassTeacherAssignments'],

  servesRole: (ctx) => ctx.is(...SETUP_READ),
  notForRoleLabel: 'Sections are maintained by the school office.',

  useList: () => useGetSectionsQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.sections ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.schoolClassId?.name, (row) => row.classTeacherId?.name],
  searchPlaceholder: 'Search by section, class or teacher',

  summary: (rows) => {
    if (rows.length === 0) return [];
    // A section with nobody responsible for it is the one thing worth spotting on this screen.
    const unassigned = rows.filter((row) => !row.classTeacherId).length;
    return [
      { label: 'Sections', value: rows.length, icon: 'view-grid-outline' },
      {
        label: 'No class teacher',
        value: unassigned,
        icon: 'account-alert-outline',
        color: unassigned > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: [row.schoolClassId?.name, row.name].filter(Boolean).join(' · ') || row.name,
    subtitle: row.classTeacherId?.name ? `Class teacher: ${row.classTeacherId.name}` : 'No class teacher assigned',
    meta: row.capacity ? `Capacity ${row.capacity}` : null,
    unread: !row.classTeacherId,
    badge: row.classTeacherId ? null : { label: 'unassigned', tone: 'overdue' },
  }),

  emptyIcon: 'view-grid-outline',
  emptyLabel: 'No sections set up',

  detail: {
    title: 'Section',
    titleFor: (row) => [row.schoolClassId?.name, row.name].filter(Boolean).join(' · ') || row.name,
    fields: (row) => [
      { label: 'Class', value: row.schoolClassId?.name },
      { label: 'Class teacher', value: row.classTeacherId?.name },
      { label: 'Teacher email', value: row.classTeacherId?.email },
      { label: 'Capacity', value: row.capacity != null ? String(row.capacity) : null },
      { label: 'Students enrolled', value: String(row.studentEnrollmentIds?.length ?? row.StudentEnrollmentId?.length ?? 0) },
      { label: 'Subjects', value: row.subjects?.map((s) => s.subjectId?.name ?? s.name).filter(Boolean).join(', ') },
    ],
  },
};

/** Examination boards the school is affiliated to. */
export const boardsModule = {
  key: 'Boards',
  title: 'Boards',
  icon: 'certificate-outline',
  aliases: ['BoardClasses'],

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY),
  notForRoleLabel: 'Board affiliation is maintained by the school office.',

  useList: () => useGetBoardsQuery({}),
  selectRows: (data) => data?.boards ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code],
  searchPlaceholder: 'Search boards',

  row: (row) => ({
    title: row.name,
    subtitle: row.code,
    meta: row.description,
    badge: row.isActive === false ? { label: 'inactive', tone: 'inactive' } : null,
  }),

  emptyIcon: 'certificate-outline',
  emptyLabel: 'No boards configured',

  detail: {
    title: 'Board',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Description', value: row.description },
    ],
  },
};

/** Academic years, and which one is currently running. */
export const academicYearsModule = {
  key: 'AcademicYears',
  title: 'Academic Years',
  icon: 'calendar-range-outline',

  servesRole: (ctx) => ctx.is(...ADMIN_ONLY),
  notForRoleLabel: 'Academic years are maintained by the school office.',

  useList: (ctx) => {
    const schoolId = schoolIdOf(ctx);
    return useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  },
  // This endpoint answers with a bare `{ success, count, data }` rather than the usual ApiResponse
  // wrapper, so `data` is already the array by the time axiosBaseQuery unwraps it.
  selectRows: (data) => (Array.isArray(data) ? data : data?.academicYears ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.name, (row) => row.code],
  searchPlaceholder: 'Search years',

  row: (row) => ({
    title: row.name,
    subtitle: row.code,
    meta:
      row.startDate && row.endDate ? `${formatDate(row.startDate)} – ${formatDate(row.endDate)}` : null,
    // Which year is active decides what almost every other screen shows, so it is the one thing
    // this list must make obvious.
    unread: Boolean(row.isActive),
    badge: row.isActive ? { label: 'active', tone: 'active' } : { label: row.status ?? 'closed', tone: 'inactive' },
  }),

  emptyIcon: 'calendar-range-outline',
  emptyLabel: 'No academic years set up',
  footerNote: 'Switching the active year changes what every other screen shows, so it is done on the web portal.',

  detail: {
    title: 'Academic Year',
    titleFor: (row) => row.name,
    badgeFor: (row) => (row.isActive ? { label: 'active', tone: 'active' } : null),
    fields: (row) => [
      { label: 'Code', value: row.code },
      { label: 'Starts', value: row.startDate ? formatDate(row.startDate) : null },
      { label: 'Ends', value: row.endDate ? formatDate(row.endDate) : null },
      { label: 'Status', value: row.status },
    ],
  },
};
