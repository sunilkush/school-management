import {
  useGetMyHomeworkQuery,
  useGetTeacherHomeworkQuery,
  useGetChildHomeworkQuery,
  useGetMyChildrenQuery,
  useSubmitHomeworkMutation,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

const TEACHER_ROLES = ['Teacher', 'Class Teacher', 'Subject Coordinator'];

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

/**
 * Homework, from whichever side the caller is on: a student's own assignments, a parent's selected
 * child's, or a teacher's issued list.
 *
 * Attachments are not part of this yet — picking a file needs `expo-document-picker`, a native
 * dependency this app does not have. The backend accepts a text-only submission as a genuinely
 * complete "submitted" (multer's attachments field has no minimum), so nothing here is a stub;
 * there is simply no way to attach a photo of the work yet.
 */
export const homeworkModule = {
  key: 'Assignments',
  title: 'Homework',
  icon: 'clipboard-text-outline',

  // A Parent is looking at ONE child's homework. `userId` and not `_id`: the /child/:childId/…
  // routes resolve the child through `Student.findOne({ userId })`, so passing the Student id
  // silently 403s as "not authorized to access this child's data".
  scope: {
    activeFor: (ctx) => ctx.is('Parent'),
    useOptions: (ctx) => useGetMyChildrenQuery(undefined, { skip: !ctx.is('Parent') }),
    selectOptions: (data) => (data ?? []).map((child) => ({ value: child.userId, label: child.name })),
    emptyLabel: 'No children are linked to your account yet',
  },

  useList: (ctx, { scope }) => {
    const isTeacher = ctx.is(...TEACHER_ROLES);
    const isParent = ctx.is('Parent');
    const mine = useGetMyHomeworkQuery(undefined, { skip: isTeacher || isParent });
    const teaching = useGetTeacherHomeworkQuery(undefined, { skip: !isTeacher });
    const child = useGetChildHomeworkQuery(scope, { skip: !isParent || !scope });
    if (isTeacher) return teaching;
    return isParent ? child : mine;
  },

  // The student and child endpoints wrap the list as { enrollmentId, homework }; the teacher one
  // returns a bare array.
  selectRows: (data) => (Array.isArray(data) ? data : data?.homework ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.subjectId?.name],
  searchPlaceholder: 'Search homework',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'todo', label: 'To do' },
      { value: 'done', label: 'Submitted' },
    ],
    // Only meaningful on the student/parent side; a teacher's rows carry submissionCount instead
    // of a submission, so for them "to do" is simply everything not yet past its due date.
    apply: (row, value) =>
      value === 'done' ? Boolean(row.submission) : !row.submission,
  },

  row: (row, ctx) => {
    const teacher = ctx.is(...TEACHER_ROLES);
    const submitted = Boolean(row.submission);
    const late = !submitted && isOverdue(row.dueDate);

    return {
      title: row.title,
      subtitle: row.subjectId?.name,
      meta: row.dueDate ? `Due ${formatDate(row.dueDate)}` : null,
      unread: !teacher && !submitted,
      badge: teacher
        ? { label: `${row.submissionCount ?? 0} submitted`, tone: 'inactive' }
        : submitted
          ? { label: 'submitted', tone: 'active' }
          : late
            ? { label: 'overdue', tone: 'overdue' }
            : { label: 'pending', tone: 'pending' },
    };
  },

  emptyIcon: 'clipboard-check-outline',
  emptyLabel: 'No homework right now',

  detail: {
    title: 'Homework',
    titleFor: (row) => row.title,
    badgeFor: (row) => (row.submission ? { label: 'submitted', tone: 'active' } : null),
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Due date', value: row.dueDate ? formatDate(row.dueDate) : null },
      { label: 'Details', value: row.description },
      { label: 'Submitted on', value: row.submission?.submittedAt ? formatDate(row.submission.submittedAt) : null },
    ],
    actions: [
      {
        key: 'submit',
        label: 'Submit homework',
        icon: 'send-outline',
        tone: 'primary',
        // Students submit their own work. A parent cannot submit on a child's behalf — the
        // backend's submit route is Student-only — and a teacher has nothing to submit.
        allow: (ctx, row) => ctx.is('Student') && !row?.submission,
        useMutation: useSubmitHomeworkMutation,
        title: 'Submit Homework',
        submitLabel: 'Submit',
        fields: [
          {
            name: 'remarks',
            label: 'Your remarks',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your work — file attachments are not supported yet',
          },
        ],
        buildArg: (row, ctx, values) => ({ assignmentId: row._id, remarks: values.remarks.trim() }),
      },
    ],
  },
};
