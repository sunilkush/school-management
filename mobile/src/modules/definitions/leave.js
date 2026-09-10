import {
  useGetMyLeaveRequestsQuery,
  useGetLeaveRequestsForSchoolQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';
import { APPROVAL_TONES } from '../tone';

// backend/src/routes/leaveRequest.routes.js gates the school-wide list and approve/reject on these
// role names. Everyone else — every other staff role, Student, Parent — only ever sees /my.
const APPROVER_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];

/**
 * LeaveRequest.model.js's `role` enum is snake_case ("class_teacher"), while role.name everywhere
 * else in the system is Title Case ("Class Teacher"). The backend requires this field from the
 * client and does not derive it, so the conversion has to happen here.
 *
 * Note "Super Admin" has no enum member — a platform-level account cannot file school leave. The
 * form is hidden for that role rather than letting the request 400 after the user fills it in.
 */
function roleEnumFor(roleName) {
  return roleName ? roleName.toLowerCase().replace(/\s+/g, '_') : null;
}

const LEAVE_ENUM_ROLES = new Set([
  'student', 'teacher', 'staff', 'support_staff', 'accountant', 'librarian', 'receptionist',
  'it_support', 'counselor', 'security', 'hostel_warden', 'transport_manager', 'principal',
  'vice_principal', 'subject_coordinator', 'exam_coordinator', 'school_admin', 'class_teacher',
  'sports_teacher', 'lab_technician', 'medical_officer', 'driver',
]);

/** Inclusive day count, the same arithmetic the approver sees on the web form. */
function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

/**
 * Pilot module #2 — proves three things the engine has to handle: a list whose SOURCE depends on
 * the caller's role, a create form, and record actions that change state (one of which needs its
 * own input before it can fire).
 */
export const leaveModule = {
  key: 'Leave',
  title: 'Leave',
  icon: 'calendar-account-outline',

  // Both hooks are always called — RTK Query's `skip` decides which one actually issues a request,
  // which keeps hook order stable while never firing the request the caller's role would 403 on.
  useList: (ctx, { filter }) => {
    const isApprover = ctx.is(...APPROVER_ROLES);
    const mine = useGetMyLeaveRequestsQuery({ status: filter ?? undefined }, { skip: isApprover });
    const school = useGetLeaveRequestsForSchoolQuery({ status: filter ?? undefined }, { skip: !isApprover });
    return isApprover ? school : mine;
  },
  // GET /leave-requests/my returns a bare array; GET /leave-requests wraps it as { requests, … }.
  selectRows: (data) => (Array.isArray(data) ? data : data?.requests ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.reason, (row) => row.userId?.name, (row) => row.leaveType],
  searchPlaceholder: 'Search by reason or person',

  filter: {
    server: true, // both endpoints accept ?status=
    allLabel: 'All',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ],
  },

  row: (row, ctx) => ({
    // On the approver's school-wide list the person matters most; on your own list it is redundant.
    title: ctx.is(...APPROVER_ROLES) ? row.userId?.name ?? 'Leave request' : `${row.leaveType} leave`,
    subtitle: row.reason,
    meta: `${formatDate(row.startDate)} – ${formatDate(row.endDate)} · ${row.totalDays} day${row.totalDays === 1 ? '' : 's'}`,
    badge: { label: row.status, tone: APPROVAL_TONES[row.status] },
  }),

  emptyIcon: 'calendar-blank-outline',
  emptyLabel: 'No leave requests',

  detail: {
    title: 'Leave Request',
    titleFor: (row) => `${row.leaveType} leave`,
    badgeFor: (row) => ({ label: row.status, tone: APPROVAL_TONES[row.status] }),
    fields: (row) => [
      { label: 'Applicant', value: row.userId?.name },
      { label: 'From', value: formatDate(row.startDate) },
      { label: 'To', value: formatDate(row.endDate) },
      { label: 'Total days', value: String(row.totalDays ?? '') },
      { label: 'Reason', value: row.reason },
      { label: 'Approved by', value: row.approvedBy?.name },
      { label: 'Rejection reason', value: row.rejectionReason },
    ],
    actions: [
      {
        key: 'approve',
        label: 'Approve',
        icon: 'check',
        tone: 'primary',
        allow: (ctx, row) => ctx.is(...APPROVER_ROLES) && row.status === 'pending',
        useMutation: useApproveLeaveRequestMutation,
        buildArg: (row) => row._id,
      },
      {
        key: 'reject',
        label: 'Reject',
        icon: 'close',
        tone: 'danger',
        allow: (ctx, row) => ctx.is(...APPROVER_ROLES) && row.status === 'pending',
        useMutation: useRejectLeaveRequestMutation,
        // The backend stores this reason on the record and shows it back to the applicant, so it
        // has to be collected rather than defaulted.
        title: 'Reject Leave',
        submitLabel: 'Reject Request',
        fields: [
          { name: 'rejectionReason', label: 'Reason for rejection', type: 'textarea', required: true },
        ],
        buildArg: (row, ctx, values) => ({ id: row._id, rejectionReason: values.rejectionReason.trim() }),
      },
      {
        key: 'cancel',
        label: 'Cancel Request',
        icon: 'trash-can-outline',
        tone: 'danger',
        confirm: true,
        confirmLabel: 'this leave request',
        // Only your own, and only while nobody has acted on it yet.
        allow: (ctx, row) => !ctx.is(...APPROVER_ROLES) && row.status === 'pending',
        useMutation: useCancelLeaveRequestMutation,
        buildArg: (row) => row._id,
      },
    ],
  },

  create: {
    title: 'Apply for Leave',
    label: 'Apply',
    submitLabel: 'Submit Request',
    allow: (ctx) => LEAVE_ENUM_ROLES.has(roleEnumFor(ctx.roleName)),
    useMutation: useCreateLeaveRequestMutation,
    fields: [
      {
        name: 'leaveType',
        label: 'Leave type',
        type: 'select',
        initial: 'casual',
        required: true,
        options: [
          { value: 'casual', label: 'Casual' },
          { value: 'sick', label: 'Sick' },
          { value: 'paid', label: 'Paid' },
          { value: 'emergency', label: 'Emergency' },
          { value: 'other', label: 'Other' },
        ],
      },
      { name: 'startDate', label: 'From', type: 'date', required: true },
      { name: 'endDate', label: 'To', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why do you need this leave?' },
    ],
    validate: (values) => {
      if (!values.startDate || !values.endDate) return {};
      return daysBetween(values.startDate, values.endDate) < 1
        ? { endDate: 'The end date cannot be before the start date' }
        : {};
    },
    buildPayload: (values, ctx) => ({
      role: roleEnumFor(ctx.roleName),
      leaveType: values.leaveType,
      startDate: values.startDate,
      endDate: values.endDate,
      totalDays: daysBetween(values.startDate, values.endDate),
      reason: values.reason.trim(),
    }),
  },
};
