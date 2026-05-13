import {
  LayoutDashboard,
  School,
  Puzzle,
  FileText,
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
  IndianRupee,
  Cog,
  BusFront,
  MapPinned,
  Receipt,
  Fuel,
  Wrench,
  Clock,
  UserPlus,
} from "lucide-react";

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

const supportCenterItem = {
  title: "Support Center",
  path: "support/tickets",
  icon: MessageSquare,
};
const moduleHubItem = { title: "Module Hub", path: "modules", icon: Puzzle };
const roleWorkspaceItem = {
  title: "Role Workspace",
  path: "workspace",
  icon: ClipboardList,
};

export const sidebarMenu = {
  /* ================= SUPER ADMIN ================= */
  "super admin": [
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
        {
          title: "Academic Years",
          path: "superadmin/academics/academic-years",
        },
        { title: "Boards", path: "superadmin/academics/boards" },
        { title: "Board Classes", path: "superadmin/academics/boards-class" },
        {
          title: "Chapters & Topics",
          path: "superadmin/academics/chapters-topics",
        },
      ],
    },
    {
      title: "Attendance",
      icon: UserCheck,
      subMenu: [
        {
          title: "Attendance Dashboard",
          path: "superadmin/reports/attendance",
        },
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
        {
          title: "School Wise Reports",
          path: "superadmin/reports/school-wise",
        },
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

  /* ================= SCHOOL ADMIN ================= */
  "school admin": [
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
        {
          title: "Employee Details",
          path: "schooladmin/users/employee-details",
        },
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
        {
          title: "Student Attendance",
          path: "schooladmin/attendance/students",
        },
        { title: "Staff Attendance", path: "schooladmin/attendance/staff" },
        { title: "Mark Attendance", path: "schooladmin/attendance/mark" },
        { title: "Attendance Table", path: "schooladmin/attendance/table" },
        {
          title: "Attendance Dashboard",
          path: "schooladmin/attendance/dashboard",
        },
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
      title: "Payroll",
      icon: IndianRupee,
      subMenu: [
        { title: "Payroll Dashboard", path: "schooladmin/payroll/dashboard" },
        { title: "Salary Components", path: "schooladmin/payroll/components" },
        { title: "Salary Templates", path: "schooladmin/payroll/templates" },
        {
          title: "Employee Structures",
          path: "schooladmin/payroll/employee-structures",
        },
        { title: "Payroll Cycles", path: "schooladmin/payroll/cycles" },
        { title: "Run Payroll", path: "schooladmin/payroll/run" },
        { title: "Payroll Approval", path: "schooladmin/payroll/approval" },
        { title: "Payslip Management", path: "schooladmin/payroll/payslips" },
        { title: "Salary Payments", path: "schooladmin/payroll/payments" },
        { title: "Loans & Advances", path: "schooladmin/payroll/loans" },
        { title: "Statutory Reports", path: "schooladmin/payroll/statutory" },
        { title: "Payroll Reports", path: "schooladmin/payroll/reports" },
        {
          title: "Create Employee",
          path: "schooladmin/payroll/create-employee",
        },
        {
          title: "Legacy Monthly Run",
          path: "schooladmin/payroll/monthly-run",
        },
        {
          title: "Legacy Monthly Reports",
          path: "schooladmin/payroll/reports/monthly",
        },
        { title: "Tax Settings", path: "schooladmin/payroll/enterprise/tax" },
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

  /* ================= TEACHER ================= */
  teacher: [
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
        {
          title: "Bulk Upload Questions",
          path: "teacher/exams/bulk-upload-questions",
        },
        { title: "Evaluation", path: "teacher/exams/evaluation" },
        { title: "Exam Reports", path: "teacher/exams/reports" },
      ],
    },
    { title: "Teacher Reports", path: "teacher/reports", icon: FileBarChart2 },
    { title: "My Payroll", path: "teacher/payroll", icon: IndianRupee },
    communicationMenu("teacher"),
    { title: "Settings", path: "teacher/settings", icon: Settings },
    ...commonSelfService("teacher"),
  ],

  /* ================= STUDENT ================= */
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

  /* ================= PARENT ================= */
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

  /* ================= ACCOUNTANT ================= */
  accountant: [
    { title: "Dashboard", path: "accountant", icon: LayoutDashboard },
    {
      title: "Fee Collection",
      path: "accountant/fees/collect",
      icon: CreditCard,
    },
    {
      title: "Payroll",
      icon: IndianRupee,
      subMenu: [
        { title: "Salary Run", path: "accountant/salary" },
        { title: "Salary Structures", path: "accountant/salary/structures" },
        { title: "Create Employee", path: "accountant/salary/create-employee" },
        { title: "Payslip Center", path: "accountant/salary/payslips" },
        { title: "Monthly Reports", path: "accountant/salary/reports/monthly" },
        {
          title: "Enterprise Dashboard",
          path: "accountant/salary/enterprise/dashboard",
        },
        { title: "Enterprise Run", path: "accountant/salary/enterprise/run" },
        { title: "Approvals", path: "accountant/salary/enterprise/approval" },
        {
          title: "Loans & Advance",
          path: "accountant/salary/enterprise/loans",
        },
        { title: "Tax Settings", path: "accountant/salary/enterprise/tax" },
        { title: "My Payroll", path: "accountant/payroll" },
      ],
    },
    { title: "Attendance", path: "accountant/attendance", icon: Clock },
    {
      title: "Attendance Reports",
      path: "accountant/attendance/monthly",
      icon: FileBarChart2,
    },
    { title: "Reports", path: "accountant/reports", icon: FileBarChart2 },
    communicationMenu("accountant"),
    { title: "Settings", path: "accountant/settings", icon: Settings },
    ...commonSelfService("accountant"),
  ],

  /* ================= PRINCIPAL ================= */
  principal: [
    { title: "Dashboard", path: "principal", icon: LayoutDashboard },
    { title: "Overview", path: "principal/overview", icon: FileBarChart2 },
    { title: "Staff", path: "principal/staff", icon: Users },
    { title: "Students", path: "principal/students", icon: Users },
    {
      title: "Academic Reports",
      path: "principal/reports/academic",
      icon: GraduationCap,
    },
    { title: "Timetable", path: "principal/timetable", icon: CalendarClock },
    {
      title: "Attendance Reports",
      path: "principal/reports/attendance",
      icon: UserCheck,
    },
    {
      title: "Mark Attendance",
      path: "principal/attendance/mark",
      icon: ClipboardCheck,
    },
    {
      title: "Attendance Table",
      path: "principal/attendance/table",
      icon: ClipboardList,
    },
    { title: "Exams", path: "principal/exams", icon: GraduationCap },
    { title: "Library", path: "principal/library", icon: Book },
    { title: "Transport", path: "principal/transport", icon: Bus },
    { title: "My Payroll", path: "principal/payroll", icon: IndianRupee },
    { title: "Settings", path: "principal/settings", icon: Settings },
    ...commonSelfService("principal"),
  ],

  /* ================= VICE PRINCIPAL ================= */
  "vice principal": [
    { title: "Dashboard", path: "viceprincipal", icon: LayoutDashboard },
    {
      title: "Academic Management",
      path: "viceprincipal/academics",
      icon: BookOpen,
    },
    {
      title: "Timetable",
      path: "viceprincipal/timetable",
      icon: CalendarClock,
    },
    {
      title: "Exams & Grades",
      path: "viceprincipal/exams",
      icon: GraduationCap,
    },
    {
      title: "Student Attendance",
      path: "viceprincipal/attendance/students",
      icon: UserCheck,
    },
    {
      title: "Teacher Attendance",
      path: "viceprincipal/attendance/staff",
      icon: UserCheck,
    },
    {
      title: "Attendance Table",
      path: "viceprincipal/attendance/table",
      icon: ClipboardList,
    },
    { title: "Reports", path: "viceprincipal/reports", icon: FileBarChart2 },
    { title: "My Payroll", path: "viceprincipal/payroll", icon: IndianRupee },
    roleWorkspaceItem,
    ...commonSelfService("viceprincipal"),
  ],

  /* ================= EXAM COORDINATOR ================= */
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

  /* ================= SUBJECT COORDINATOR ================= */
  "subject coordinator": [
    { title: "Dashboard", path: "subjectcoordinator", icon: LayoutDashboard },
    {
      title: "Subjects Overview",
      path: "subjectcoordinator/subjects",
      icon: BookOpen,
    },
    {
      title: "Teacher Assignment",
      path: "subjectcoordinator/teachers",
      icon: Users,
    },
    {
      title: "Class Assignment",
      path: "subjectcoordinator/classes",
      icon: Book,
    },
    {
      title: "Assessments",
      path: "subjectcoordinator/assessments",
      icon: ClipboardSignature,
    },
    {
      title: "Reports",
      path: "subjectcoordinator/reports",
      icon: FileBarChart2,
    },
    roleWorkspaceItem,
    ...commonSelfService("subjectcoordinator"),
  ],

  /* ================= LIBRARIAN ================= */
  librarian: [
    { title: "Dashboard", path: "librarian", icon: LayoutDashboard },
    { title: "Book Catalog", path: "librarian/book-catalog", icon: Book },
    {
      title: "Issue / Return",
      path: "librarian/issue-return",
      icon: ClipboardCheck,
    },
    { title: "Members", path: "librarian/members", icon: Users },
    { title: "Reports", path: "librarian/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("librarian"),
  ],

  /* ================= HOSTEL WARDEN ================= */
  "hostel warden": [
    { title: "Dashboard", path: "hostelwarden", icon: LayoutDashboard },
    { title: "Hostel Rooms", path: "hostelwarden/rooms", icon: BookOpen },
    {
      title: "Student Allocation",
      path: "hostelwarden/allocations",
      icon: Users,
    },
    {
      title: "Hostel Attendance",
      path: "hostelwarden/attendance",
      icon: UserCheck,
    },
    { title: "Visitor Log", path: "hostelwarden/visitors", icon: UserPlus },
    { title: "Reports", path: "hostelwarden/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("hostelwarden"),
  ],

  /* ================= TRANSPORT MANAGER ================= */
  "transport manager": [
    { title: "Dashboard", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    { title: "Drivers", path: "transportmanager/drivers", icon: Users },
    {
      title: "Fuel & Maintenance",
      path: "transportmanager/maintenance",
      icon: Fuel,
    },
    roleWorkspaceItem,
    ...commonSelfService("transportmanager"),
  ],

  /* ================= RECEPTIONIST ================= */
  receptionist: [
    { title: "Dashboard", path: "receptionist", icon: LayoutDashboard },
    {
      title: "Visitor Management",
      path: "receptionist/visitors",
      icon: UserPlus,
    },
    { title: "Enquiries", path: "receptionist/enquiries", icon: MessageSquare },
    {
      title: "Phone Calls Log",
      path: "receptionist/calls",
      icon: ClipboardCheck,
    },
    { title: "Broadcasts", path: "receptionist/broadcasts", icon: Bell },
    roleWorkspaceItem,
    ...commonSelfService("receptionist"),
  ],

  /* ================= IT SUPPORT ================= */
  "it support": [
    { title: "Dashboard", path: "itsupport", icon: LayoutDashboard },
    {
      title: "System Maintenance",
      path: "itsupport/maintenance",
      icon: Wrench,
    },
    {
      title: "User Support Tickets",
      path: "itsupport/tickets",
      icon: ClipboardList,
    },
    { title: "Network Status", path: "itsupport/network", icon: Fuel },
    { title: "System Logs", path: "itsupport/logs", icon: FileBarChart2 },
    { title: "Profile", path: "itsupport/profile", icon: User },
    roleWorkspaceItem,
  ],

  /* ================= COUNSELOR ================= */
  counselor: [
    { title: "Dashboard", path: "counselor", icon: LayoutDashboard },
    { title: "Student Profiles", path: "counselor/students", icon: Users },
    {
      title: "Counseling Sessions",
      path: "counselor/sessions",
      icon: CalendarClock,
    },
    { title: "Appointments", path: "counselor/appointments", icon: Clock },
    { title: "Reports", path: "counselor/reports", icon: FileBarChart2 },
    roleWorkspaceItem,
    ...commonSelfService("counselor"),
  ],

  /* ================= SECURITY ================= */
  security: [
    { title: "Dashboard", path: "security", icon: LayoutDashboard },
    {
      title: "Entry Register",
      path: "security/entry-register",
      icon: Clipboard,
    },
    { title: "Gate Logs", path: "security/gate-logs", icon: ClipboardList },
    {
      title: "Shift Attendance",
      path: "security/shift-attendance",
      icon: Clock,
    },
    { title: "Emergency Alerts", path: "security/alerts", icon: Bell },
    roleWorkspaceItem,
    ...commonSelfService("security"),
  ],

  /* ================= STAFF / SUPPORT STAFF ================= */
  staff: [
    { title: "Dashboard", path: "staff", icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks", icon: CalendarClock },
    { title: "My Attendance", path: "staff/attendance", icon: Clock },
    communicationMenu("staff"),
    { title: "Settings", path: "staff/settings", icon: Settings },
    ...commonSelfService("staff"),
  ],
  "support staff": [
    { title: "Dashboard", path: "staff", icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks", icon: CalendarClock },
    { title: "My Attendance", path: "staff/attendance", icon: Clock },
    communicationMenu("staff"),
    { title: "Settings", path: "staff/settings", icon: Settings },
    roleWorkspaceItem,
    ...commonSelfService("staff"),
  ],

  /* ================= LEGACY / ALIASES ================= */
  transport: [
    { title: "Dashboard", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    {
      title: "Assignments",
      path: "schooladmin/transport/assignments",
      icon: Bus,
    },
  ],
};

Object.keys(sidebarMenu).forEach((roleKey) => {
  const items = sidebarMenu[roleKey];
  if (!Array.isArray(items)) return;

  if (!items.some((item) => item?.path === moduleHubItem.path)) {
    items.push(moduleHubItem);
  }
  const rolePath = roleKey.replace(/\s+/g, "");
  const hasMessage = items.some(
    (item) =>
      item?.path === `${rolePath}/message` || item?.path?.endsWith("/message"),
  );
  if (!hasMessage)
    items.push({
      title: "Messages",
      path: `${rolePath}/message`,
      icon: MessageSquare,
    });
  if (!items.some((item) => item?.path === supportCenterItem.path)) {
    items.push(supportCenterItem);
  }
});
