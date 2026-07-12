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

// Label + icon (MaterialCommunityIcons) for every nav destination used below. Beyond the handful
// of real permission module strings the backend uses, this now also covers every leaf item from
// the web app's own frontend/src/config/sidebar.config.js, flattened out of its submenus — so
// each role's "More" menu lists the exact same destinations as that role's web sidebar. Anything
// without a mobile screen yet still gets a working nav entry; screenForModule.js falls back to
// ModulePlaceholderScreen for any key not in its SCREEN_MAP, so tapping one is always safe.
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

  // ── Super Admin ──
  SchoolReports: { label: 'School Reports', icon: 'chart-box-outline' },
  SubscriptionPlans: { label: 'Subscription Plans', icon: 'credit-card-outline' },
  PaymentHistory: { label: 'Payment History', icon: 'cash-check' },
  Revenue: { label: 'Revenue', icon: 'chart-line' },
  RevenueAnalytics: { label: 'Revenue Analytics', icon: 'chart-areaspline' },
  SchoolAdmins: { label: 'School Admins', icon: 'account-tie-outline' },
  StaffUsers: { label: 'Staff', icon: 'account-group-outline' },
  Accountants: { label: 'Accountants', icon: 'calculator-variant-outline' },
  Librarians: { label: 'Librarians', icon: 'bookshelf' },
  TransportUsers: { label: 'Transport Users', icon: 'bus' },
  ClassSections: { label: 'Class Sections', icon: 'view-grid-outline' },
  AcademicYears: { label: 'Academic Years', icon: 'calendar-range-outline' },
  Boards: { label: 'Boards', icon: 'certificate-outline' },
  BoardClasses: { label: 'Board Classes', icon: 'certificate-outline' },
  ChaptersTopics: { label: 'Chapters & Topics', icon: 'format-list-bulleted' },
  AttendanceDashboard: { label: 'Attendance Dashboard', icon: 'view-dashboard-outline' },
  MarkAttendance: { label: 'Mark Attendance', icon: 'clipboard-check-outline' },
  AttendanceTable: { label: 'Attendance Table', icon: 'table' },
  MonthlyReport: { label: 'Monthly Report', icon: 'calendar-month-outline' },
  SchoolWiseReports: { label: 'School Wise Reports', icon: 'domain' },
  FinanceSummary: { label: 'Finance Summary', icon: 'finance' },
  AcademicReports: { label: 'Academic Reports', icon: 'school-outline' },
  // Distinct key from Principal's 'AcademicReports' (a per-student exam-attempt report) — Super
  // Admin's own "Academic Reports" web page is a totally different component (platform-wide
  // student/teacher/subject/exam/school counts), a naming collision on the web app itself that
  // would have silently shown the wrong screen if both roles shared one mobile key.
  PlatformAcademicSummary: { label: 'Academic Reports', icon: 'school-outline' },
  PlatformUsage: { label: 'Platform Usage', icon: 'chart-bar' },
  ActivityLogs: { label: 'Activity Logs', icon: 'history' },
  FeeCategories: { label: 'Fee Categories', icon: 'tag-outline' },
  Departments: { label: 'Departments', icon: 'office-building-outline' },
  Designations: { label: 'Designations', icon: 'badge-account-outline' },
  GlobalConfig: { label: 'Global Config', icon: 'earth' },
  Roles: { label: 'Roles', icon: 'shield-account-outline' },
  Permissions: { label: 'Permissions', icon: 'lock-outline' },
  PlatformModules: { label: 'Modules', icon: 'view-module' },
  SystemBackup: { label: 'System Backup', icon: 'backup-restore' },
  AuditLogs: { label: 'Audit Logs', icon: 'file-search-outline' },
  SupportTickets: { label: 'Support Tickets', icon: 'help-circle-outline' },
  Documentation: { label: 'Documentation', icon: 'file-document-outline' },
  ContactSupport: { label: 'Contact Support', icon: 'phone-outline' },
  Faqs: { label: 'FAQs', icon: 'comment-question-outline' },

  // ── School Admin ──
  SchoolSetup: { label: 'School Setup', icon: 'domain' },
  StudentAdmission: { label: 'Student Admission', icon: 'account-plus-outline' },
  AdmissionInquiries: { label: 'Admission Inquiries', icon: 'comment-question-outline' },
  StudentPromotion: { label: 'Student Promotion', icon: 'arrow-up-bold-box-outline' },
  CreateUser: { label: 'Create User', icon: 'account-plus-outline' },
  ClassTeacherAssignments: { label: 'Class Teacher Assignments', icon: 'account-tie-outline' },
  TeacherTimetable: { label: 'Teacher Timetable', icon: 'calendar-account-outline' },
  CreateExam: { label: 'Create Exam', icon: 'file-document-edit-outline' },
  ExamSchedule: { label: 'Exam Schedule', icon: 'calendar-clock-outline' },
  PaperBuilder: { label: 'Paper Builder', icon: 'file-edit-outline' },
  AdmitCard: { label: 'Admit Card', icon: 'card-account-details-outline' },
  SeatPlan: { label: 'Seat Plan', icon: 'view-grid-outline' },
  GradeEntry: { label: 'Grade Entry', icon: 'clipboard-edit-outline' },
  ExamAnalytics: { label: 'Analytics', icon: 'chart-bar' },
  ExamReports: { label: 'Exam Reports', icon: 'file-chart-outline' },
  StudentAttendance: { label: 'Student Attendance', icon: 'account-check-outline' },
  TeacherAttendance: { label: 'Teacher Attendance', icon: 'account-check-outline' },
  StaffAttendance: { label: 'Staff Attendance', icon: 'account-check-outline' },
  AttendanceReports: { label: 'Attendance Reports', icon: 'file-chart-outline' },
  AttendanceAnalytics: { label: 'Attendance Analytics', icon: 'chart-bar' },
  GeofenceSettings: { label: 'Geofence Settings', icon: 'map-marker-radius-outline' },
  FeeCollection: { label: 'Fee Collection', icon: 'cash-multiple' },
  FeeStructures: { label: 'Fee Structures', icon: 'file-table-outline' },
  AssignFees: { label: 'Assign Fees', icon: 'cash-plus' },
  TransportAssignments: { label: 'Assignments', icon: 'clipboard-check-outline' },
  CreateEmployee: { label: 'Create Employee', icon: 'account-plus-outline' },
  SalaryStructures: { label: 'Salary Structures', icon: 'file-table-outline' },
  MonthlyRun: { label: 'Monthly Run', icon: 'cash-sync' },
  PayslipCenter: { label: 'Payslip Center', icon: 'file-document-outline' },
  PayrollMonthlyReports: { label: 'Monthly Reports', icon: 'file-chart-outline' },
  SalaryAdvance: { label: 'Salary Advance', icon: 'cash-fast' },
  BonusIncentives: { label: 'Bonus & Incentives', icon: 'gift-outline' },
  Reimbursements: { label: 'Reimbursements', icon: 'cash-refund' },
  Communication: { label: 'Communication', icon: 'message-text-outline' },
  TaskManagement: { label: 'Task Management', icon: 'format-list-checks' },
  SchoolSettings: { label: 'School Settings', icon: 'cog-outline' },

  // ── Teacher ──
  AssignedClasses: { label: 'Assigned Classes', icon: 'google-classroom' },
  SubjectResources: { label: 'Subject Resources', icon: 'folder-outline' },
  LessonPlans: { label: 'Lesson Plans', icon: 'notebook-outline' },
  StudentMonthlyReport: { label: 'Student Monthly Report', icon: 'file-chart-outline' },
  MyDailyAttendance: { label: 'My Daily Attendance', icon: 'clock-check-outline' },
  MyMonthlyReport: { label: 'My Monthly Report', icon: 'calendar-month-outline' },
  GpsCheckInOut: { label: 'GPS Check-In/Out', icon: 'map-marker-outline' },
  QuestionBank: { label: 'Question Bank', icon: 'help-box-outline' },
  Evaluation: { label: 'Evaluation', icon: 'clipboard-check-multiple-outline' },
  MyTasks: { label: 'My Tasks', icon: 'format-list-checks' },

  // ── Student / Parent ──
  Grades: { label: 'Grades', icon: 'file-check-outline' },
  StudyMaterials: { label: 'Study Materials', icon: 'book-open-variant' },
  AcademicCalendar: { label: 'Academic Calendar', icon: 'calendar-month-outline' },
  MyChildren: { label: 'My Children', icon: 'account-child-outline' },
  ProgressReport: { label: 'Progress Report', icon: 'chart-line' },

  // ── Accountant ──
  FeeReports: { label: 'Fee Reports', icon: 'file-chart-outline' },
  Income: { label: 'Income', icon: 'cash-plus' },
  SalaryRun: { label: 'Salary Run', icon: 'cash-multiple' },
  MyAttendance: { label: 'My Attendance', icon: 'clock-outline' },

  // ── Librarian ──
  BookCatalog: { label: 'Book Catalog', icon: 'book-outline' },
  Members: { label: 'Members', icon: 'account-group-outline' },
  FineManagement: { label: 'Fine Management', icon: 'cash-remove' },
  LibrarySettings: { label: 'Library Settings', icon: 'cog-outline' },
  RoleWorkspace: { label: 'Role Workspace', icon: 'clipboard-text-outline' },

  // ── Hostel Warden ──
  Allocations: { label: 'Allocations', icon: 'account-group-outline' },
  VisitorLog: { label: 'Visitor Log', icon: 'account-plus-outline' },
  Complaints: { label: 'Complaints', icon: 'message-alert-outline' },

  // ── Transport Manager ──
  Drivers: { label: 'Drivers', icon: 'account-tie-outline' },
  FuelMaintenance: { label: 'Fuel & Maintenance', icon: 'wrench-outline' },

  // ── Receptionist ──
  VisitorManagement: { label: 'Visitor Management', icon: 'account-plus-outline' },
  Enquiries: { label: 'Enquiries', icon: 'comment-question-outline' },
  PhoneCallsLog: { label: 'Phone Calls Log', icon: 'phone-outline' },
  Broadcasts: { label: 'Broadcasts', icon: 'bullhorn-outline' },
};

