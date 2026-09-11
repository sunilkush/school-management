import {
  useGetFeeStructuresQuery,
  useGetReimbursementsQuery,
  useGetMyChildrenQuery,
  useGetMyTeacherTimetableQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';

const FINANCE_READ = ['Super Admin', 'School Admin', 'Accountant', 'Principal', 'Vice Principal'];
const TEACHER_ROLES = ['Teacher', 'Class Teacher', 'Subject Coordinator', 'Exam Coordinator', 'Lab Technician'];

/** What each class is charged, per fee head. */
export const feeStructuresModule = {
  key: 'FeeStructures',
  title: 'Fee Structures',
  icon: 'file-table-outline',
  aliases: ['FeeCategories'],

  servesRole: (ctx) => ctx.is(...FINANCE_READ),
  notForRoleLabel: 'Fee structures are set by the accounts team.',

  useList: () => useGetFeeStructuresQuery({}),
  selectRows: (data) => (Array.isArray(data) ? data : data?.structures ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.feeHeadId?.name, (row) => row.schoolClassId?.name],
  searchPlaceholder: 'Search by fee head or class',

  summary: (rows) => {
    if (rows.length === 0) return [];
    return [
      { label: 'Structures', value: rows.length, icon: 'file-table-outline' },
      {
        label: 'Total per term',
        value: rows.reduce((sum, row) => sum + (row.amount || 0), 0),
        format: 'currency',
      },
    ];
  },

  row: (row) => ({
    title: row.feeHeadId?.name ?? 'Fee',
    subtitle: row.schoolClassId?.name,
    meta: [formatCurrency(row.amount || 0), row.frequency].filter(Boolean).join(' · '),
    badge: row.isActive === false ? { label: 'inactive', tone: 'inactive' } : null,
  }),

  emptyIcon: 'file-table-outline',
  emptyLabel: 'No fee structures set up',
  // Changing an amount here does not rewrite bills already assigned — the same rule the
  // scholarship module documents. Saying so avoids a nasty assumption.
  footerNote: 'Fee structures are edited on the web portal. Changing one does not rewrite bills already assigned.',

  detail: {
    title: 'Fee Structure',
    titleFor: (row) => row.feeHeadId?.name ?? 'Fee',
    fields: (row) => [
      { label: 'Class', value: row.schoolClassId?.name },
      { label: 'Academic year', value: row.academicYearId?.name },
      { label: 'Amount', value: formatCurrency(row.amount || 0) },
      { label: 'Charged', value: row.frequency },
    ],
  },
};

const CLAIM_TONES = {
  pending_manager: 'pending',
  pending_finance: 'partial',
  approved: 'active',
  rejected: 'overdue',
  added_to_payroll: 'paid',
};

const CLAIM_LABELS = {
  pending_manager: 'with manager',
  pending_finance: 'with finance',
  approved: 'approved',
  rejected: 'rejected',
  added_to_payroll: 'in payroll',
};

/**
 * Staff expense claims.
 *
 * Read-only. A claim moves manager → finance → payroll, and each approval is a separate act by a
 * different person with the receipt in front of them. Approving from a phone, without the
 * attachment, is approving something you have not seen.
 */
export const reimbursementsModule = {
  key: 'Reimbursements',
  title: 'Reimbursements',
  icon: 'receipt',

  servesRole: (ctx) => ctx.is(...FINANCE_READ),
  notForRoleLabel: 'Expense claims are handled by the accounts team.',

  useList: (ctx, { filter }) => useGetReimbursementsQuery({ status: filter ?? undefined }),
  selectRows: (data) => (Array.isArray(data) ? data : data?.reimbursements ?? []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.description, (row) => row.type, (row) => row.employeeId?.userId?.name],
  searchPlaceholder: 'Search claims',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'pending_manager', label: 'With manager' },
      { value: 'pending_finance', label: 'With finance' },
      { value: 'approved', label: 'Approved' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const waiting = rows.filter((row) => String(row.status).startsWith('pending')).length;
    const value = rows
      .filter((row) => String(row.status).startsWith('pending'))
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    return [
      { label: 'Awaiting a decision', value: waiting, icon: 'clock-outline', color: waiting > 0 ? '#F59E0B' : '#94A3B8' },
      { label: 'Value pending', value, format: 'currency' },
    ];
  },

  row: (row) => ({
    title: row.description || row.type,
    subtitle: row.employeeId?.userId?.name,
    meta: [formatCurrency(row.amount || 0), row.claimDate ? formatDate(row.claimDate) : null]
      .filter(Boolean)
      .join(' · '),
    unread: String(row.status).startsWith('pending'),
    badge: row.status ? { label: CLAIM_LABELS[row.status] ?? row.status, tone: CLAIM_TONES[row.status] } : null,
  }),

  emptyIcon: 'receipt',
  emptyLabel: 'No expense claims',
  footerNote: 'Claims are approved on the web portal, where the receipt can be opened.',

  detail: {
    title: 'Claim',
    titleFor: (row) => row.description || row.type,
    badgeFor: (row) =>
      row.status ? { label: CLAIM_LABELS[row.status] ?? row.status, tone: CLAIM_TONES[row.status] } : null,
    fields: (row) => [
      { label: 'Claimed by', value: row.employeeId?.userId?.name },
      { label: 'Type', value: row.type },
      { label: 'Amount', value: formatCurrency(row.amount || 0) },
      { label: 'Claimed on', value: row.claimDate ? formatDate(row.claimDate) : null },
      { label: 'Details', value: row.description },
      {
        label: 'Receipts',
        // Named, not opened — the app has no file viewer, and a claim approved without seeing the
        // receipt is the thing this screen is trying not to encourage.
        value: row.attachments?.length ? `${row.attachments.length} attached — open on the web portal` : 'None attached',
      },
      { label: 'Rejected because', value: row.rejectionReason },
    ],
  },
};

