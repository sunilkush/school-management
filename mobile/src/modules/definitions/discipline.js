import { useGetIncidentsQuery, useUpdateIncidentMutation } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

// disciplineIncident.routes.js DISCIPLINE_ROLES.
const DISCIPLINE_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Class Teacher'];

const SEVERITY_TONES = { Minor: 'inactive', Moderate: 'pending', Major: 'overdue' };

/**
 * The discipline register — incidents logged against a student, and whether each is still open.
 *
 * Logging a *new* incident is not offered here. The record names a student, carries a severity and
 * demerit points, and follows them — writing one is a considered act with a student picker and a
 * category behind it, and the web portal's own form does that properly. A half-built version on a
 * phone is the wrong place to get it slightly wrong.
 *
 * What the phone is good for is the other half: a teacher checking what is outstanding, and
 * closing one out once it has been dealt with.
 */
export const disciplineModule = {
  key: 'Discipline',
  title: 'Discipline',
  icon: 'gavel',

  servesRole: (ctx) => ctx.is(...DISCIPLINE_ROLES),
  notForRoleLabel: 'The discipline register is kept by teachers and the school office.',

  useList: (ctx, { filter }) => useGetIncidentsQuery({ status: filter ?? undefined, limit: 50 }),
  selectRows: (data) => data?.incidents ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentName, (row) => row.description, (row) => row.category],
  searchPlaceholder: 'Search by student or description',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'Resolved', label: 'Resolved' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const open = rows.filter((row) => row.status === 'Open').length;
    const needsMeeting = rows.filter((row) => row.parentMeetingRequired && row.status === 'Open').length;
    return [
      { label: 'Open', value: open, icon: 'alert-circle-outline', color: open > 0 ? '#F59E0B' : '#94A3B8' },
      {
        label: 'Parent meeting due',
        value: needsMeeting,
        icon: 'account-supervisor-outline',
        color: needsMeeting > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.studentName || 'Student',
    subtitle: row.description,
    meta: [
      [row.className, row.sectionName].filter(Boolean).join(' '),
      row.incidentDate ? formatDate(row.incidentDate) : null,
      row.demeritPoints ? `${row.demeritPoints} demerit${row.demeritPoints === 1 ? '' : 's'}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: row.status === 'Open',
    badge: row.severity ? { label: row.severity.toLowerCase(), tone: SEVERITY_TONES[row.severity] } : null,
  }),

  emptyIcon: 'check-circle-outline',
  emptyLabel: 'No incidents on record',

  detail: {
    title: 'Incident',
    titleFor: (row) => row.studentName || 'Incident',
    badgeFor: (row) => ({
      label: row.status === 'Open' ? 'open' : 'resolved',
      tone: row.status === 'Open' ? 'pending' : 'active',
    }),
    fields: (row) => [
      { label: 'Class', value: [row.className, row.sectionName].filter(Boolean).join(' ') },
      { label: 'Date', value: row.incidentDate ? formatDate(row.incidentDate) : null },
      { label: 'Category', value: row.category },
      { label: 'Severity', value: row.severity },
      { label: 'What happened', value: row.description },
      { label: 'Demerit points', value: row.demeritPoints ? String(row.demeritPoints) : null },
      { label: 'Action taken', value: row.actionTaken },
      { label: 'Witnesses', value: row.witnesses?.length ? row.witnesses.join(', ') : null },
      {
        label: 'Parent meeting',
        value: row.parentMeetingRequired ? 'Required' : null,
      },
      { label: 'Parent notified', value: row.parentNotified ? 'Yes' : 'Not yet' },
    ],
    actions: [
      {
        key: 'resolve',
        label: 'Mark resolved',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => ctx.is(...DISCIPLINE_ROLES) && row?.status === 'Open',
        useMutation: useUpdateIncidentMutation,
        title: 'Resolve Incident',
        submitLabel: 'Mark Resolved',
        // Closing an incident without saying what was done leaves the record useless to whoever
        // reads it next — so the action taken is collected rather than defaulted to empty.
        fields: [
          {
            name: 'actionTaken',
            label: 'What was done',
            type: 'textarea',
            required: true,
            placeholder: 'How this was dealt with',
          },
        ],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          status: 'Resolved',
          actionTaken: values.actionTaken.trim(),
        }),
      },
    ],
  },
};
