// backend/src/models/LeaveRequest.model.js status enum.
export const LEAVE_STATUS_META = {
  pending: { label: 'Pending', color: '#F59E0B' },
  approved: { label: 'Approved', color: '#22C55E' },
  rejected: { label: 'Rejected', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#94A3B8' },
};

// backend/src/models/LeaveRequest.model.js leaveType enum.
export const LEAVE_TYPES = ['sick', 'casual', 'paid', 'emergency', 'other'];

// backend/src/models/LeaveRequest.model.js role enum — snake_case, distinct from this app's own
// Title Case role.name strings (mobile/src/constants/roles.js ROLE_NAMES), so a request's `role`
// field has to be translated on the way out.
const ROLE_TO_LEAVE_ROLE = {
  Student: 'student',
  Teacher: 'teacher',
  Accountant: 'accountant',
  Librarian: 'librarian',
  Receptionist: 'receptionist',
  'Hostel Warden': 'hostel_warden',
  'Transport Manager': 'transport_manager',
  Principal: 'principal',
  'Vice Principal': 'vice_principal',
  'School Admin': 'school_admin',
};

export function leaveRoleFor(roleName) {
  return ROLE_TO_LEAVE_ROLE[roleName] ?? 'staff';
}

/** Inclusive day count between two YYYY-MM-DD strings, or null if either is invalid/out of order. */
export function inclusiveDayCount(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}
