// Colors match the web app's fee status pills exactly (frontend/src/pages/Student/Fees/FeeStudent.jsx
// STATUS_CFG) — "late" isn't in that map (the web page never showed it) but is a real
// FeeInstallment.status enum value (backend/src/models/feeInstallment.model.js), so it needs a color too.
export const FEE_STATUS_META = {
  paid: { label: 'Paid', color: '#22C55E', icon: 'check-circle-outline' },
  pending: { label: 'Pending', color: '#F59E0B', icon: 'clock-outline' },
  partial: { label: 'Partial', color: '#0891B2', icon: 'alert-circle-outline' },
  late: { label: 'Late', color: '#EF4444', icon: 'alert-outline' },
};

export function summarizeFees(feeRows = []) {
  const total = feeRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  const paid = feeRows.reduce((sum, row) => sum + (row.paidAmount || 0), 0);
  const due = feeRows.reduce((sum, row) => sum + (row.dueAmount || 0), 0);
  return { total, paid, due };
}
