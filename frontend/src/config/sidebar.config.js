import {
  LayoutDashboard,
  School,

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
  HelpCircle,
  Building2,
  Bed,
  Wifi,
  Phone,
  Send,
  History,
  CalendarCheck,
  ShieldAlert,
  ListChecks,
  Stethoscope,
} from "lucide-react";
import RupeeIcon from "../components/icons/RupeeIcon";

const commonSelfService = (basePath) => [
  { title: "Profile", path: `${basePath}/profile`, icon: User },
];

/* Attendance + leave items for every employee role */
const employeeAttendance = (basePath, opts = {}) => {
  const items = [];
  if (!opts.skipGps)  items.push({ title: "GPS Check-In/Out", path: `${basePath}/attendance/self`, icon: MapPinned });
  if (!opts.skipMy)   items.push({ title: "My Attendance",    path: `${basePath}/attendance/my`,   icon: Clock });
  if (!opts.skipLeave) items.push({ title: "Leave Requests",  path: `${basePath}/leave`,           icon: CalendarClock });
  return items;
};

const communicationMenu = (basePath) => {
  if (basePath === "schooladmin") {
    return { title: "Communication", icon: MessageSquare, path: `${basePath}/communication` };
  }
  return {
    title: "Communication",
    icon: MessageSquare,
    subMenu: [
      { title: "Send Messages",   path: `${basePath}/message`,               icon: Send    },
      { title: "Notifications",   path: `${basePath}/notification`,           icon: Bell    },
      { title: "Message History", path: `${basePath}/communication/history`,  icon: History },
    ],
  };
};

const supportCenterItem = {
  title: "Support Center",
  icon: HelpCircle,
  subMenu: [
    { title: "Support Tickets", path: "support/tickets", icon: HelpCircle },
    { title: "Documentation",   path: "support/documentation", icon: FileText },
  ],
};

const roleWorkspaceItem = { title: "Role Workspace", path: "workspace", icon: ClipboardList };