/**
 * Per-role nav item lists — one-to-one with that role's section in the web app's own
 * frontend/src/config/sidebar.config.js, including its submenu groupings (a plain string is a
 * leaf destination; `{ group, icon, items }` is a submenu, rendered as its own nested "folder"
 * screen — see GroupMenuScreen.jsx — exactly mirroring which items are grouped on the web
 * sidebar). Every role is `unrestricted` because the web sidebar itself is keyed purely by role
 * name, not filtered against the granular permissions array — matching that exactly means this
 * list always renders in full for the role it belongs to, same as it does on the web app.
 */
export const NAV_CONFIG = {
  [ROLE_NAMES.SUPER_ADMIN]: {
    unrestricted: true,
    items: [
      'Dashboard',
      { group: 'Schools', icon: 'domain', items: ['Schools', 'SchoolReports'] },
      { group: 'Subscription & Billing', icon: 'credit-card-outline', items: ['SubscriptionPlans', 'PaymentHistory', 'Revenue', 'RevenueAnalytics'] },
      { group: 'Users', icon: 'account-group-outline', items: ['SchoolAdmins', 'Teachers', 'StaffUsers', 'Students', 'Parents', 'Accountants', 'Librarians', 'TransportUsers'] },
      { group: 'Academics', icon: 'book-open-variant', items: ['Classes', 'ClassSections', 'Subjects', 'AcademicYears', 'Boards', 'BoardClasses', 'ChaptersTopics'] },
      { group: 'Attendance', icon: 'clipboard-check-outline', items: ['AttendanceDashboard', 'MarkAttendance', 'AttendanceTable', 'MonthlyReport'] },
      { group: 'Reports & Analytics', icon: 'chart-box-outline', items: ['Reports', 'SchoolWiseReports', 'FinanceSummary', 'PlatformAcademicSummary', 'PlatformUsage', 'ActivityLogs'] },
      { group: 'Master Configurations', icon: 'cog-outline', items: ['FeeCategories', 'Departments', 'Designations', 'GlobalConfig'] },
      { group: 'System Control', icon: 'cog-outline', items: ['Roles', 'Permissions', 'PlatformModules', 'SystemBackup', 'AuditLogs', 'Settings'] },
      { group: 'Support Center', icon: 'help-circle-outline', items: ['SupportTickets', 'Documentation', 'ContactSupport', 'Faqs'] },
      { group: 'Communication', icon: 'message-text-outline', items: ['Messages', 'Notifications'] },
      'Profile',
    ],
  },
  [ROLE_NAMES.SCHOOL_ADMIN]: {
    unrestricted: true,
    items: [
      'Dashboard', 'SchoolSetup',
      { group: 'Users', icon: 'account-group-outline', items: ['StudentAdmission', 'AdmissionInquiries', 'Students', 'StudentPromotion', 'Parents', 'Teachers', 'CreateUser'] },
      // Timetable's own tabs already cover Time Slots and Rooms (see SchoolAdminTimetableView.jsx),
      // so those two web sidebar entries aren't repeated here as separate destinations — and
      // 'Rooms' specifically must NOT be reused, since that key already resolves to the unrelated
      // Hostel rooms screen elsewhere in this same app. 'Calendar' is dropped too — EventsScreen's
      // SchoolAdminEventsView already covers it, so 'Events' alone is enough.
      { group: 'Academics', icon: 'book-open-variant', items: ['Classes', 'ClassTeacherAssignments', 'Subjects', 'Timetable', 'TeacherTimetable', 'Events'] },
      { group: 'Examinations', icon: 'pencil-box-outline', items: ['Exams', 'CreateExam', 'ExamSchedule', 'PaperBuilder', 'AdmitCard', 'SeatPlan', 'GradeEntry', 'ExamAnalytics', 'ExamReports'] },
      // 'Leave' reused directly (LeaveScreen already renders LeaveApprovalView for School Admin)
      // instead of a separate 'LeaveManagement' destination pointing at the same thing.
      { group: 'Attendance', icon: 'clipboard-check-outline', items: ['AttendanceDashboard', 'StudentAttendance', 'TeacherAttendance', 'StaffAttendance', 'Leave', 'AttendanceReports', 'AttendanceAnalytics', 'AttendanceTable', 'MonthlyReport', 'GeofenceSettings'] },
      { group: 'Fees', icon: 'cash-multiple', items: ['FeeCategories', 'FeeCollection', 'FeeStructures', 'AssignFees'] },
      // 'IssuedBooks' reused for "Issue / Return" — IssuedBooksScreen already has full issue,
      // return and delete actions. 'Library Cards' has no backend model at all (no route,
      // controller, or schema for it anywhere), so it's dropped rather than faked.
      { group: 'Library', icon: 'bookshelf', items: ['Books', 'IssuedBooks'] },
      { group: 'Transport', icon: 'bus-school', items: ['Routes', 'Vehicles', 'TransportAssignments'] },
      'Hostel',
      { group: 'Payroll', icon: 'cash-multiple', items: ['CreateEmployee', 'SalaryStructures', 'MonthlyRun', 'PayslipCenter', 'PayrollMonthlyReports', 'SalaryAdvance', 'BonusIncentives', 'Reimbursements'] },
      'Inventory', 'Communication', 'TaskManagement', 'Reports', 'SchoolSettings',
      { group: 'Support Center', icon: 'help-circle-outline', items: ['SupportTickets', 'Documentation'] },
      'Profile',
    ],
  },
  [ROLE_NAMES.PRINCIPAL]: {
    unrestricted: true,
    items: [
      'Dashboard', 'StaffUsers', 'Students', 'AcademicReports', 'Timetable',
      'AttendanceReports', 'MarkAttendance', 'AttendanceTable', 'Exams', 'Library', 'Transport',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance', 'Leave',
      'Profile',
    ],
  },
  [ROLE_NAMES.VICE_PRINCIPAL]: {
    unrestricted: true,
    items: [
      'Dashboard', 'Timetable', 'Exams', 'StudentAttendance', 'TeacherAttendance', 'AttendanceTable', 'Reports',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance', 'Leave', 'RoleWorkspace',
      'Profile',
    ],
  },
  [ROLE_NAMES.TEACHER]: {
    unrestricted: true,
    items: [
      'Dashboard',
      { group: 'Classroom', icon: 'book-open-variant', items: ['AssignedClasses', 'Assignments', 'SubjectResources', 'LessonPlans', 'Timetable'] },
      { group: 'Attendance', icon: 'clipboard-check-outline', items: ['Attendance', 'StudentMonthlyReport', 'MyDailyAttendance', 'MyMonthlyReport', 'GpsCheckInOut'] },
      { group: 'Exams & Questions', icon: 'pencil-box-outline', items: ['Exams', 'QuestionBank', 'Evaluation', 'ExamReports'] },
      'Reports', 'Leave', 'MyTasks', 'Payroll',
      { group: 'Communication', icon: 'message-text-outline', items: ['Messages', 'Notifications'] },
      'Profile',
    ],
  },
  [ROLE_NAMES.STUDENT]: {
    unrestricted: true,
    items: [
      'Dashboard', 'Assignments', 'Attendance', 'Grades', 'Timetable', 'Library', 'StudyMaterials',
      'Hostel', 'Transport', 'Fees', 'Leave', 'Exams', 'AcademicCalendar',
      { group: 'Communication', icon: 'message-text-outline', items: ['Messages', 'Notifications'] },
      'Profile',
    ],
    alwaysVisibleExtra: ['Attendance'],
  },
  [ROLE_NAMES.PARENT]: {
    unrestricted: true,
    items: [
      'Dashboard', 'MyChildren', 'Attendance', 'Grades', 'Assignments', 'Fees', 'Timetable', 'Exams',
      // 'Events' reused for "Calendar" — EventsScreen already renders AgendaEventsView for Parent.
      'Leave', 'Transport', 'Hostel', 'Library', 'Events', 'ProgressReport',
      { group: 'Communication', icon: 'message-text-outline', items: ['Messages', 'Notifications'] },
      'Profile',
    ],
    alwaysVisibleExtra: ['Attendance'],
  },
  [ROLE_NAMES.ACCOUNTANT]: {
    unrestricted: true,
    items: [
      'Dashboard', 'FeeCollection', 'FeeReports', 'Income', 'Expenses', 'Finance',
      { group: 'Payroll', icon: 'cash-multiple', items: ['SalaryRun', 'SalaryStructures', 'CreateEmployee', 'PayslipCenter', 'PayrollMonthlyReports', 'SalaryAdvance', 'BonusIncentives', 'Reimbursements', 'Payroll'] },
      'MyAttendance', 'GpsCheckInOut', 'AttendanceReports', 'Leave', 'MyTasks',
      { group: 'Communication', icon: 'message-text-outline', items: ['Messages', 'Notifications'] },
      'Profile',
    ],
  },
  [ROLE_NAMES.LIBRARIAN]: {
    unrestricted: true,
    items: [
      'Dashboard', 'BookCatalog', 'IssuedBooks', 'Members', 'FineManagement', 'Reports', 'LibrarySettings',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance', 'Leave', 'RoleWorkspace',
      'Profile',
    ],
  },
  [ROLE_NAMES.HOSTEL_WARDEN]: {
    unrestricted: true,
    items: [
      'Dashboard', 'Rooms', 'Allocations', 'Leave', 'VisitorLog', 'Complaints', 'Attendance', 'Reports',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance',
      'Profile',
    ],
  },
  [ROLE_NAMES.TRANSPORT_MANAGER]: {
    unrestricted: true,
    items: [
      'Dashboard', 'Routes', 'Vehicles', 'Drivers', 'TransportAssignments', 'FuelMaintenance',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance', 'Leave', 'RoleWorkspace',
      'Profile',
    ],
  },
  [ROLE_NAMES.RECEPTIONIST]: {
    unrestricted: true,
    items: [
      'Dashboard', 'VisitorManagement', 'Enquiries', 'PhoneCallsLog', 'Broadcasts',
      'MyTasks', 'Payroll', 'GpsCheckInOut', 'MyAttendance', 'Leave', 'RoleWorkspace',
      'Profile',
    ],
  },
};
