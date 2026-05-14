import {
  LayoutDashboard,
  School,
  Puzzle,
  Settings,
  Users,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Bus,
  CreditCard,
  Bell,
  UserCheck,
  ClipboardList,
  GraduationCap,
  FileCheck,
  MessageCircle,
  Clipboard,
  ClipboardSignature,
  FileBarChart2,
  Book,
  Briefcase,
  MessageSquare,
  User,
  Cog,
  BusFront,
  MapPinned,
  Receipt,
  Fuel,
  Wrench,
  Clock,
  UserPlus,
  Wallet,
  Banknote,
  Calculator,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const normalizeSidebarRole = (role = "") =>
  String(role)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

export const sidebarRoleAliases = {
  superadmin: "super admin",
  "super-admin": "super admin",
  "super_admin": "super admin",
  schooladmin: "school admin",
  "school-admin": "school admin",
  "school_admin": "school admin",
  viceprincipal: "vice principal",
  "vice-principal": "vice principal",
  "vice_principal": "vice principal",
  examcoordinator: "exam coordinator",
  "exam-coordinator": "exam coordinator",
  "exam_coordinator": "exam coordinator",
  subjectcoordinator: "subject coordinator",
  "subject-coordinator": "subject coordinator",
  "subject_coordinator": "subject coordinator",
  hostelwarden: "hostel warden",
  "hostel-warden": "hostel warden",
  "hostel_warden": "hostel warden",
  transportmanager: "transport manager",
  "transport-manager": "transport manager",
  "transport_manager": "transport manager",
  itsupport: "it support",
  "it-support": "it support",
  "it_support": "it support",
  supportstaff: "support staff",
  "support-staff": "support staff",
  "support_staff": "support staff",
};

const commonSelfService = (basePath) => [
  { title: "Messages", path: `${basePath}/message`, icon: MessageCircle },
  { title: "Notifications", path: `${basePath}/notification`, icon: Bell },
  { title: "Profile", path: `${basePath}/profile`, icon: User },
];

const communicationMenu = (basePath) => ({
  title: "Communication",
  icon: MessageSquare,
  subMenu: [
    { title: "Send Message", path: `${basePath}/communication/send` },
    { title: "Message History", path: `${basePath}/communication/history` },
  ],
});

const payrollMenu = {
  "super admin": {
    title: "Payroll Management",
    icon: Banknote,
    subMenu: [
      { title: "Payroll Overview", path: "superadmin/payroll", permission: "payroll.global.view" },
      { title: "School Payroll Usage", path: "superadmin/payroll/schools", permission: "payroll.global.schools.view" },
      { title: "Payroll Plans", path: "superadmin/payroll/plans", permission: "payroll.global.plans.manage" },
      { title: "Compliance Templates", path: "superadmin/payroll/compliance-templates", permission: "payroll.global.compliance.manage" },
      { title: "Payroll Audit Logs", path: "superadmin/payroll/audit-logs", permission: "payroll.global.audit.view" },
    ],
  },

  "school admin": {
    title: "Payroll",
    icon: Wallet,
    subMenu: [
      { title: "Dashboard", path: "schooladmin/payroll", permission: "payroll.dashboard.view" },
      { title: "Create Employee", path: "schooladmin/payroll/create-employee", permission: "payroll.createEmployee.manage" },
      { title: "Payroll Settings", path: "schooladmin/payroll/settings", permission: "payroll.settings.manage" },
      { title: "Salary Components", path: "schooladmin/payroll/components", permission: "payroll.components.manage" },
      { title: "Salary Structures", path: "schooladmin/payroll/salary-structures", permission: "payroll.salaryStructure.manage" },
      { title: "Payroll Cycles", path: "schooladmin/payroll/cycles", permission: "payroll.cycles.manage" },
      { title: "Payroll Runs", path: "schooladmin/payroll/runs", permission: "payroll.runs.view" },
      { title: "Payslips", path: "schooladmin/payroll/payslips", permission: "payroll.payslips.manage" },
      { title: "Loans & Advances", path: "schooladmin/payroll/loans", permission: "payroll.loans.manage" },
      { title: "Tax Declarations", path: "schooladmin/payroll/tax-declarations", permission: "payroll.tax.manage" },
      { title: "Reports", path: "schooladmin/payroll/reports", permission: "payroll.reports.view" },
      { title: "Audit Logs", path: "schooladmin/payroll/audit-logs", permission: "payroll.audit.view" },
    ],
  },

  principal: {
    title: "Payroll",
    icon: Wallet,
    subMenu: [
      { title: "Payroll Dashboard", path: "principal/payroll", permission: "payroll.dashboard.view" },
      { title: "Payroll Approvals", path: "principal/payroll/approvals", permission: "payroll.approve" },
      { title: "Payroll Reports", path: "principal/payroll/reports", permission: "payroll.reports.view" },
      { title: "Payroll Audit Logs", path: "principal/payroll/audit-logs", permission: "payroll.audit.view" },
    ],
  },

  accountant: {
    title: "Payroll",
    icon: Calculator,
    subMenu: [
      { title: "Payroll Workspace", path: "accountant/payroll", permission: "payroll.workspace.view" },
      { title: "Payroll Cycles", path: "accountant/payroll/cycles", permission: "payroll.cycles.manage" },
      { title: "Payroll Run", path: "accountant/payroll/runs", permission: "payroll.runs.manage" },
      { title: "Adjustments", path: "accountant/payroll/adjustments", permission: "payroll.adjustments.manage" },
      { title: "Payslips", path: "accountant/payroll/payslips", permission: "payroll.payslips.manage" },
      { title: "Bank Export", path: "accountant/payroll/bank-export", permission: "payroll.bankExport.manage" },
      { title: "Reports", path: "accountant/payroll/reports", permission: "payroll.reports.view" },
    ],
  },

  hr: {
    title: "Payroll HR",
    icon: Users,
    subMenu: [
      { title: "Salary Management", path: "hr/payroll/salary-management", permission: "payroll.salaryStructure.manage" },
      { title: "Salary Revisions", path: "hr/payroll/salary-revisions", permission: "payroll.salaryRevision.manage" },
      { title: "Employee Loans", path: "hr/payroll/loans", permission: "payroll.loans.manage" },
      { title: "Tax Declarations", path: "hr/payroll/tax-declarations", permission: "payroll.tax.manage" },
      { title: "Employee Payroll Profiles", path: "hr/payroll/employee-profiles", permission: "payroll.employeeProfile.view" },
    ],
  },

  teacher: {
    title: "My Payroll",
    icon: Wallet,
    subMenu: [
      { title: "Payroll Dashboard", path: "teacher/payroll", permission: "payroll.self.view" },
      { title: "My Payslips", path: "teacher/payroll/payslips", permission: "payroll.self.payslips.view" },
      { title: "My Salary Structure", path: "teacher/payroll/salary-structure", permission: "payroll.self.salaryStructure.view" },
      { title: "Loan / Advance Request", path: "teacher/payroll/loans", permission: "payroll.self.loans.manage" },
      { title: "Tax Declaration", path: "teacher/payroll/tax-declaration", permission: "payroll.self.tax.manage" },
    ],
  },

  staff: {
    title: "My Payroll",
    icon: Wallet,
    subMenu: [
      { title: "Payroll Dashboard", path: "staff/payroll", permission: "payroll.self.view" },
      { title: "My Payslips", path: "staff/payroll/payslips", permission: "payroll.self.payslips.view" },
      { title: "My Salary Structure", path: "staff/payroll/salary-structure", permission: "payroll.self.salaryStructure.view" },
      { title: "Loan / Advance Request", path: "staff/payroll/loans", permission: "payroll.self.loans.manage" },
      { title: "Tax Declaration", path: "staff/payroll/tax-declaration", permission: "payroll.self.tax.manage" },
    ],
  },

  "support staff": {
    title: "My Payroll",
    icon: Wallet,
    subMenu: [
      { title: "Payroll Dashboard", path: "staff/payroll", permission: "payroll.self.view" },
      { title: "My Payslips", path: "staff/payroll/payslips", permission: "payroll.self.payslips.view" },
      { title: "My Salary Structure", path: "staff/payroll/salary-structure", permission: "payroll.self.salaryStructure.view" },
      { title: "Loan / Advance Request", path: "staff/payroll/loans", permission: "payroll.self.loans.manage" },
      { title: "Tax Declaration", path: "staff/payroll/tax-declaration", permission: "payroll.self.tax.manage" },
    ],
  },

  auditor: {
    title: "Payroll Reports",
    icon: FileBarChart2,
    subMenu: [
      { title: "Payroll Summary", path: "auditor/payroll/reports", permission: "payroll.reports.view" },
      { title: "Department Cost", path: "auditor/payroll/department-cost", permission: "payroll.reports.departmentCost.view" },
      { title: "Statutory Reports", path: "auditor/payroll/statutory", permission: "payroll.reports.statutory.view" },
      { title: "Audit Logs", path: "auditor/payroll/audit-logs", permission: "payroll.audit.view" },
    ],
  },
};

const employeePayrollBasePaths = {
  "vice principal": "viceprincipal",
  "subject coordinator": "subjectcoordinator",
  librarian: "librarian",
  "hostel warden": "hostelwarden",
  "transport manager": "transportmanager",
  "exam coordinator": "examcoordinator",
  receptionist: "receptionist",
  "it support": "itsupport",
  counselor: "counselor",
  security: "security",
};

const selfPayrollMenu = (basePath) => ({
  title: "My Payroll",
  icon: Wallet,
  subMenu: [
    { title: "Payroll Dashboard", path: `${basePath}/payroll`, permission: "payroll.self.view" },
    { title: "My Payslips", path: `${basePath}/payroll/payslips`, permission: "payroll.self.payslips.view" },
    { title: "My Salary Structure", path: `${basePath}/payroll/salary-structure`, permission: "payroll.self.salaryStructure.view" },
    { title: "Loan / Advance Request", path: `${basePath}/payroll/loans`, permission: "payroll.self.loans.manage" },
    { title: "Tax Declaration", path: `${basePath}/payroll/tax-declaration`, permission: "payroll.self.tax.manage" },
  ],
});

const supportCenterItem = { title: "Support Center", path: "support/tickets", icon: MessageSquare };
const moduleHubItem = { title: "Module Hub", path: "modules", icon: Puzzle };
const roleWorkspaceItem = { title: "Role Workspace", path: "workspace", icon: ClipboardList };

const withPayroll = (role, items, insertAfterTitle = null) => {
  const payroll = payrollMenu[role];
  if (!payroll) return items;

  const alreadyExists = items.some(
    (item) =>
      item?.title?.toLowerCase() === payroll.title.toLowerCase() ||
      item?.path?.includes("/payroll") ||
      item?.subMenu?.some((child) => child?.path?.includes("/payroll"))
  );

  if (alreadyExists) return items;

  if (!insertAfterTitle) return [...items, payroll];

  const index = items.findIndex(
    (item) => item?.title?.toLowerCase() === insertAfterTitle.toLowerCase()
  );

  if (index === -1) return [...items, payroll];

  return [...items.slice(0, index + 1), payroll, ...items.slice(index + 1)];
};

export const sidebarMenu = {
  "super admin": withPayroll(
    "super admin",
    [
      { title: "Dashboard", path: "superadmin", icon: LayoutDashboard },
      {
        title: "School Management",
        icon: School,
        subMenu: [
          { title: "School List", path: "superadmin/schools" },
          { title: "School Reports", path: "superadmin/reports/schools" },
        ],
      },
      {
        title: "Subscription & Billing",
        icon: CreditCard,
        subMenu: [
          { title: "Subscription Plans", path: "superadmin/subscriptions" },
          { title: "Payment History", path: "superadmin/payments" },
          { title: "Revenue", path: "superadmin/revenue" },
          { title: "Revenue Analytics", path: "superadmin/reports/revenue" },
        ],
      },
      {
        title: "User Management",
        icon: Users,
        subMenu: [
          { title: "School Admins", path: "superadmin/users/admins" },
          { title: "Teachers", path: "superadmin/users/teachers" },
          { title: "Staff", path: "superadmin/users/staff" },
          { title: "Students", path: "superadmin/users/students" },
          { title: "Parents", path: "superadmin/users/parents" },
          { title: "Accountants", path: "superadmin/users/accountant" },
          { title: "Librarians", path: "superadmin/users/librarian" },
          { title: "Transport Users", path: "superadmin/users/transport" },
          { title: "Create User", path: "superadmin/user-create" },
        ],
      },
      {
        title: "Academic Management",
        icon: BookOpen,
        subMenu: [
          { title: "Classes", path: "superadmin/academics/classes" },
          { title: "Class Sections", path: "superadmin/classes-sections/list" },
          { title: "Subjects", path: "superadmin/academics/subjects" },
          { title: "Academic Years", path: "superadmin/academics/academic-years" },
          { title: "Boards", path: "superadmin/academics/boards" },
          { title: "Board Classes", path: "superadmin/academics/boards-class" },
          { title: "Chapters & Topics", path: "superadmin/academics/chapters-topics" },
        ],
      },
      {
        title: "Attendance",
        icon: UserCheck,
        subMenu: [
          { title: "Attendance Dashboard", path: "superadmin/reports/attendance" },
          { title: "Mark Attendance", path: "superadmin/attendance/mark" },
          { title: "Attendance Table", path: "superadmin/attendance/table" },
          { title: "Monthly Report", path: "superadmin/attendance/monthly" },
        ],
      },
      {
        title: "Reports & Analytics",
        icon: FileBarChart2,
        subMenu: [
          { title: "Reports Home", path: "superadmin/reports" },
          { title: "School Wise Reports", path: "superadmin/reports/school-wise" },
          { title: "Finance Summary", path: "superadmin/reports/finance" },
          { title: "Academic Reports", path: "superadmin/reports/academic" },
          { title: "Platform Usage", path: "superadmin/reports/usage" },
          { title: "Activity Logs", path: "superadmin/reports/activity" },
        ],
      },
      {
        title: "Master Settings",
        icon: Settings,
        subMenu: [
          { title: "Fee Categories", path: "superadmin/fees/categories" },
          { title: "Departments", path: "superadmin/departments" },
          { title: "Designations", path: "superadmin/designations" },
          { title: "Global Config", path: "superadmin/settings/global" },
        ],
      },
      {
        title: "System Administration",
        icon: Cog,
        subMenu: [
          { title: "Roles", path: "superadmin/settings/roles" },
          { title: "Permissions", path: "superadmin/settings/permissions" },
          { title: "Modules", path: "superadmin/modules" },
          { title: "System Backup", path: "superadmin/settings/backup" },
          { title: "Audit Logs", path: "superadmin/settings/audit" },
          { title: "Settings", path: "superadmin/settings" },
        ],
      },
      {
        title: "Help",
        icon: MessageSquare,
        subMenu: [
          { title: "Support Tickets", path: "superadmin/support/tickets" },
          { title: "Documentation", path: "superadmin/support/documentation" },
          { title: "Contact Support", path: "superadmin/support/contact" },
          { title: "FAQs", path: "superadmin/support/faqs" },
        ],
      },
      communicationMenu("superadmin"),
      ...commonSelfService("superadmin"),
    ],
    "Master Settings"
  ),

  "school admin": withPayroll(
    "school admin",
    [
      { title: "Dashboard", path: "schooladmin", icon: LayoutDashboard },
      { title: "School Setup", path: "schooladmin/school-setup", icon: School },
      {
        title: "User Management",
        icon: Users,
        subMenu: [
          { title: "Student Admission", path: "schooladmin/admission" },
          { title: "Students", path: "schooladmin/studentList" },
          { title: "Student Promotion", path: "schooladmin/students/promotion" },
          { title: "Parents", path: "schooladmin/parents-register" },
          { title: "Teachers & Staff", path: "schooladmin/teacher" },
          { title: "Create User", path: "schooladmin/user-create" },
          { title: "Employee Details", path: "schooladmin/users/employee-details" },
        ],
      },
      {
        title: "Academic Management",
        icon: BookOpen,
        subMenu: [
          { title: "Classes", path: "schooladmin/classes" },
          { title: "Subjects", path: "schooladmin/subjects" },
          { title: "Timetable Planner", path: "schooladmin/timetable" },
          { title: "Time Slots", path: "schooladmin/timetable/time-slots" },
          { title: "Rooms", path: "schooladmin/timetable/rooms" },
          { title: "Teacher Timetable", path: "schooladmin/timetable/teacher" },
          { title: "Events", path: "schooladmin/events" },
          { title: "Calendar", path: "schooladmin/calendar" },
        ],
      },
      {
        title: "Examination Management",
        icon: GraduationCap,
        subMenu: [
          { title: "Create Exam", path: "schooladmin/exams/exams-create" },
          { title: "Exams List", path: "schooladmin/exams/exams-list" },
          { title: "Exam Schedule", path: "schooladmin/exams/schedule" },
          { title: "Grade Entry", path: "schooladmin/exams/grades" },
          { title: "Paper Builder", path: "schooladmin/exams/paper-builder" },
          { title: "Admit Card", path: "schooladmin/exams/admit-card" },
          { title: "Seat Plan", path: "schooladmin/exams/seat-plan" },
          { title: "Analytics", path: "schooladmin/exams/analytics" },
          { title: "Exam Reports", path: "schooladmin/exams/reports" },
        ],
      },
      {
        title: "Attendance Management",
        icon: UserCheck,
        subMenu: [
          { title: "Student Attendance", path: "schooladmin/attendance/students" },
          { title: "Staff Attendance", path: "schooladmin/attendance/staff" },
          { title: "Mark Attendance", path: "schooladmin/attendance/mark" },
          { title: "Attendance Table", path: "schooladmin/attendance/table" },
          { title: "Attendance Dashboard", path: "schooladmin/attendance/dashboard" },
          { title: "Monthly Attendance", path: "schooladmin/attendance/monthly" },
        ],
      },
      {
        title: "Fee Management",
        icon: CreditCard,
        subMenu: [
          { title: "Fee Categories", path: "schooladmin/fees/categories" },
          { title: "Fee Structures", path: "schooladmin/fees/feestructure" },
          { title: "Assign Fees", path: "schooladmin/fees/assign" },
        ],
      },
      {
        title: "Library Management",
        icon: Book,
        subMenu: [
          { title: "Books", path: "schooladmin/library/books" },
          { title: "Issue / Return", path: "schooladmin/library/issue" },
          { title: "Library Cards", path: "schooladmin/library/card" },
        ],
      },
      {
        title: "Transport Management",
        icon: Bus,
        subMenu: [
          { title: "Routes", path: "schooladmin/transport/routes" },
          { title: "Vehicles", path: "schooladmin/transport/vehicles" },
          { title: "Assignments", path: "schooladmin/transport/assignments" },
        ],
      },
      {
        title: "Hostel Management",
        icon: ClipboardList,
        subMenu: [
          { title: "Hostel Rooms", path: "schooladmin/hostel" },
          { title: "Room Allocation", path: "schooladmin/hostel/allocation" },
        ],
      },
      {
        title: "Inventory Management",
        icon: Briefcase,
        subMenu: [
          { title: "Supplies", path: "schooladmin/inventory/supplies" },
          { title: "Assets", path: "schooladmin/inventory/assets" },
        ],
      },
      communicationMenu("schooladmin"),
      { title: "Reports", path: "schooladmin/reports", icon: FileBarChart2 },
      { title: "School Settings", path: "schooladmin/settings", icon: Settings },
      ...commonSelfService("schooladmin"),
    ],
   
  ),

  teacher: withPayroll("teacher", [
    { title: "Dashboard", path: "teacher", icon: LayoutDashboard },
    {
      title: "Classroom",
      icon: BookOpen,
      subMenu: [
        { title: "Assigned Classes", path: "teacher/classes" },
        { title: "My Students", path: "teacher/students" },
        { title: "Assignments", path: "teacher/assignments" },
        { title: "Timetable", path: "teacher/timetable" },
      ],
    },
    {
      title: "Attendance",
      icon: UserCheck,
      subMenu: [
        { title: "Student Attendance", path: "teacher/attendance/students" },
        { title: "Student Monthly Report", path: "teacher/attendance" },
        { title: "My Daily Attendance", path: "teacher/attendance/my" },
        { title: "My Monthly Report", path: "teacher/attendance/my/monthly" },
      ],
    },
    {
      title: "Exams & Questions",
      icon: GraduationCap,
      subMenu: [
        { title: "Exam List", path: "teacher/exams/list" },
        { title: "Question Bank", path: "teacher/exams/question-bank" },
        { title: "Create Question", path: "teacher/exams/create-question" },
        { title: "Bulk Upload Questions", path: "teacher/exams/bulk-upload-questions" },
        { title: "Evaluation", path: "teacher/exams/evaluation" },
        { title: "Exam Reports", path: "teacher/exams/reports" },
      ],
    },
    { title: "Teacher Reports", path: "teacher/reports", icon: FileBarChart2 },
    communicationMenu("teacher"),
    { title: "Settings", path: "teacher/settings", icon: Settings },
    ...commonSelfService("teacher"),
  ]),

  student: [
    { title: "Dashboard", path: "student", icon: LayoutDashboard },
    { title: "Homework", path: "student/homework", icon: ClipboardCheck },
    { title: "Attendance", path: "student/attendance", icon: UserCheck },
    { title: "Grades", path: "student/grades", icon: FileCheck },
    { title: "Timetable", path: "student/timetable", icon: CalendarClock },
    { title: "Library", path: "student/library", icon: Book },
    { title: "Hostel", path: "student/hostel", icon: ClipboardList },
    { title: "Transport", path: "student/transport", icon: Bus },
    { title: "Fees", path: "student/fees", icon: Receipt },
    { title: "Exams", path: "student/exams", icon: GraduationCap },
    communicationMenu("student"),
    { title: "Settings", path: "student/settings", icon: Settings },
    ...commonSelfService("student"),
  ],

  parent: [
    { title: "Dashboard", path: "parent", icon: LayoutDashboard },
    { title: "My Children", path: "parent/children", icon: Users },
    { title: "Attendance", path: "parent/attendance", icon: UserCheck },
    { title: "Grades", path: "parent/grades", icon: FileCheck },
    { title: "Homework", path: "parent/homework", icon: ClipboardCheck },
    { title: "Fees", path: "parent/fees", icon: Receipt },
    { title: "Timetable", path: "parent/timetable", icon: CalendarClock },
    { title: "Exams", path: "parent/exams", icon: GraduationCap },
    { title: "Reports", path: "parent/reports", icon: FileBarChart2 },
    communicationMenu("parent"),
    { title: "Settings", path: "parent/settings", icon: Settings },
    ...commonSelfService("parent"),
  ],

  accountant: withPayroll("accountant", [
    { title: "Dashboard", path: "accountant", icon: LayoutDashboard },
    { title: "Fee Collection", path: "accountant/fees/collect", icon: CreditCard },
    { title: "Attendance", path: "accountant/attendance", icon: Clock },
    { title: "Attendance Reports", path: "accountant/attendance/monthly", icon: FileBarChart2 },
    { title: "Reports", path: "accountant/reports", icon: FileBarChart2 },
    communicationMenu("accountant"),
    { title: "Settings", path: "accountant/settings", icon: Settings },
    ...commonSelfService("accountant"),
  ]),

  principal: withPayroll("principal", [
    { title: "Dashboard", path: "principal", icon: LayoutDashboard },
    { title: "Overview", path: "principal/overview", icon: FileBarChart2 },
    { title: "Staff", path: "principal/staff", icon: Users },
    { title: "Students", path: "principal/students", icon: Users },
    { title: "Academic Reports", path: "principal/reports/academic", icon: GraduationCap },
    { title: "Timetable", path: "principal/timetable", icon: CalendarClock },
    { title: "Attendance Reports", path: "principal/reports/attendance", icon: UserCheck },
    { title: "Mark Attendance", path: "principal/attendance/mark", icon: ClipboardCheck },
    { title: "Attendance Table", path: "principal/attendance/table", icon: ClipboardList },
    { title: "Exams", path: "principal/exams", icon: GraduationCap },
    { title: "Library", path: "principal/library", icon: Book },
    { title: "Transport", path: "principal/transport", icon: Bus },
    { title: "Settings", path: "principal/settings", icon: Settings },
    ...commonSelfService("principal"),
  ]),

  hr: withPayroll("hr", [
    { title: "Dashboard", path: "hr", icon: LayoutDashboard },
    { title: "Employee Management", path: "hr/employees", icon: Users },
    { title: "Attendance", path: "hr/attendance", icon: Clock },
    { title: "Reports", path: "hr/reports", icon: FileBarChart2 },
    { title: "Settings", path: "hr/settings", icon: Settings },
    ...commonSelfService("hr"),
  ]),

  auditor: withPayroll("auditor", [
    { title: "Dashboard", path: "auditor", icon: LayoutDashboard },
    { title: "Audit Reports", path: "auditor/reports", icon: FileBarChart2 },
    { title: "Audit Logs", path: "auditor/audit-logs", icon: ShieldCheck },
    ...commonSelfService("auditor"),
  ]),

  "vice principal": [
    { title: "Dashboard", path: "viceprincipal", icon: LayoutDashboard },
    { title: "Academic Management", path: "viceprincipal/academics", icon: BookOpen },
    { title: "Timetable", path: "viceprincipal/timetable", icon: CalendarClock },
    { title: "Exams & Grades", path: "viceprincipal/exams", icon: GraduationCap },
    { title: "Student Attendance", path: "viceprincipal/attendance/students", icon: UserCheck },
    { title: "Teacher Attendance", path: "viceprincipal/attendance/staff", icon: UserCheck },
    { title: "Attendance Table", path: "viceprincipal/attendance/table", icon: ClipboardList },
    { title: "Reports", path: "viceprincipal/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("viceprincipal"),
  ],

  "exam coordinator": [
    { title: "Dashboard", path: "examcoordinator", icon: LayoutDashboard },
    {
      title: "Exam Operations",
      icon: GraduationCap,
      subMenu: [
        { title: "Create Exams", path: "examcoordinator/exams/create" },
        { title: "Question Bank", path: "examcoordinator/exams/question-bank" },
        { title: "Exam Schedule", path: "examcoordinator/exams/schedule" },
        { title: "Grade Entry", path: "examcoordinator/exams/grades" },
        { title: "Paper Builder", path: "examcoordinator/exams/paper-builder" },
        { title: "Admit Card", path: "examcoordinator/exams/admit-card" },
        { title: "Seat Plan", path: "examcoordinator/exams/seat-plan" },
        { title: "Analytics", path: "examcoordinator/exams/analytics" },
        { title: "Exam Reports", path: "examcoordinator/reports" },
      ],
    },
    communicationMenu("examcoordinator"),
    { title: "Settings", path: "examcoordinator/settings", icon: Settings },
    ...commonSelfService("examcoordinator"),
  ],

  "subject coordinator": [
    { title: "Dashboard", path: "subjectcoordinator", icon: LayoutDashboard },
    { title: "Subjects Overview", path: "subjectcoordinator/subjects", icon: BookOpen },
    { title: "Teacher Assignment", path: "subjectcoordinator/teachers", icon: Users },
    { title: "Class Assignment", path: "subjectcoordinator/classes", icon: Book },
    { title: "Assessments", path: "subjectcoordinator/assessments", icon: ClipboardSignature },
    { title: "Reports", path: "subjectcoordinator/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("subjectcoordinator"),
  ],

  librarian: [
    { title: "Dashboard", path: "librarian", icon: LayoutDashboard },
    { title: "Book Catalog", path: "librarian/book-catalog", icon: Book },
    { title: "Issue / Return", path: "librarian/issue-return", icon: ClipboardCheck },
    { title: "Members", path: "librarian/members", icon: Users },
    { title: "Reports", path: "librarian/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("librarian"),
  ],

  "hostel warden": [
    { title: "Dashboard", path: "hostelwarden", icon: LayoutDashboard },
    { title: "Hostel Rooms", path: "hostelwarden/rooms", icon: BookOpen },
    { title: "Student Allocation", path: "hostelwarden/allocations", icon: Users },
    { title: "Hostel Attendance", path: "hostelwarden/attendance", icon: UserCheck },
    { title: "Visitor Log", path: "hostelwarden/visitors", icon: UserPlus },
    { title: "Reports", path: "hostelwarden/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("hostelwarden"),
  ],

  "transport manager": [
    { title: "Dashboard", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    { title: "Drivers", path: "transportmanager/drivers", icon: Users },
    { title: "Fuel & Maintenance", path: "transportmanager/maintenance", icon: Fuel },
    roleWorkspaceItem,
    ...commonSelfService("transportmanager"),
  ],

  receptionist: [
    { title: "Dashboard", path: "receptionist", icon: LayoutDashboard },
    { title: "Visitor Management", path: "receptionist/visitors", icon: UserPlus },
    { title: "Enquiries", path: "receptionist/enquiries", icon: MessageSquare },
    { title: "Phone Calls Log", path: "receptionist/calls", icon: ClipboardCheck },
    { title: "Broadcasts", path: "receptionist/broadcasts", icon: Bell },
    roleWorkspaceItem,
    ...commonSelfService("receptionist"),
  ],

  "it support": [
    { title: "Dashboard", path: "itsupport", icon: LayoutDashboard },
    { title: "System Maintenance", path: "itsupport/maintenance", icon: Wrench },
    { title: "User Support Tickets", path: "itsupport/tickets", icon: ClipboardList },
    { title: "Network Status", path: "itsupport/network", icon: Fuel },
    { title: "System Logs", path: "itsupport/logs", icon: FileBarChart2 },
    { title: "Profile", path: "itsupport/profile", icon: User },
    roleWorkspaceItem,
  ],

  counselor: [
    { title: "Dashboard", path: "counselor", icon: LayoutDashboard },
    { title: "Student Profiles", path: "counselor/students", icon: Users },
    { title: "Counseling Sessions", path: "counselor/sessions", icon: CalendarClock },
    { title: "Appointments", path: "counselor/appointments", icon: Clock },
    { title: "Reports", path: "counselor/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("counselor"),
  ],

  security: [
    { title: "Dashboard", path: "security", icon: LayoutDashboard },
    { title: "Entry Register", path: "security/entry-register", icon: Clipboard },
    { title: "Gate Logs", path: "security/gate-logs", icon: ClipboardList },
    { title: "Shift Attendance", path: "security/shift-attendance", icon: Clock },
    { title: "Emergency Alerts", path: "security/alerts", icon: Bell },
    roleWorkspaceItem,
    ...commonSelfService("security"),
  ],

  staff: withPayroll("staff", [
    { title: "Dashboard", path: "staff", icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks", icon: CalendarClock },
    { title: "My Attendance", path: "staff/attendance", icon: Clock },
    communicationMenu("staff"),
    { title: "Settings", path: "staff/settings", icon: Settings },
    ...commonSelfService("staff"),
  ]),

  "support staff": withPayroll("support staff", [
    { title: "Dashboard", path: "staff", icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks", icon: CalendarClock },
    { title: "My Attendance", path: "staff/attendance", icon: Clock },
    communicationMenu("staff"),
    { title: "Settings", path: "staff/settings", icon: Settings },
    roleWorkspaceItem,
    ...commonSelfService("staff"),
  ]),

  transport: [
    { title: "Dashboard", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    { title: "Assignments", path: "schooladmin/transport/assignments", icon: Bus },
  ],
};

Object.keys(sidebarMenu).forEach((roleKey) => {
  const items = sidebarMenu[roleKey];
  if (!Array.isArray(items)) return;

  const payrollBasePath = employeePayrollBasePaths[roleKey];
  const hasPayroll = items.some((item) => item?.path?.includes("/payroll") || item?.subMenu?.some((child) => child?.path?.includes("/payroll")));

  if (payrollBasePath && !hasPayroll) {
    items.push(selfPayrollMenu(payrollBasePath));
  }

  if (!items.some((item) => item?.path === moduleHubItem.path)) {
    items.push(moduleHubItem);
  }

  const rolePath = roleKey.replace(/\s+/g, "");
  const hasMessage = items.some(
    (item) => item?.path === `${rolePath}/message` || item?.path?.endsWith("/message")
  );

  if (!hasMessage) {
    items.push({ title: "Messages", path: `${rolePath}/message`, icon: MessageSquare });
  }

  if (!items.some((item) => item?.path === supportCenterItem.path)) {
    items.push(supportCenterItem);
  }
});

export const getSidebarMenuByRole = (role) => {
  const rawRole = String(role || "").trim().toLowerCase();
  const normalizedRole = normalizeSidebarRole(role);
  const canonicalRole = sidebarRoleAliases[rawRole] || sidebarRoleAliases[normalizedRole] || normalizedRole;

  return sidebarMenu[canonicalRole] || sidebarMenu[rawRole] || [];
};

Object.entries(sidebarRoleAliases).forEach(([alias, canonicalRole]) => {
  if (sidebarMenu[alias] || !sidebarMenu[canonicalRole]) return;
  sidebarMenu[alias] = sidebarMenu[canonicalRole];
});

export default sidebarMenu;
