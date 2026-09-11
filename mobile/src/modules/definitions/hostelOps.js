import {
  useGetHostelComplaintsQuery,
  useUpdateHostelComplaintMutation,
  useGetPayrollSettingsQuery,
  useGetGeofenceSettingsQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';

// hostel.routes.js VIEW_ROLES / WARDEN_ROLES.
const HOSTEL_VIEW = ['Super Admin', 'School Admin', 'Hostel Warden', 'Principal', 'Vice Principal'];
const HOSTEL_ACT = ['Super Admin', 'School Admin', 'Hostel Warden'];
const PAYROLL_ROLES = ['Super Admin', 'School Admin', 'Accountant'];
const SELF_ATTENDANCE_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Accountant'];

const PRIORITY_TONES = { low: 'inactive', medium: 'partial', high: 'pending', urgent: 'overdue' };
const STATUS_TONES = {
  open: 'pending',
  in_progress: 'partial',
  resolved: 'active',
  closed: 'inactive',
  rejected: 'overdue',
};

/**
 * Hostel complaints — a boarder reporting that something is broken.
 *
 * Read-write, and one of the few places where that is clearly right: a warden walking the building
 * finds the broken thing, and marking it fixed on the spot is better than remembering to do it at
 * a desk later. Raising a complaint stays on the web portal for now — that is a student's flow and
 * students do not yet have a hostel complaint entry in their own nav.
 */
export const hostelComplaintsModule = {
  key: 'Complaints',
  title: 'Hostel Complaints',
  icon: 'alert-box-outline',

  servesRole: (ctx) => ctx.is(...HOSTEL_VIEW),
  notForRoleLabel: 'Hostel complaints are handled by the warden and the school office.',

  useList: (ctx, { filter }) => useGetHostelComplaintsQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.complaints ?? (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.description, (row) => row.roomNumber, (row) => row.complaintNo],
  searchPlaceholder: 'Search by room, title or number',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'Being fixed' },
      { value: 'resolved', label: 'Fixed' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const open = rows.filter((row) => row.status === 'open' || row.status === 'in_progress').length;
    // Safety and electrical faults in a building full of sleeping children are not just another
    // open ticket, so they get counted on their own.
    const urgent = rows.filter(
      (row) => row.priority === 'urgent' && row.status !== 'resolved' && row.status !== 'closed'
    ).length;
    return [
      { label: 'Open', value: open, icon: 'alert-box-outline', color: open > 0 ? '#F59E0B' : '#94A3B8' },
      { label: 'Urgent', value: urgent, icon: 'alert-octagon-outline', color: urgent > 0 ? '#EF4444' : '#94A3B8' },
    ];
  },

  row: (row) => ({
    title: row.title,
    subtitle: [row.roomNumber ? `Room ${row.roomNumber}` : null, row.type].filter(Boolean).join(' · '),
    meta: [row.complaintNo, row.createdAt ? timeAgo(row.createdAt) : null].filter(Boolean).join(' · '),
    unread: row.status === 'open',
    badge: row.priority ? { label: row.priority, tone: PRIORITY_TONES[row.priority] } : null,
  }),

  emptyIcon: 'check-circle-outline',
  emptyLabel: 'No hostel complaints',

  detail: {
    title: 'Complaint',
    titleFor: (row) => row.title,
    badgeFor: (row) => ({
      label: String(row.status ?? '').replace('_', ' '),
      tone: STATUS_TONES[row.status],
    }),
    fields: (row) => [
      { label: 'Room', value: row.roomNumber },
      { label: 'Type', value: row.type },
      { label: 'Priority', value: row.priority },
      { label: 'What is wrong', value: row.description },
      { label: 'Complaint number', value: row.complaintNo },
      { label: 'Reported', value: row.createdAt ? formatDate(row.createdAt) : null },
      { label: 'Assigned to', value: row.assignedTo?.name },
      { label: 'How it was fixed', value: row.resolution },
      { label: 'Fixed on', value: row.resolvedAt ? formatDate(row.resolvedAt) : null },
    ],
    actions: [
      {
        key: 'start',
        label: 'Mark as being fixed',
        icon: 'wrench-outline',
        allow: (ctx, row) => ctx.is(...HOSTEL_ACT) && row?.status === 'open',
        useMutation: useUpdateHostelComplaintMutation,
        buildArg: (row) => ({ id: row._id, status: 'in_progress' }),
      },
      {
        key: 'resolve',
        label: 'Mark as fixed',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => ctx.is(...HOSTEL_ACT) && row?.status !== 'resolved' && row?.status !== 'closed',
        useMutation: useUpdateHostelComplaintMutation,
        title: 'Close Complaint',
        submitLabel: 'Mark Fixed',
        // Closing without saying what was done leaves the next warden with nothing — same rule as
        // the discipline and health registers.
        fields: [
          { name: 'resolution', label: 'What was done', type: 'textarea', required: true },
        ],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          status: 'resolved',
          resolution: values.resolution.trim(),
        }),
      },
    ],
  },
};