/** A parent's children — the roster behind every scope picker in the app. */
export const myChildrenModule = {
  key: 'MyChildren',
  title: 'My Children',
  icon: 'account-child-outline',

  servesRole: (ctx) => ctx.is('Parent'),
  notForRoleLabel: 'This is a parent’s own list of their children.',

  useList: () => useGetMyChildrenQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : data?.children ?? []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.name,
    subtitle: [row.className, row.sectionName].filter(Boolean).join(' '),
    meta: row.registrationNumber ? `Reg. ${row.registrationNumber}` : null,
  }),

  emptyIcon: 'account-child-outline',
  emptyLabel: 'No children are linked to your account yet',
  footerNote: 'If a child is missing, the school office links them to your account.',

  detail: {
    title: 'Child',
    titleFor: (row) => row.name,
    fields: (row) => [
      { label: 'Class', value: [row.className, row.sectionName].filter(Boolean).join(' ') },
      { label: 'Registration number', value: row.registrationNumber },
      { label: 'Email', value: row.email },
      { label: 'Date of birth', value: row.dateOfBirth ? formatDate(row.dateOfBirth) : null },
      { label: 'Blood group', value: row.bloodGroup },
    ],
  },
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * A teacher's own teaching schedule as a flat list.
 *
 * The `Timetable` screen (Phase 3) already shows this as day tabs, which is the better way to read
 * it — but "Teacher Timetable" is its own sidebar entry and a whole-week list answers a different
 * question: how many periods am I actually carrying.
 */
export const teacherTimetableModule = {
  key: 'TeacherTimetable',
  title: 'My Teaching Schedule',
  icon: 'timetable',

  servesRole: (ctx) => ctx.is(...TEACHER_ROLES),
  notForRoleLabel: 'This is a teacher’s own schedule.',

  useList: () => useGetMyTeacherTimetableQuery(),
  selectRows: (data) => {
    const rows = Array.isArray(data) ? data : [];
    // Flat list, so sort it into a readable week rather than whatever order it arrived in.
    return [...rows].sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) ||
        (a.timeSlotId?.order ?? 0) - (b.timeSlotId?.order ?? 0)
    );
  },
  rowKey: (row) => row._id,

  searchFields: [(row) => row.subjectId?.name, (row) => row.schoolClassId?.name],
  searchPlaceholder: 'Search by subject or class',

  filter: {
    allLabel: 'Whole week',
    options: DAY_ORDER.slice(0, 6).map((day) => ({ value: day, label: day.slice(0, 3) })),
    apply: (row, value) => row.dayOfWeek === value,
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const days = new Set(rows.map((row) => row.dayOfWeek)).size;
    return [
      { label: 'Periods a week', value: rows.length, icon: 'timetable' },
      { label: 'Teaching days', value: days, icon: 'calendar-week' },
    ];
  },

  row: (row) => ({
    title: row.subjectId?.name ?? row.timeSlotId?.name ?? 'Period',
    subtitle: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' '),
    meta: [
      row.dayOfWeek ? row.dayOfWeek.slice(0, 3) : null,
      row.timeSlotId?.startTime ? `${formatTime(row.timeSlotId.startTime)}` : null,
      row.roomId?.name,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.type === 'substitution' ? { label: 'substitution', tone: 'pending' } : null,
  }),

  emptyIcon: 'timetable',
  emptyLabel: 'No periods scheduled for you',

  detail: {
    title: 'Period',
    titleFor: (row) => row.subjectId?.name ?? 'Period',
    fields: (row) => [
      { label: 'Day', value: row.dayOfWeek },
      {
        label: 'Time',
        value:
          row.timeSlotId?.startTime && row.timeSlotId?.endTime
            ? `${formatTime(row.timeSlotId.startTime)} – ${formatTime(row.timeSlotId.endTime)}`
            : null,
      },
      { label: 'Class', value: [row.schoolClassId?.name, row.sectionId?.name].filter(Boolean).join(' ') },
      { label: 'Room', value: row.roomId?.name },
      { label: 'Note', value: row.note },
    ],
  },
};
