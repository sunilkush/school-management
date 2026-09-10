// backend PayrollEntry.paymentStatus — used loosely across the payroll domain; these are the
// values getMyPayrollSummary actually surfaces.
export const PAYMENT_STATUS_META = {
  paid: { label: 'Paid', color: '#22C55E' },
  pending: { label: 'Pending', color: '#F59E0B' },
  processing: { label: 'Processing', color: '#2563EB' },
  failed: { label: 'Failed', color: '#EF4444' },
};

export function paymentStatusMeta(status) {
  return PAYMENT_STATUS_META[status?.toLowerCase()] ?? { label: status ?? 'Unknown', color: '#94A3B8' };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(month) {
  return MONTH_NAMES[(Number(month) || 1) - 1] ?? String(month);
}
