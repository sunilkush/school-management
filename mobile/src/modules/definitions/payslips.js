import { useGetMyPayrollSummaryQuery } from '../../store/api/apiSlice';
import { formatCurrency, formatDate } from '../../utils/format';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PAYMENT_TONES = { paid: 'paid', pending: 'pending', failed: 'overdue', processing: 'partial' };

function periodLabel(row) {
  const month = MONTHS[(row.month ?? 1) - 1] ?? '';
  return `${month} ${row.year ?? ''}`.trim();
}

function breakdownLines(entries) {
  if (!entries) return null;
  // The breakdown is stored as either a keyed object or a list of {label, amount} depending on how
  // the cycle was generated, so both shapes are read rather than assuming one.
  const pairs = Array.isArray(entries)
    ? entries.map((item) => [item.label ?? item.name, item.amount ?? item.value])
    : Object.entries(entries);
  const lines = pairs
    .filter(([, amount]) => Number(amount))
    .map(([label, amount]) => `${label}: ${formatCurrency(amount)}`);
  return lines.length ? lines.join('\n') : null;
}

/**
 * My payslips — what I was paid, and what was taken out.
 *
 * This is the employee's own view (`/payroll/self/summary`), never the school's payroll run. It is
 * one of the few staff modules where a phone genuinely beats the desktop: checking whether this
 * month's salary has gone out, and what the deductions were, is a thirty-second question.
 *
 * Read-only in the strongest sense — there is no action here at all. Payroll is generated, locked
 * and paid by the accounts team through the web portal, and nothing an employee taps should be
 * able to touch that.
 */
export const payslipsModule = {
  key: 'Payroll',
  title: 'My Payslips',
  icon: 'cash-multiple',

  useList: () => useGetMyPayrollSummaryQuery(),
  selectRows: (data) => data?.payslips ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => periodLabel(row)],
  searchPlaceholder: 'Search by month',

  filter: {
    allLabel: 'All',
    options: [
      { value: 'paid', label: 'Paid' },
      { value: 'pending', label: 'Not paid yet' },
    ],
    apply: (row, value) =>
      value === 'paid' ? row.paymentStatus === 'paid' : row.paymentStatus !== 'paid',
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const latest = rows[0];
    const paidThisYear = rows
      .filter((row) => row.year === latest.year && row.paymentStatus === 'paid')
      .reduce((sum, row) => sum + (row.netPay || 0), 0);
    return [
      { label: `Latest (${periodLabel(latest)})`, value: latest.netPay || 0, format: 'currency' },
      { label: `Paid in ${latest.year}`, value: paidThisYear, format: 'currency', color: '#22C55E' },
    ];
  },

  row: (row) => ({
    title: periodLabel(row),
    subtitle: `Net ${formatCurrency(row.netPay || 0)}`,
    meta: [
      row.grossEarnings ? `Gross ${formatCurrency(row.grossEarnings)}` : null,
      row.totalDeductions ? `Deductions ${formatCurrency(row.totalDeductions)}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    unread: row.paymentStatus !== 'paid',
    badge: row.paymentStatus
      ? { label: row.paymentStatus, tone: PAYMENT_TONES[row.paymentStatus] ?? 'inactive' }
      : null,
  }),

  emptyIcon: 'cash-remove',
  emptyLabel: 'No payslips yet',
  // The PDF lives behind /payroll/payslip/:employeeId/:month/:year/download, which needs a file
  // save this app cannot do yet — better to say so than to show a dead button.
  footerNote: 'Downloading the PDF payslip is not available in the app yet — use the web portal.',

  detail: {
    title: 'Payslip',
    titleFor: (row) => periodLabel(row),
    badgeFor: (row) =>
      row.paymentStatus ? { label: row.paymentStatus, tone: PAYMENT_TONES[row.paymentStatus] ?? 'inactive' } : null,
    fields: (row) => [
      { label: 'Net pay', value: formatCurrency(row.netPay || 0) },
      { label: 'Gross earnings', value: formatCurrency(row.grossEarnings || 0) },
      { label: 'Total deductions', value: formatCurrency(row.totalDeductions || 0) },
      { label: 'Earnings', value: breakdownLines(row.earningsBreakdown) },
      { label: 'Deductions', value: breakdownLines(row.deductionsBreakdown) },
      // Days are what a disputed payslip almost always turns on, so they are shown plainly.
      { label: 'Working days', value: row.workingDays != null ? String(row.workingDays) : null },
      { label: 'Present days', value: row.presentDays != null ? String(row.presentDays) : null },
      { label: 'Paid leave', value: row.paidLeaves ? String(row.paidLeaves) : null },
      { label: 'Loss of pay days', value: row.lopDays ? String(row.lopDays) : null },
      { label: 'Paid on', value: row.paidAt ? formatDate(row.paidAt) : null },
      { label: 'Payment mode', value: row.paymentMode },
      { label: 'Reference', value: row.transactionRef },
      // Surfaced rather than hidden — a warning on a payslip is exactly what an employee should
      // raise with accounts, and burying it helps nobody.
      { label: 'Notes from payroll', value: row.warnings?.length ? row.warnings.join('\n') : null },
    ],
  },
};