export const sidebarMenu = {
  /* ================= SUPER ADMIN ================= */
  "super admin": [
    { title: "Platform Overview", path: "superadmin", icon: LayoutDashboard },
    {
      title: "Schools",
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
      title: "Users",
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
      ],
    },
    {
      title: "Academics",
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
      title: "Master Configurations",
      icon: Settings,
      subMenu: [
        { title: "Fee Categories", path: "superadmin/fees/categories" },
        { title: "Departments", path: "superadmin/departments" },
        { title: "Designations", path: "superadmin/designations" },
        { title: "Global Config", path: "superadmin/settings/global" },
      ],
    },
    {
      title: "System Control",
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
      title: "Support Center",
      icon: HelpCircle,
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
    { title: "Overview", path: "schooladmin", icon: LayoutDashboard },
    { title: "School Setup", path: "schooladmin/school-setup", icon: School },
    {
      title: "Users",
      icon: Users,
      subMenu: [
        { title: "Student Admission", path: "schooladmin/admission" },
        { title: "Admission Inquiries", path: "schooladmin/admission/inquiry" },
        { title: "Students", path: "schooladmin/studentList" },
        { title: "Student Promotion", path: "schooladmin/students/promotion" },
        { title: "Certificates", path: "schooladmin/students/certificates" },
        { title: "ID Cards", path: "schooladmin/students/id-cards" },
        { title: "Health Records", path: "schooladmin/health-records" },
        { title: "Discipline", path: "schooladmin/students/discipline" },
        { title: "Alumni", path: "schooladmin/students/alumni" },
        { title: "Canteen", path: "schooladmin/students/canteen" },
        { title: "PTM", path: "schooladmin/students/ptm" },
        { title: "Parents", path: "schooladmin/parents-register" },
        { title: "Teachers & Staff", path: "schooladmin/teacher" },
        { title: "Create User", path: "schooladmin/user-create" },
      ],
    },
    {
      title: "Academics",
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
      title: "Examinations",
      icon: GraduationCap,
      subMenu: [
        { title: "Exams List",    path: "schooladmin/exams/exams-list"    },
        { title: "Create Exam",   path: "schooladmin/exams/exams-create"  },
        { title: "Exam Schedule", path: "schooladmin/exams/schedule"      },
        { title: "Paper Builder", path: "schooladmin/exams/paper-builder" },
        { title: "Admit Card",    path: "schooladmin/exams/admit-card"    },
        { title: "Seat Plan",     path: "schooladmin/exams/seat-plan"     },
        { title: "Grade Entry",   path: "schooladmin/exams/grades"        },
        { title: "Analytics",     path: "schooladmin/exams/analytics"     },
        { title: "Exam Reports",  path: "schooladmin/exams/reports"       },
      ],
    },
    {
      title: "Attendance",
      icon: UserCheck,
      subMenu: [
        { title: "Dashboard",          path: "schooladmin/attendance/dashboard"  },
        { title: "Student Attendance", path: "schooladmin/attendance/students"   },
        { title: "Teacher Attendance", path: "schooladmin/attendance/teachers"   },
        { title: "Staff Attendance",   path: "schooladmin/attendance/staff"      },
        { title: "Leave Management",   path: "schooladmin/attendance/leave"      },
        { title: "Reports",            path: "schooladmin/attendance/reports"    },
        { title: "Analytics",          path: "schooladmin/attendance/analytics"  },
        { title: "Attendance Table",   path: "schooladmin/attendance/table"      },
        { title: "Monthly Attendance", path: "schooladmin/attendance/monthly"    },
        { title: "Geofence Settings",  path: "schooladmin/attendance/geofence"   },
      ],
    },
    {
      title: "Fees",
      icon: RupeeIcon,
      subMenu: [
        { title: "Fee Categories", path: "schooladmin/fees/categories" },
        { title: "Fee Collection", path: "schooladmin/fees/collect" },
        { title: "Fee Structures", path: "schooladmin/fees/feestructure" },
        { title: "Assign Fees", path: "schooladmin/fees/assign" },
      ],
    },
    {
      title: "Library",
      icon: Book,
      subMenu: [
        { title: "Books", path: "schooladmin/library/books" },
        { title: "Issue / Return", path: "schooladmin/library/issue" },
        { title: "Library Cards", path: "schooladmin/library/card" },
      ],
    },
    {
      title: "Transport",
      icon: Bus,
      subMenu: [
        { title: "Routes", path: "schooladmin/transport/routes" },
        { title: "Vehicles", path: "schooladmin/transport/vehicles" },
        { title: "Assignments", path: "schooladmin/transport/assignments" },
      ],
    },
    {
      title: "Hostel",
      icon: Building2,
      subMenu: [
        { title: "Hostel Rooms", path: "schooladmin/hostel" },
       /*  { title: "Room Allocation", path: "schooladmin/hostel/allocation" }, */
      ],
    },
    {
      title: "Payroll",
      icon: IndianRupee,
      subMenu: [
        { title: "Create Employee", path: "schooladmin/payroll/create-employee" },
        { title: "Salary Structures", path: "schooladmin/payroll/salary-structures" },
        { title: "Monthly Run", path: "schooladmin/payroll/monthly-run" },
        { title: "Payslip Center", path: "schooladmin/payroll/payslips" },
        { title: "Monthly Reports", path: "schooladmin/payroll/reports/monthly" },
        { title: "Salary Advance", path: "schooladmin/payroll/advance" },
        { title: "Bonus & Incentives", path: "schooladmin/payroll/bonus" },
        { title: "Reimbursements", path: "schooladmin/payroll/reimbursements" },
      ],
    },
    {
      title: "Inventory & Store",
      icon: Briefcase,
      path: "schooladmin/inventory",
    },
    communicationMenu("schooladmin"),
    { title: "Task Management", path: "schooladmin/tasks", icon: ListChecks },
    { title: "Reports", path: "schooladmin/reports", icon: FileBarChart2 },
    { title: "School Settings", path: "schooladmin/settings", icon: Settings },
    ...commonSelfService("schooladmin"),
  ],

  /* ================= TEACHER ================= */
  teacher: [
    { title: "Overview", path: "teacher", icon: LayoutDashboard },
    {
      title: "Classroom",
      icon: BookOpen,
      subMenu: [
        { title: "Assigned Classes", path: "teacher/classes" },
       /*  { title: "My Students", path: "teacher/students" }, */
        { title: "Assignments", path: "teacher/assignments" },
        { title: "Subject Resources", path: "teacher/resources" },
        { title: "Lesson Plans", path: "teacher/lesson-plans" },
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
        { title: "GPS Check-In/Out", path: "teacher/attendance/self" },
      ],
    },
    {
      title: "Exams & Questions",
      icon: GraduationCap,
      subMenu: [
        { title: "Exam List",     path: "teacher/exams/list"          },
        { title: "Question Bank", path: "teacher/exams/question-bank" },
        { title: "Evaluation",    path: "teacher/exams/evaluation"    },
        { title: "Exam Reports",  path: "teacher/exams/reports"       },
      ],
    },
    { title: "Teacher Reports", path: "teacher/reports", icon: FileBarChart2 },
    { title: "Leave Requests", path: "teacher/leave", icon: CalendarClock },
    { title: "My Tasks", path: "teacher/tasks", icon: ListChecks },
    { title: "My Payroll", path: "teacher/payroll", icon: IndianRupee },
    communicationMenu("teacher"),
    ...commonSelfService("teacher"),
  ],

  /* ================= STUDENT ================= */
  student: [
    { title: "Overview", path: "student", icon: LayoutDashboard },
    { title: "Homework", path: "student/homework", icon: ClipboardCheck },
    { title: "Attendance", path: "student/attendance", icon: UserCheck },
    { title: "Grades", path: "student/grades", icon: FileCheck },
    { title: "Timetable", path: "student/timetable", icon: CalendarClock },
    { title: "Library", path: "student/library", icon: Book },
    { title: "Study Materials", path: "student/study-materials", icon: BookOpen },
    { title: "Hostel", path: "student/hostel", icon: Building2 },
    { title: "Transport", path: "student/transport", icon: Bus },
    { title: "Fees", path: "student/fees", icon: RupeeIcon },
    { title: "Leave Requests", path: "student/leave", icon: CalendarClock },
    { title: "Exams", path: "student/exams", icon: GraduationCap },
    { title: "Academic Calendar", path: "student/calendar", icon: CalendarClock },
    communicationMenu("student"),
    ...commonSelfService("student"),
  ],

  /* ================= PARENT ================= */
  parent: [
    { title: "Overview",          path: "parent",              icon: LayoutDashboard },
    { title: "My Children",       path: "parent/children",     icon: Users },
    { title: "PTM Booking",       path: "parent/ptm",          icon: CalendarClock },
    { title: "Attendance",        path: "parent/attendance",   icon: UserCheck },
    { title: "Grades",            path: "parent/grades",       icon: FileCheck },
    { title: "Homework",          path: "parent/homework",     icon: ClipboardCheck },
    { title: "Fees",              path: "parent/fees",         icon: RupeeIcon },
    { title: "Timetable",         path: "parent/timetable",    icon: CalendarClock },
    { title: "Exams",             path: "parent/exams",        icon: GraduationCap },
    { title: "Leave Requests",    path: "parent/leave",        icon: CalendarClock },
    { title: "Transport",         path: "parent/transport",    icon: Bus },
    { title: "Hostel",            path: "parent/hostel",       icon: Building2  },
    { title: "Library",           path: "parent/library",      icon: Book },
    { title: "Calendar",          path: "parent/calendar",     icon: CalendarClock },
    { title: "Progress Report",   path: "parent/progress",     icon: FileBarChart2 },
    communicationMenu("parent"),
    ...commonSelfService("parent"),
  ],

  /* ================= ACCOUNTANT ================= */
  accountant: [
    { title: "Dashboard",         path: "accountant",                    icon: LayoutDashboard },
    { title: "Fee Collection",    path: "accountant/fees/collect",       icon: RupeeIcon  },
    { title: "Fee Reports",       path: "accountant/fees/reports",       icon: FileBarChart2 },
    { title: "Income",            path: "accountant/income",             icon: IndianRupee },
    { title: "Expenses",          path: "accountant/expenses",           icon: Receipt },
    { title: "Financial Reports", path: "accountant/reports",            icon: FileText },
    {
      title: "Payroll",
      icon: Briefcase,
      subMenu: [
        { title: "Salary Run",        path: "accountant/salary" },
        { title: "Salary Structures", path: "accountant/salary/structures" },
        { title: "Create Employee",   path: "accountant/salary/create-employee" },
        { title: "Payslip Center",    path: "accountant/salary/payslips" },
        { title: "Monthly Reports",   path: "accountant/salary/reports/monthly" },
        { title: "Salary Advance",    path: "accountant/salary/advance" },
        { title: "Bonus & Incentives",path: "accountant/salary/bonus" },
        { title: "Reimbursements",    path: "accountant/salary/reimbursements" },
        { title: "My Payroll",        path: "accountant/payroll" },
      ],
    },
    { title: "My Attendance",      path: "accountant/attendance",         icon: UserCheck     },
    { title: "GPS Check-In/Out",  path: "accountant/attendance/self",    icon: MapPinned     },
    { title: "Attendance Reports",path: "accountant/attendance/monthly", icon: FileBarChart2 },
    { title: "Leave Requests",    path: "accountant/leave",              icon: CalendarClock },
    { title: "My Tasks",          path: "accountant/tasks",              icon: ListChecks    },
    communicationMenu("accountant"),
    ...commonSelfService("accountant"),
  ],

  /* ================= PRINCIPAL ================= */
  principal: [
    { title: "Overview", path: "principal", icon: LayoutDashboard },
    { title: "Staff",    path: "principal/staff",    icon: Briefcase    },
    { title: "Students", path: "principal/students", icon: GraduationCap },
    { title: "Academic Reports", path: "principal/reports/academic", icon: GraduationCap },
    { title: "Timetable", path: "principal/timetable", icon: CalendarClock },
    { title: "Attendance Reports", path: "principal/reports/attendance", icon: UserCheck },
    { title: "Mark Attendance", path: "principal/attendance/mark", icon: ClipboardCheck },
    { title: "Attendance Table", path: "principal/attendance/table", icon: ClipboardList },
    { title: "Exams", path: "principal/exams", icon: GraduationCap },
    { title: "Library", path: "principal/library", icon: Book },
    { title: "Transport", path: "principal/transport", icon: Bus },
    { title: "My Tasks",         path: "principal/tasks",   icon: ListChecks   },
    { title: "My Payroll",       path: "principal/payroll", icon: IndianRupee  },
    ...employeeAttendance("principal"),
    ...commonSelfService("principal"),
  ],

  /* ================= VICE PRINCIPAL ================= */
  "vice principal": [
    { title: "Overview", path: "viceprincipal", icon: LayoutDashboard },
    { title: "Discipline", path: "viceprincipal/discipline", icon: ShieldAlert },
    { title: "PTM", path: "viceprincipal/ptm", icon: CalendarClock },
    { title: "Timetable", path: "viceprincipal/timetable", icon: CalendarClock },
    { title: "Exams & Grades", path: "viceprincipal/exams", icon: GraduationCap },
    { title: "Student Attendance", path: "viceprincipal/attendance/students", icon: UserCheck },
    { title: "Teacher Attendance", path: "viceprincipal/attendance/staff", icon: UserCheck },
    { title: "Attendance Table", path: "viceprincipal/attendance/table", icon: ClipboardCheck },
    { title: "Reports",          path: "viceprincipal/reports",          icon: FileBarChart2  },
    { title: "My Tasks",   path: "viceprincipal/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "viceprincipal/payroll", icon: IndianRupee },
    ...employeeAttendance("viceprincipal"),
    roleWorkspaceItem,
    ...commonSelfService("viceprincipal"),
  ],

  /* ================= EXAM COORDINATOR ================= */
  "exam coordinator": [
    { title: "Overview", path: "examcoordinator", icon: LayoutDashboard },
    {
      title: "Exam Operations",
      icon: GraduationCap,
      subMenu: [
        { title: "Exam List",     path: "examcoordinator/exams/list"          },
        { title: "Create Exams",  path: "examcoordinator/exams/create"        },
        { title: "Exam Schedule", path: "examcoordinator/exams/schedule"      },
        { title: "Question Bank", path: "examcoordinator/exams/question-bank" },
        { title: "Paper Builder", path: "examcoordinator/exams/paper-builder" },
        { title: "Admit Card",    path: "examcoordinator/exams/admit-card"    },
        { title: "Seat Plan",     path: "examcoordinator/exams/seat-plan"     },
        { title: "Grade Entry",   path: "examcoordinator/exams/grades"        },
        { title: "Analytics",     path: "examcoordinator/exams/analytics"     },
        { title: "Exam Reports",  path: "examcoordinator/reports"             },
      ],
    },
    communicationMenu("examcoordinator"),
    { title: "My Tasks",   path: "examcoordinator/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "examcoordinator/payroll", icon: IndianRupee },
    ...employeeAttendance("examcoordinator"),
    ...commonSelfService("examcoordinator"),
  ],

  /* ================= SUBJECT COORDINATOR ================= */
  "subject coordinator": [
    { title: "Overview", path: "subjectcoordinator", icon: LayoutDashboard },
    { title: "Subjects Overview", path: "subjectcoordinator/subjects", icon: BookOpen },
    { title: "Teachers", path: "subjectcoordinator/teachers", icon: Users },
    { title: "Classes", path: "subjectcoordinator/classes", icon: Book },
    { title: "Assessments", path: "subjectcoordinator/assessments", icon: ClipboardSignature },
    { title: "Reports", path: "subjectcoordinator/reports", icon: FileBarChart2 },
    { title: "My Tasks",   path: "subjectcoordinator/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "subjectcoordinator/payroll", icon: IndianRupee },
    ...employeeAttendance("subjectcoordinator"),
    roleWorkspaceItem,
    ...commonSelfService("subjectcoordinator"),
  ],

  /* ================= LIBRARIAN ================= */
  librarian: [
    { title: "Dashboard", path: "librarian", icon: LayoutDashboard },
    { title: "Book Catalog", path: "librarian/book-catalog", icon: Book },
    { title: "Issue / Return", path: "librarian/issue-return", icon: ClipboardCheck },
    { title: "Members", path: "librarian/members", icon: Users },
    { title: "Fine Management", path: "librarian/fines", icon: RupeeIcon },
    { title: "Reports", path: "librarian/reports", icon: FileBarChart2 },
    { title: "Library Settings", path: "librarian/settings", icon: Settings },
    { title: "My Tasks",   path: "librarian/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "librarian/payroll", icon: IndianRupee },
    ...employeeAttendance("librarian"),
    roleWorkspaceItem,
    ...commonSelfService("librarian"),
  ],

  /* ================= HOSTEL WARDEN ================= */
  "hostel warden": [
    { title: "Dashboard",         path: "hostelwarden",                    icon: LayoutDashboard },
    { title: "Rooms",             path: "hostelwarden/rooms",              icon: Bed      },
    { title: "Allocations",       path: "hostelwarden/allocations",        icon: Users },
    { title: "Leave Requests",    path: "hostelwarden/leaves",             icon: CalendarClock  },
    { title: "Visitor Log",       path: "hostelwarden/visitors",           icon: UserPlus },
    { title: "Complaints",        path: "hostelwarden/complaints",         icon: MessageCircle },
    { title: "Attendance",        path: "hostelwarden/hostel-attendance",  icon: UserCheck },
    { title: "Reports",           path: "hostelwarden/hostel-reports",     icon: FileBarChart2 },
    { title: "My Tasks",   path: "hostelwarden/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "hostelwarden/payroll", icon: IndianRupee },
    ...employeeAttendance("hostelwarden"),
    ...commonSelfService("hostelwarden"),
  ],

  /* ================= TRANSPORT MANAGER ================= */
  "transport manager": [
    { title: "Overview", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    { title: "Drivers", path: "transportmanager/drivers", icon: Users },
    { title: "Assignments", path: "transportmanager/assignments", icon: ClipboardCheck },
    { title: "Fuel & Maintenance", path: "transportmanager/maintenance", icon: Fuel },
    { title: "My Tasks",   path: "transportmanager/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "transportmanager/payroll", icon: IndianRupee },
    ...employeeAttendance("transportmanager"),
    roleWorkspaceItem,
    ...commonSelfService("transportmanager"),
  ],

  /* ================= RECEPTIONIST ================= */
  receptionist: [
    { title: "Overview", path: "receptionist", icon: LayoutDashboard },
    { title: "Visitor Management", path: "receptionist/visitors", icon: UserPlus },
    { title: "Enquiries", path: "receptionist/enquiries", icon: MessageSquare },
    { title: "Phone Calls Log", path: "receptionist/calls", icon: Phone },
    { title: "Broadcasts", path: "receptionist/broadcasts", icon: Bell },
    { title: "My Tasks",   path: "receptionist/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "receptionist/payroll", icon: IndianRupee },
    ...employeeAttendance("receptionist"),
    roleWorkspaceItem,
    ...commonSelfService("receptionist"),
  ],

  /* ================= IT SUPPORT ================= */
  "it support": [
    { title: "Overview", path: "itsupport", icon: LayoutDashboard },
    { title: "System Maintenance", path: "itsupport/maintenance", icon: Wrench },
    { title: "User Support Tickets", path: "itsupport/tickets", icon: HelpCircle },
    { title: "Network Status",       path: "itsupport/network", icon: Wifi       },
    { title: "System Logs", path: "itsupport/logs", icon: FileBarChart2 },
    { title: "My Tasks",   path: "itsupport/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "itsupport/payroll", icon: IndianRupee },
    ...employeeAttendance("itsupport"),
    roleWorkspaceItem,
    { title: "Profile", path: "itsupport/profile", icon: User },
  ],

  /* ================= COUNSELOR ================= */
  counselor: [
    { title: "Overview", path: "counselor", icon: LayoutDashboard },
    { title: "Student Profiles", path: "counselor/students", icon: Users },
    { title: "Counseling Sessions", path: "counselor/sessions", icon: CalendarClock },
    { title: "Appointments", path: "counselor/appointments", icon: CalendarCheck },
    { title: "Reports", path: "counselor/reports", icon: FileBarChart2 },
    { title: "My Tasks",   path: "counselor/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "counselor/payroll", icon: IndianRupee },
    ...employeeAttendance("counselor"),
    roleWorkspaceItem,
    ...commonSelfService("counselor"),
  ],

  /* ================= SECURITY ================= */
  security: [
    { title: "Overview", path: "security", icon: LayoutDashboard },
    { title: "Entry Register", path: "security/entry-register", icon: Clipboard },
    { title: "Gate Logs", path: "security/gate-logs", icon: ClipboardList },
    { title: "Shift Attendance", path: "security/shift-attendance", icon: Clock },
    { title: "Emergency Alerts", path: "security/alerts", icon: ShieldAlert },
    { title: "My Tasks",   path: "security/tasks",   icon: ListChecks  },
    { title: "My Payroll", path: "security/payroll", icon: IndianRupee },
    ...employeeAttendance("security", { skipMy: true }),
    roleWorkspaceItem,
    ...commonSelfService("security"),
  ],

  /* ================= CLASS TEACHER ================= */
  "class teacher": [
    { title: "Overview", path: "classteacher", icon: LayoutDashboard },
    { title: "My Tasks", path: "classteacher/tasks", icon: ListChecks },
    { title: "My Payroll", path: "classteacher/payroll", icon: IndianRupee },
    ...commonSelfService("classteacher"),
  ],

  /* ================= SPORTS TEACHER ================= */
  "sports teacher": [
    { title: "Overview", path: "sportsteacher", icon: LayoutDashboard },
    { title: "My Tasks", path: "sportsteacher/tasks", icon: ListChecks },
    { title: "My Payroll", path: "sportsteacher/payroll", icon: IndianRupee },
    ...commonSelfService("sportsteacher"),
  ],

  /* ================= LAB TECHNICIAN ================= */
  "lab technician": [
    { title: "Overview", path: "labtechnician", icon: LayoutDashboard },
    { title: "My Tasks", path: "labtechnician/tasks", icon: ListChecks },
    { title: "My Payroll", path: "labtechnician/payroll", icon: IndianRupee },
    ...commonSelfService("labtechnician"),
  ],

  /* ================= MEDICAL OFFICER ================= */
  "medical officer": [
    { title: "Overview", path: "medicalofficer", icon: LayoutDashboard },
    { title: "My Tasks", path: "medicalofficer/tasks", icon: ListChecks },
    { title: "My Payroll", path: "medicalofficer/payroll", icon: IndianRupee },
    ...commonSelfService("medicalofficer"),
  ],

  /* ================= STAFF / SUPPORT STAFF ================= */
  staff: [
    { title: "Overview",         path: "staff",                icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks",          icon: CalendarClock   },
    { title: "My Attendance",    path: "staff/attendance",     icon: Clock           },
    { title: "GPS Check-In/Out", path: "staff/attendance/self",icon: MapPinned       },
    { title: "Leave Requests",   path: "staff/leave",          icon: CalendarClock   },
    communicationMenu("staff"),
    ...commonSelfService("staff"),
  ],
  "support staff": [
    { title: "Overview",         path: "staff",                icon: LayoutDashboard },
    { title: "Tasks & Schedule", path: "staff/tasks",          icon: CalendarClock   },
    { title: "My Attendance",    path: "staff/attendance",     icon: Clock           },
    { title: "GPS Check-In/Out", path: "staff/attendance/self",icon: MapPinned       },
    { title: "Leave Requests",   path: "staff/leave",          icon: CalendarClock   },
    communicationMenu("staff"),
    roleWorkspaceItem,
    ...commonSelfService("staff"),
  ],

  /* ================= SPORTS TEACHER ================= */
  "sports teacher": [
    { title: "Dashboard",        path: "sportsteacher",                  icon: LayoutDashboard },
    { title: "My Classes",       path: "sportsteacher/classes",          icon: BookOpen        },
    { title: "My Students",      path: "sportsteacher/students",         icon: Users           },
    { title: "Mark Attendance",  path: "sportsteacher/attendance/students", icon: ClipboardCheck },
    { title: "Assignments",      path: "sportsteacher/assignments",      icon: ClipboardList   },
    { title: "My Payroll",       path: "sportsteacher/payroll",          icon: IndianRupee     },
    { title: "My Tasks",         path: "sportsteacher/tasks",            icon: ListChecks      },
    ...employeeAttendance("sportsteacher"),
    communicationMenu("sportsteacher"),
    ...commonSelfService("sportsteacher"),
  ],

  /* ================= LAB TECHNICIAN ================= */
  "lab technician": [
    { title: "Dashboard",        path: "labtechnician",                  icon: LayoutDashboard },
    { title: "Lab Students",     path: "labtechnician/students",         icon: Users           },
    { title: "Lab Schedule",     path: "labtechnician/timetable",        icon: CalendarCheck   },
    { title: "My Payroll",       path: "labtechnician/payroll",          icon: IndianRupee     },
    { title: "My Tasks",         path: "labtechnician/tasks",            icon: ListChecks      },
    ...employeeAttendance("labtechnician"),
    communicationMenu("labtechnician"),
    ...commonSelfService("labtechnician"),
  ],

  /* ================= MEDICAL OFFICER ================= */
  "medical officer": [
    { title: "Dashboard",        path: "medicalofficer",                 icon: LayoutDashboard },
    { title: "Students",         path: "medicalofficer/students",        icon: Users           },
    { title: "Health Records",   path: "medicalofficer/health-records",  icon: Stethoscope     },
    { title: "My Payroll",       path: "medicalofficer/payroll",         icon: IndianRupee     },
    { title: "My Tasks",         path: "medicalofficer/tasks",           icon: ListChecks      },
    ...employeeAttendance("medicalofficer"),
    communicationMenu("medicalofficer"),
    ...commonSelfService("medicalofficer"),
  ],

  /* ================= CLASS TEACHER ================= */
  "class teacher": [
    { title: "Dashboard",        path: "classteacher",                   icon: LayoutDashboard },
    { title: "My Class",         path: "classteacher/my-class",          icon: BookOpen        },
    { title: "My Students",      path: "classteacher/students",          icon: Users           },
    { title: "Discipline",       path: "classteacher/discipline",        icon: ShieldAlert     },
    { title: "PTM",              path: "classteacher/ptm",               icon: CalendarClock   },
    { title: "Mark Attendance",  path: "classteacher/attendance/students", icon: ClipboardCheck },
    { title: "Assignments",      path: "classteacher/assignments",       icon: ClipboardList   },
    { title: "Timetable",        path: "classteacher/timetable",         icon: CalendarCheck   },
    { title: "My Payroll",       path: "classteacher/payroll",           icon: IndianRupee     },
    { title: "My Tasks",         path: "classteacher/tasks",             icon: ListChecks      },
    ...employeeAttendance("classteacher"),
    communicationMenu("classteacher"),
    ...commonSelfService("classteacher"),
  ],

  /* ================= LEGACY / ALIASES ================= */
  transport: [
    { title: "Overview", path: "transportmanager", icon: LayoutDashboard },
    { title: "Routes", path: "transportmanager/routes", icon: MapPinned },
    { title: "Vehicles", path: "transportmanager/vehicles", icon: BusFront },
    { title: "Assignments", path: "schooladmin/transport/assignments", icon: Bus },
  ],
};

/**
 * Items shown ONLY when a role is used as an ADDITIONAL (secondary) role.
 * Keep this list to features genuinely unique to that role — no duplicates of
 * common items (Payroll, Tasks, Profile, Module Hub, Leave, etc.).
 */
export const additionalRoleMenus = {
  "class teacher": [
    { title: "My Class",         path: "classteacher/my-class",             icon: BookOpen       },
    { title: "Class Students",   path: "classteacher/students",             icon: Users          },
    { title: "Class Attendance", path: "classteacher/attendance/students",  icon: ClipboardCheck },
  ],
  "exam coordinator": [
    { title: "Exam Coord. Hub",  path: "examcoordinator",                   icon: GraduationCap  },
  ],
  "subject coordinator": [
    { title: "Subject Coord.",   path: "subjectcoordinator",                icon: BookOpen       },
  ],
  "sports teacher": [],
  "lab technician": [],
  "medical officer": [],
  "principal": [],
  "vice principal": [],
};

Object.keys(sidebarMenu).forEach((roleKey) => {
  const items = sidebarMenu[roleKey];
  if (!Array.isArray(items)) return;
 
   //const rolePath = roleKey.replace(/\s+/g, "");
  //const hasMessage = items.some((item) => item?.path === `${rolePath}/message` || item?.path?.endsWith("/message"));
  //if (!hasMessage) items.push({ title: "Messages", path: `${rolePath}/message`, icon: MessageSquare });
  if (!items.some((item) => item?.title === "Support Center")) {
    items.push(supportCenterItem);
  }
});