/** The statutory rules payroll is calculated against. */
export const payrollSettingsModule = {
  key: 'PayrollSettings',
  title: 'Payroll Rules',
  icon: 'cog-outline',

  servesRole: (ctx) => ctx.is(...PAYROLL_ROLES),
  notForRoleLabel: 'Payroll rules are set by the accounts team.',

  useList: () => useGetPayrollSettingsQuery(),
  // The endpoint returns { versions, current }. Versions matter: a payslip was calculated against
  // whichever version was live that month, so the history is the list and `current` is one of them.
  selectRows: (data) => data?.versions ?? (data?.current ? [data.current] : []),
  rowKey: (row) => row._id ?? String(row.version ?? 'current'),

  row: (row) => ({
    title: row.effectiveFrom ? `From ${formatDate(row.effectiveFrom)}` : 'Current rules',
    subtitle: [
      row.pfEnabled ? `PF ${row.pfEmployeeRate ?? ''}%` : 'PF off',
      row.esiEnabled ? `ESI ${row.esiEmployeeRate ?? ''}%` : 'ESI off',
    ]
      .filter(Boolean)
      .join(' · '),
    meta: row.isActive ? 'In force now' : null,
    unread: Boolean(row.isActive),
    badge: row.isActive ? { label: 'active', tone: 'active' } : { label: 'superseded', tone: 'inactive' },
  }),

  emptyIcon: 'cog-off-outline',
  emptyLabel: 'No payroll rules configured yet',
  footerNote: 'Changing these changes what everyone is paid, so it is done on the web portal.',

  detail: {
    title: 'Payroll Rules',
    titleFor: (row) => (row.effectiveFrom ? `From ${formatDate(row.effectiveFrom)}` : 'Payroll rules'),
    badgeFor: (row) => (row.isActive ? { label: 'active', tone: 'active' } : null),
    fields: (row) => [
      { label: 'Effective from', value: row.effectiveFrom ? formatDate(row.effectiveFrom) : null },
      { label: 'PF', value: row.pfEnabled ? `Employee ${row.pfEmployeeRate}% · employer ${row.pfEmployerRate}%` : 'Off' },
      { label: 'PF wage ceiling', value: row.pfWageCeiling ? formatCurrency(row.pfWageCeiling) : null },
      { label: 'ESI', value: row.esiEnabled ? `Employee ${row.esiEmployeeRate}% · employer ${row.esiEmployerRate}%` : 'Off' },
      { label: 'ESI wage ceiling', value: row.esiWageCeiling ? formatCurrency(row.esiWageCeiling) : null },
      { label: 'Professional tax', value: row.professionalTax ? formatCurrency(row.professionalTax) : null },
    ],
  },
};

/**
 * Where the school is, and the radius a self check-in has to fall inside.
 *
 * Worth having on a phone precisely because it explains a rejection: someone told "you are 340m
 * from school" can look up what the radius actually is instead of arguing with the app.
 */
export const geofenceModule = {
  key: 'GeofenceSettings',
  title: 'Check-in Area',
  icon: 'map-marker-radius-outline',

  servesRole: (ctx) => ctx.is(...SELF_ATTENDANCE_ROLES),
  notForRoleLabel: 'Check-in settings are visible to staff who mark their own attendance.',

  useList: () => useGetGeofenceSettingsQuery(),
  // One school document, not a list.
  selectRows: (data) => (data ? [data] : []),
  rowKey: (row) => row._id ?? 'geofence',

  row: (row) => ({
    title: row.name ?? 'This school',
    subtitle: row.location?.geofenceRadius
      ? `Check in within ${row.location.geofenceRadius}m`
      : 'No check-in radius set',
    meta: row.attendanceHours
      ? `${row.attendanceHours.startTime ?? '08:00'} – ${row.attendanceHours.endTime ?? '15:00'}`
      : null,
  }),

  emptyIcon: 'map-marker-off-outline',
  emptyLabel: 'No check-in area configured',

  detail: {
    title: 'Check-in Area',
    titleFor: (row) => row.name ?? 'This school',
    fields: (row) => [
      {
        label: 'Check-in radius',
        value: row.location?.geofenceRadius
          ? `${row.location.geofenceRadius} metres from school`
          : 'Not set — location is not checked',
      },
      {
        label: 'Check-in hours',
        value: row.attendanceHours
          ? `${row.attendanceHours.startTime ?? '08:00'} – ${row.attendanceHours.endTime ?? '15:00'}`
          : null,
      },
      {
        label: 'School coordinates',
        value:
          row.location?.lat != null && row.location?.lng != null
            ? `${row.location.lat}, ${row.location.lng}`
            : 'Not set',
      },
    ],
  },
};
