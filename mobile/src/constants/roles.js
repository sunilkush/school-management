// Exact role.name strings as seeded/used by the backend (backend/src/controllers/role.controllers.js
// defaultPermissions map, backend/src/seed.js). These are Title Case with spaces — never snake_case.
export const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  ACCOUNTANT: 'Accountant',
  LIBRARIAN: 'Librarian',
  HOSTEL_WARDEN: 'Hostel Warden',
  TRANSPORT_MANAGER: 'Transport Manager',
  RECEPTIONIST: 'Receptionist',
};

// Label + icon (MaterialCommunityIcons) for every permission module string the backend actually
// uses (backend/src/controllers/role.controllers.js:22-156), plus the two virtual, always-visible
// destinations (Dashboard, Profile) that aren't real permission modules.
export const MODULE_META = {
  Dashboard: { label: 'Dashboard', icon: 'view-dashboard-outline' },
  Schools: { label: 'Schools', icon: 'domain' },
  Users: { label: 'Users', icon: 'account-group-outline' },
  Students: { label: 'Students', icon: 'school-outline' },
  Teachers: { label: 'Teachers', icon: 'account-tie-outline' },
  Parents: { label: 'Parents', icon: 'account-child-outline' },
  Classes: { label: 'Classes', icon: 'google-classroom' },
  Subjects: { label: 'Subjects', icon: 'book-open-variant' },
  Timetable: { label: 'Timetable', icon: 'calendar-clock-outline' },
  Exams: { label: 'Exams', icon: 'pencil-box-outline' },
  Assignments: { label: 'Homework', icon: 'clipboard-text-outline' },
  Attendance: { label: 'Attendance', icon: 'clipboard-check-outline' },
  Fees: { label: 'Fees', icon: 'cash-multiple' },
  Finance: { label: 'Finance', icon: 'finance' },
  Expenses: { label: 'Expenses', icon: 'receipt-text-outline' },
  Reports: { label: 'Reports', icon: 'chart-box-outline' },
  Settings: { label: 'Settings', icon: 'cog-outline' },
  Books: { label: 'Catalog', icon: 'book-outline' },
  IssuedBooks: { label: 'Issued Books', icon: 'book-arrow-right-outline' },
  Library: { label: 'Library', icon: 'bookshelf' },
  Hostel: { label: 'Hostel', icon: 'home-city-outline' },
  Rooms: { label: 'Rooms', icon: 'door' },
  Transport: { label: 'Transport', icon: 'bus-school' },
  Routes: { label: 'Routes', icon: 'map-marker-path' },
  Vehicles: { label: 'Vehicles', icon: 'bus' },
  Notifications: { label: 'Notices', icon: 'bell-outline' },
  Inventory: { label: 'Inventory', icon: 'archive-outline' },
  Messages: { label: 'Messages', icon: 'email-outline' },
  Leave: { label: 'Leave', icon: 'calendar-clock-outline' },
  Payroll: { label: 'Payroll', icon: 'cash-multiple' },
  Events: { label: 'Events', icon: 'calendar-outline' },
  Profile: { label: 'Profile', icon: 'account-circle-outline' },
};

/**
 * Curated nav item lists for the 11 roles named in the product brief, each grounded in that
 * role's actual `defaultPermissions` entry in role.controllers.js — not guessed. `module` must
 * match a real permissions module string so resolveRoleNav.js can filter items a School Admin has
 * since revoked. Every role renders as bottom tabs (see resolveRoleNav.js/TabShell.js) — beyond 5
 * items the extras collapse into a single "More" tab rather than a side drawer, matching the web
 * app's own mobile nav (frontend/src/components/mobile/BottomNav.jsx).
 *
 * Any role.name NOT in this map (custom roles, or ones the brief named that aren't reliably
 * modeled server-side — e.g. "HR" only appears in one ad-hoc controller check and has no seeded
 * permissions template) falls back to a dynamic nav built straight from that user's own
 * `permissions[]` — see resolveRoleNav.js.
 */
export const NAV_CONFIG = {
  [ROLE_NAMES.SUPER_ADMIN]: {
    unrestricted: true, // platform owner; bypasses the module filter same as buildSchoolAccessFilter does server-side
    items: ['Dashboard', 'Schools', 'Users', 'Reports', 'Messages', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.SCHOOL_ADMIN]: {
    items: ['Dashboard', 'Students', 'Teachers', 'Parents', 'Classes', 'Subjects', 'Timetable', 'Exams', 'Reports', 'Messages', 'Leave', 'Events', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.PRINCIPAL]: {
    items: ['Dashboard', 'Students', 'Teachers', 'Timetable', 'Exams', 'Reports', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.VICE_PRINCIPAL]: {
    items: ['Dashboard', 'Students', 'Teachers', 'Timetable', 'Reports', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.TEACHER]: {
    items: ['Dashboard', 'Attendance', 'Assignments', 'Timetable', 'Exams', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.STUDENT]: {
    // Attendance is always visible here even though "Student" has no explicit "Attendance" entry
    // in the backend's defaultPermissions template — GET /attendance/my is gated by role name
    // (MY_ATTENDANCE_ROLES) server-side, not by the granular permissions module array, so the
    // module-based filter in resolveRoleNav.js would otherwise hide a tab the API actually allows.
    items: ['Dashboard', 'Timetable', 'Attendance', 'Assignments', 'Exams', 'Messages', 'Leave', 'Events', 'Notifications', 'Profile'],
    alwaysVisibleExtra: ['Attendance'],
  },
  [ROLE_NAMES.PARENT]: {
    items: ['Dashboard', 'Students', 'Attendance', 'Fees', 'Exams', 'Messages', 'Leave', 'Events', 'Notifications', 'Profile'],
    alwaysVisibleExtra: ['Attendance'],
  },
  [ROLE_NAMES.ACCOUNTANT]: {
    items: ['Dashboard', 'Fees', 'Finance', 'Expenses', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.LIBRARIAN]: {
    items: ['Dashboard', 'Books', 'IssuedBooks', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.HOSTEL_WARDEN]: {
    items: ['Dashboard', 'Hostel', 'Rooms', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.TRANSPORT_MANAGER]: {
    items: ['Dashboard', 'Routes', 'Vehicles', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
  [ROLE_NAMES.RECEPTIONIST]: {
    items: ['Dashboard', 'Students', 'Users', 'Messages', 'Leave', 'Payroll', 'Notifications', 'Profile'],
  },
};
