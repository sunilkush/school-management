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
  UserPlus
} from "lucide-react";

export const sidebarMenu = {

  /* ================= SUPER ADMIN ================= */
  "super admin": [
    { title: "Dashboard", path: "superadmin", icon: LayoutDashboard },

    {
      title: "School Management",
      icon: School,
      subMenu: [
        { title: "School List", path: "superadmin/schools" },
        { title: "Subscription Plans", path: "superadmin/subscriptions" },
        { title: "School Reports", path: "superadmin/reports/schools" },
      ],
    },

    {
      title: "User Management",
      icon: Users,
      subMenu: [
        { title: "School Admins", path: "superadmin/users/admins" },
        { title: "Teachers", path: "superadmin/users/teachers" },
        { title: "Students", path: "superadmin/users/students" },
        { title: "Parents", path: "superadmin/users/parents" },
        { title: "Staff Members", path: "superadmin/users/staff" },
        { title: "Accountants", path: "superadmin/users/accountant" },
        { title: "Librarians", path: "superadmin/users/librarian" },
        { title: "Transport Staff", path: "superadmin/users/transport" },
      ],
    },

    {
      title: "Module Management",
      icon: Puzzle,
      subMenu: [{ title: "All Modules", path: "superadmin/modules" }],
    },

    {
      title: "Reports & Analytics",
      icon: FileText,
      subMenu: [
        { title: "Academic Reports", path: "superadmin/reports/academic" },
        { title: "Attendance Reports", path: "superadmin/reports/attendance" },
        { title: "Finance Reports", path: "superadmin/reports/finance" },
        { title: "Activity Logs", path: "superadmin/reports/activity" },
      ],
    },

    {
      title: "Academic Setup",
      icon: Settings,
      subMenu: [
        { title: "Academic Years", path: "superadmin/academic-years" },
        { title: "Classes & Sections", path: "superadmin/classes" },
        { title: "Subjects", path: "superadmin/subjects" },
        { title: "Departments", path: "superadmin/departments" },
        { title: "Designations", path: "superadmin/designations" },
      ],
    },

    {
      title: "System Administration",
      icon: Cog,
      subMenu: [
        { title: "Role Management", path: "superadmin/settings/roles" },
        { title: "Permission Management", path: "superadmin/settings/permissions" },
        { title: "System Backup", path: "superadmin/settings/backup" },
        { title: "Audit Logs", path: "superadmin/settings/audit" },
      ],
    },
  ],

  /* ================= SCHOOL ADMIN ================= */
  "school admin": [
    { title: "Dashboard", path: "schooladmin", icon: LayoutDashboard },

    {
      title: "User Management",
      icon: Users,
      subMenu: [
        { title: "Teachers & Staff", path: "schooladmin/users" },
        { title: "Students", path: "schooladmin/studentList" },
        { title: "Parents", path: "schooladmin/parents-register" },
      ],
    },

    {
      title: "Academic Management",
      icon: BookOpen,
      subMenu: [
        { title: "Classes", path: "schooladmin/classes" },
        { title: "Subjects", path: "schooladmin/subjects" },
      ],
    },

    {
      title: "Examination Management",
      icon: GraduationCap,
      subMenu: [
        { title: "Create Exam", path: "schooladmin/exams/create-exam" },
        { title: "Question Bank", path: "schooladmin/exams/question-bank" },
        { title: "Exam Schedule", path: "schooladmin/exams/schedule" },
        { title: "Grade Entry", path: "schooladmin/exams/grades" },
        { title: "Exam Reports", path: "schooladmin/exams/reports" },
      ],
    },

    {
      title: "Attendance Management",
      icon: UserCheck,
      subMenu: [
        { title: "Student Attendance", path: "schooladmin/attendance/students" },
        { title: "Staff Attendance", path: "schooladmin/attendance/staff" },
      ],
    },

    {
      title: "Fee Management",
      icon: CreditCard,
      subMenu: [
        { title: "Fee Categories", path: "schooladmin/fees/categories" },
        { title: "Fee Collection", path: "schooladmin/fees/collect" },
        { title: "Assign Fees", path: "schooladmin/fees/assign" },
      ],
    },

    {
      title: "Library Management",
      icon: Book,
      subMenu: [
        { title: "Books", path: "schooladmin/library/books" },
        { title: "Issue / Return", path: "schooladmin/library/issue" },
      ],
    },

    {
      title: "Transport Management",
      icon: Bus,
      subMenu: [
        { title: "Routes", path: "schooladmin/transport/routes" },
        { title: "Vehicles", path: "schooladmin/transport/vehicles" },
      ],
    },

    { title: "Reports", path: "schooladmin/reports", icon: FileBarChart2 },
    { title: "School Settings", path: "schooladmin/settings", icon: Settings },
  ],

  /* ================= TEACHER ================= */
  teacher: [
    { title: "Dashboard", path: "teacher", icon: LayoutDashboard },
    { title: "Assigned Classes", path: "teacher/classes", icon: Book },
    { title: "My Students", path: "teacher/students", icon: Users },
    { title: "Assignments", path: "teacher/assignments", icon: ClipboardList },
    { title: "Attendance", path: "teacher/attendance", icon: UserCheck },
    {
      title: "Examinations",
      icon: GraduationCap,
      subMenu: [
        { title: "Question Bank", path: "teacher/exams/question-bank" },
        { title: "Create Exam", path: "teacher/exams/create-exam" },
        { title: "Exam Reports", path: "teacher/exams/reports" },
      ],
    },
    { title: "Timetable", path: "teacher/timetable", icon: CalendarClock },
    { title: "Reports", path: "teacher/reports", icon: FileBarChart2 },
  ],

  /* ================= STUDENT ================= */
  student: [
    { title: "Dashboard", path: "student", icon: LayoutDashboard },
    { title: "Profile", path: "student/profile", icon: User },
    { title: "Live Exams", path: "student/exams/exam-live", icon: MessageCircle },
    { title: "Exam Review", path: "student/exams/attempt-review", icon: Clipboard },
    { title: "Homework", path: "student/homework", icon: ClipboardList },
    { title: "Attendance", path: "student/attendance", icon: UserCheck },
    { title: "Grades", path: "student/grades", icon: ClipboardSignature },
    { title: "Timetable", path: "student/timetable", icon: CalendarClock },
    { title: "Library", path: "student/library", icon: BookOpen },
    { title: "Transport", path: "student/transport", icon: Bus },
    { title: "Fees", path: "student/fees", icon: CreditCard },
  ],

  /* ================= PARENT ================= */
  parent: [
    { title: "Dashboard", path: "parent", icon: LayoutDashboard },
    { title: "Children Overview", path: "parent/children", icon: Users },
    { title: "Attendance", path: "parent/attendance", icon: UserCheck },
    { title: "Grades", path: "parent/grades", icon: Clipboard },
    { title: "Homework", path: "parent/homework", icon: ClipboardList },
    { title: "Fees", path: "parent/fees", icon: CreditCard },
    { title: "Messages", path: "parent/message", icon: MessageCircle },
    { title: "Reports", path: "parent/reports", icon: FileBarChart2 },
  ],

  /* ================= ACCOUNTANT ================= */
  accountant: [
    { title: "Dashboard", path: "accountant", icon: LayoutDashboard },
    { title: "Fee Collection", path: "accountant/fees/collect", icon: IndianRupee },
    { title: "Payroll Management", path: "accountant/salary", icon: IndianRupee },
    { title: "Financial Reports", path: "accountant/reports", icon: FileBarChart2 },
  ],

  /* ================= LIBRARIAN ================= */
  librarian: [
    { title: "Dashboard", path: "librarian", icon: LayoutDashboard },
    { title: "Library Management", path: "librarian/books", icon: BookOpen },
    { title: "Members", path: "librarian/members", icon: Users },
    { title: "Issue & Return", path: "librarian/records", icon: FileCheck },
    { title: "Library Reports", path: "librarian/reports", icon: FileBarChart2 },
  ],

  /* ================= TRANSPORT ================= */
  transport: [
    { title: "Dashboard", path: "transport", icon: LayoutDashboard },

    {
      title: "Vehicle Management",
      icon: BusFront,
      subMenu: [
        { title: "Add Vehicle", path: "transport/vehicles/add" },
        { title: "Vehicle List", path: "transport/vehicles/list" },
        { title: "Maintenance Records", path: "transport/vehicles/maintenance" },
      ],
    },

    {
      title: "Route Management",
      icon: MapPinned,
      subMenu: [
        { title: "Add Route", path: "transport/routes/add" },
        { title: "Route List", path: "transport/routes/list" },
      ],
    },

    {
      title: "Driver Management",
      icon: Users,
      subMenu: [
        { title: "Add Driver", path: "transport/drivers/add" },
        { title: "Driver List", path: "transport/drivers/list" },
      ],
    },

    { title: "Transport Reports", path: "transport/reports", icon: FileBarChart2 },
    { title: "Transport Settings", path: "transport/settings", icon: Settings },
  ],
};
