export const HOMEWORK_STATUS_META = {
  submitted: { label: 'Submitted', color: '#22C55E', icon: 'check-circle-outline' },
  overdue: { label: 'Overdue', color: '#EF4444', icon: 'alert-outline' },
  pending: { label: 'Pending', color: '#F59E0B', icon: 'clock-outline' },
};

/** Status is derived client-side (submission presence + dueDate vs now) — the backend doesn't
 * compute or store one. */
export function homeworkStatus(item, now = new Date()) {
  if (item?.submission) return 'submitted';
  if (item?.dueDate && new Date(item.dueDate) < now) return 'overdue';
  return 'pending';
}
