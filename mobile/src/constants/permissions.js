// Mirrors frontend/src/components/forms/AddRoleForm.jsx's own curated lists — NOT the same as
// mobile/src/constants/roles.js's ~144-key MODULE_META, which is a UI/nav concept unrelated to
// backend permission.module strings.
export const MODULE_OPTIONS = [
  'Schools', 'Users', 'Teachers', 'Students', 'Parents', 'Classes', 'Subjects', 'Exams',
  'Attendance', 'Finance', 'Settings', 'Fees', 'Reports', 'Hostel', 'Transport', 'Assignments',
  'Timetable', 'Notifications', 'Expenses', 'Library', 'Books', 'IssuedBooks', 'Rooms', 'Routes',
  'Vehicles',
];

// backend/src/models/Roles.model.js's actions enum (9 values) — the web create form only offers 8
// (omits "approve"), included here since the backend genuinely accepts it.
export const ACTION_OPTIONS = ['create', 'read', 'update', 'delete', 'export', 'approve', 'collect', 'return', 'assign'];

// frontend/src/components/forms/AddRoleForm.jsx's roleOptions — a curated 19-name list (excludes
// "Super Admin" and a few others that exist in the backend's defaultPermissions map but aren't
// offered in this picker on web either).
export const ROLE_NAME_OPTIONS = [
  'School Admin', 'Principal', 'Vice Principal', 'Teacher', 'Student', 'Parent', 'Accountant',
  'Staff', 'Librarian', 'Hostel Warden', 'Transport Manager', 'Exam Coordinator', 'Receptionist',
  'IT Support', 'Counselor', 'Subject Coordinator', 'Support Staff', 'Security', 'Driver',
];

export const HIGH_RISK_ACTIONS = new Set(['delete', 'update']);
