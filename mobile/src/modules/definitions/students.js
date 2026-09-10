import { useGetStudentsListQuery, useGetStudentDetailsQuery } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

// backend/src/routes/student.routes.js gates GET /student/all on these role names.
const ROSTER_ROLES = ['Super Admin', 'School Admin', 'Teacher', 'Accountant', 'Principal', 'Vice Principal'];

/**
 * Pilot module #3 — proves the engine handles a list whose detail is a genuinely richer SECOND
 * request rather than the row it already has, and whose row id is not the id the detail endpoint
 * wants.
 */
export const studentsModule = {
  key: 'Students',
  title: 'Students',
  icon: 'school-outline',

  // Page 1 only for now. The endpoint's infinite-scroll merge is already wired in apiSlice.js;
  // hooking the engine's FlatList up to it is a Phase 3 item, not something to fake here.
  useList: () => useGetStudentsListQuery({ page: 1, limit: 20 }),
  selectRows: (data) => data?.students ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentName, (row) => row.registrationNumber, (row) => row.className],
  searchPlaceholder: 'Search by name or registration no.',

  row: (row) => ({
    title: row.studentName,
    subtitle: [row.className, row.sectionName].filter(Boolean).join(' · '),
    meta: row.registrationNumber ? `Reg. ${row.registrationNumber}` : null,
    badge: row.status ? { label: row.status, tone: row.status === 'Active' ? 'active' : 'inactive' } : null,
  }),

  emptyIcon: 'school-outline',
  emptyLabel: 'No students on the roster',
  footerNote: 'Showing the first 20 students. Full pagination arrives with the Students module in Phase 5.',

  detail: {
    title: 'Student',
    // GET /student/getStudent/:id takes a Student._id. The list row's own `_id` is the
    // StudentEnrollment id, which is why the projection carries `studentId` separately — passing
    // the wrong one here is a silent 404, so it is spelled out rather than defaulted.
    idFor: (row) => row.studentId,
    useItem: (id) => useGetStudentDetailsQuery(id, { skip: !id }),
    selectItem: (data) => data?.student ?? data,
    titleFor: (record) => record?.userId?.name ?? record?.studentName ?? 'Student',
    fields: (record) => [
      { label: 'Registration number', value: record?.registrationNumber },
      { label: 'Email', value: record?.userId?.email },
      { label: 'Phone', value: record?.userId?.phone ?? record?.mobile },
      { label: 'Date of birth', value: record?.dateOfBirth ? formatDate(record.dateOfBirth) : null },
      { label: 'Admission date', value: record?.admissionDate ? formatDate(record.admissionDate) : null },
      { label: 'Guardian', value: record?.guardianName ?? record?.fatherName },
      { label: 'Guardian phone', value: record?.guardianPhone ?? record?.fatherPhone },
      { label: 'Address', value: record?.address },
    ],
  },

  // Admission is a multi-step flow (user + student + enrollment across three collections), not a
  // single POST — it stays a bespoke screen in Phase 5 rather than being forced into this form.
  allow: (ctx) => ctx.is(...ROSTER_ROLES),
};
