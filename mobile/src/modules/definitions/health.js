import { useGetHealthVisitsQuery, useUpdateHealthVisitMutation } from '../../store/api/apiSlice';
import { formatDate, formatTime } from '../../utils/format';

// healthRecord.routes.js HEALTH_ROLES.
const HEALTH_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Medical Officer'];

const SEVERITY_TONES = { Minor: 'inactive', Moderate: 'pending', Severe: 'overdue' };

/**
 * The sick-room log — students seen by the medical officer, what was wrong, and what was done.
 *
 * Logging a *new* visit is not offered here. It needs a student picker, and it is written while a
 * child is sitting in front of you, which is exactly when a half-fitting phone form is most likely
 * to record the wrong student against a temperature. The web portal's form does that properly.
 *
 * What the phone does well is the follow-through: seeing who is still open, whether a parent has
 * been told, and closing a visit once the child is back in class.
 */
export const healthModule = {
  key: 'HealthRecords',
  title: 'Health Records',
  icon: 'medical-bag',

  servesRole: (ctx) => ctx.is(...HEALTH_ROLES),
  notForRoleLabel: 'The sick-room log is kept by the medical officer and the school office.',

  useList: (ctx, { filter }) => useGetHealthVisitsQuery({ status: filter ?? undefined, limit: 50 }),
  selectRows: (data) => data?.visits ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentName, (row) => row.symptoms],
  searchPlaceholder: 'Search by student or symptoms',

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
    // A child sent to hospital whose parent has not been told is the one thing here that cannot
    // wait, so it gets its own tile rather than being buried in a row.
    const unnotified = rows.filter((row) => row.referredToHospital && !row.parentNotified).length;
    return [
      { label: 'Open', value: open, icon: 'medical-bag', color: open > 0 ? '#F59E0B' : '#94A3B8' },
      {
        label: 'Referred, parent not told',
        value: unnotified,
        icon: 'phone-alert-outline',
        color: unnotified > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.studentName || 'Student',
    subtitle: row.symptoms,
    meta: [
      [row.className, row.sectionName].filter(Boolean).join(' '),
      row.visitDate ? formatTime(row.visitDate) : null,
      row.referredToHospital ? 'referred out' : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: row.status === 'Open',
    badge: row.severity ? { label: row.severity.toLowerCase(), tone: SEVERITY_TONES[row.severity] } : null,
  }),

  emptyIcon: 'medical-bag',
  emptyLabel: 'No sick-room visits recorded',

  detail: {
    title: 'Visit',
    titleFor: (row) => row.studentName || 'Visit',
    badgeFor: (row) => ({
      label: row.status === 'Open' ? 'open' : 'resolved',
      tone: row.status === 'Open' ? 'pending' : 'active',
    }),
    fields: (row) => [
      { label: 'Class', value: [row.className, row.sectionName].filter(Boolean).join(' ') },
      { label: 'Seen at', value: row.visitDate ? `${formatDate(row.visitDate)}, ${formatTime(row.visitDate)}` : null },
      { label: 'Symptoms', value: row.symptoms },
      { label: 'Severity', value: row.severity },
      { label: 'Temperature', value: row.temperature ? `${row.temperature} °F` : null },
      { label: 'Treatment given', value: row.treatmentGiven },
      {
        label: 'Referred to hospital',
        value: row.referredToHospital ? row.referredTo || 'Yes' : null,
      },
      {
        label: 'Parent notified',
        value: row.parentNotified
          ? row.parentNotifiedAt
            ? `Yes, ${formatDate(row.parentNotifiedAt)}`
            : 'Yes'
          : 'Not yet',
      },
    ],
    actions: [
      {
        key: 'notify',
        label: 'Mark parent as notified',
        icon: 'phone-check-outline',
        allow: (ctx, row) => ctx.is(...HEALTH_ROLES) && !row?.parentNotified,
        useMutation: useUpdateHealthVisitMutation,
        // This records that a call was made; it does not place one. Nothing here dials a parent.
        buildArg: (row) => ({ id: row._id, parentNotified: true, parentNotifiedAt: new Date().toISOString() }),
      },
      {
        key: 'resolve',
        label: 'Close this visit',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => ctx.is(...HEALTH_ROLES) && row?.status === 'Open',
        useMutation: useUpdateHealthVisitMutation,
        title: 'Close Visit',
        submitLabel: 'Close Visit',
        fields: [
          {
            name: 'treatmentGiven',
            label: 'Treatment given',
            type: 'textarea',
            required: true,
            placeholder: 'What was done, and how the child was when they left',
          },
        ],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          status: 'Resolved',
          treatmentGiven: values.treatmentGiven.trim(),
        }),
      },
    ],
  },
};
