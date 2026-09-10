// backend Income/Expense.model.js paymentMode enum: ["cash","cheque","bank_transfer","upi","online","dd"]
const PAYMENT_MODE_LABELS = {
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  online: 'Online',
  dd: 'DD',
};

export function paymentModeLabel(mode) {
  return PAYMENT_MODE_LABELS[mode] ?? mode ?? '—';
}

// backend/src/models/Income.model.js category enum (15 values).
export const INCOME_CATEGORIES = [
  'Tuition Fee', 'Admission Fee', 'Registration Fee', 'Transport Income', 'Hostel Income',
  'Exam Income', 'Library Income', 'Sports Income', 'Canteen Income', 'Donation',
  'Grant', 'Sponsorship', 'Rental Income', 'Interest Income', 'Miscellaneous',
];

// backend/src/models/Expense.model.js category enum (20 values).
export const EXPENSE_CATEGORIES = [
  'Staff Salary', 'Teacher Salary', 'Contract Salary', 'Utility Bills', 'Rent', 'Internet',
  'Software Subscription', 'Stationery', 'Maintenance', 'Library Purchase', 'Laboratory Equipment',
  'Transportation Cost', 'Event Expense', 'Marketing', 'Insurance', 'Legal & Professional',
  'Printing', 'Cleaning', 'Canteen Expense', 'Miscellaneous',
];

export const PAYMENT_MODES = ['cash', 'cheque', 'bank_transfer', 'upi', 'online', 'dd'];

// backend/src/models/Expense.model.js status enum.
export const EXPENSE_STATUS_META = {
  pending: { label: 'Pending', color: '#F59E0B' },
  approved: { label: 'Approved', color: '#2563EB' },
  paid: { label: 'Paid', color: '#22C55E' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};
