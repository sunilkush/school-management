import {
  useGetMyFeesSummaryQuery,
  useGetMyEnrollmentQuery,
  useGetMyChildrenQuery,
} from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_TONES = { paid: 'paid', partial: 'partial', pending: 'unpaid' };

/**
 * Fees — what has been billed, what is paid, what is still due.
 *
 * **Read-only, deliberately.** The backend does expose `PUT /student-fees/pay/:id`, and its
 * ownership check does let a Student or Parent call it for their own record — but that endpoint
 * records a *manual* payment (cash/cheque reference), it is not a payment gateway. Putting it
 * behind a button in a parent's app would let a family clear their own dues without any money
 * moving. Actual online payment goes through the separate FeeInstallment/Razorpay flow, which is
 * its own bespoke screen and is not this list.
 *
 * The id trap: this endpoint wants **Student._id**, while the `/child/:childId/…` routes used by
 * Homework and Attendance want the child's **User._id**. Same picker, opposite id — so the scope
 * here maps `child._id` and those map `child.userId`.
 */
export const feesModule = {
  key: 'Fees',
  title: 'Fees',
  icon: 'credit-card-outline',

  // School Admin also has a "Fees" nav entry, but for them it means the school's whole fee ledger,
  // not one family's bill — and both endpoints behind this descriptor are gated to Student/Parent
  // anyway, so an admin landing here would only collect 403s.
  servesRole: (ctx) => ctx.is('Student', 'Parent'),
  notForRoleLabel: 'This is the family view of a student’s own fees. The school-wide fee ledger is a separate screen, coming in Phase 6.',

  scope: {
    activeFor: (ctx) => ctx.is('Parent'),
    useOptions: (ctx) => useGetMyChildrenQuery(undefined, { skip: !ctx.is('Parent') }),
    // Student._id here — NOT userId. See the note above.
    selectOptions: (data) => (data ?? []).map((child) => ({ value: child._id, label: child.name })),
    emptyLabel: 'No children are linked to your account yet',
  },

  useList: (ctx, { scope }) => {
    const isParent = ctx.is('Parent');
    // A Student has to look up their own Student._id first — the fee endpoint identifies them by
    // it and the session only carries a User id.
    const enrollment = useGetMyEnrollmentQuery(undefined, { skip: isParent });
    const studentId = isParent ? scope : enrollment.data?.studentId;
    const fees = useGetMyFeesSummaryQuery({ studentId }, { skip: !studentId });

    // While the id lookup is still in flight there is nothing to show yet — surface that as
    // loading rather than as an empty fee list, which would read as "you owe nothing".
    if (!isParent && enrollment.isLoading) return { ...fees, isLoading: true };
    if (!isParent && enrollment.isError) return { ...enrollment, data: undefined };
    return fees;
  },
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  searchFields: [(row) => row.feeStructureId?.name, (row) => row.feeStructureId?.feeHeadId?.name],
  searchPlaceholder: 'Search fees',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'due', label: 'Still due' },
      { value: 'paid', label: 'Paid' },
    ],
    apply: (row, value) => (value === 'paid' ? row.status === 'paid' : row.status !== 'paid'),
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const total = rows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
    const paid = rows.reduce((sum, row) => sum + (row.paidAmount || 0), 0);
    const due = rows.reduce((sum, row) => sum + (row.dueAmount || 0), 0);
    return [
      { label: 'Total billed', value: total, format: 'currency' },
      { label: 'Paid', value: paid, format: 'currency', color: '#22C55E' },
      { label: 'Still due', value: due, format: 'currency', color: due > 0 ? '#EF4444' : '#94A3B8' },
    ];
  },

  row: (row) => ({
    title: row.feeStructureId?.name ?? row.feeStructureId?.feeHeadId?.name ?? 'Fee',
    subtitle: row.academicYearId?.name,
    meta: `${formatCurrency(row.paidAmount || 0)} paid of ${formatCurrency(row.totalAmount || 0)}`,
    unread: row.status !== 'paid',
    badge: { label: row.status, tone: STATUS_TONES[row.status] },
  }),

  emptyIcon: 'credit-card-off-outline',
  emptyLabel: 'No fees have been assigned yet',
  footerNote: 'To pay, use the school office or the web portal — in-app payment is not available yet.',

  detail: {
    title: 'Fee',
    titleFor: (row) => row.feeStructureId?.name ?? 'Fee',
    badgeFor: (row) => ({ label: row.status, tone: STATUS_TONES[row.status] }),
    fields: (row) => [
      { label: 'Fee head', value: row.feeStructureId?.feeHeadId?.name },
      { label: 'Academic year', value: row.academicYearId?.name },
      { label: 'Total amount', value: formatCurrency(row.totalAmount || 0) },
      { label: 'Discount applied', value: row.discountApplied ? formatCurrency(row.discountApplied) : null },
      { label: 'Paid so far', value: formatCurrency(row.paidAmount || 0) },
      { label: 'Still due', value: formatCurrency(row.dueAmount || 0) },
      {
        label: 'Last payment',
        value: row.lastPayment?.paidAt
          ? `${formatCurrency(row.lastPayment.amount || 0)} on ${formatDate(row.lastPayment.paidAt)}`
          : null,
      },
      { label: 'Reference', value: row.lastPayment?.referenceNo },
    ],
  },
};
