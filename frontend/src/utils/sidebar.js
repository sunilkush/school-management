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
        { title: "School Board", path: "superadmin/boards" },
        { title: "Classes & Sections", path: "superadmin/classes" },
        { title: "Subjects", path: "superadmin/subjects" },
        { title: "Chapters & Topics", path: "superadmin/chapters-topics" },
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
    { title: "My Self", path: "schooladmin/profile", icon: User, },
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
        { title: "Exam Create", path: "schooladmin/exams/exams-create"},
        { title: "Exams List", path: "schooladmin/exams/exams-list" },
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
        { title: "Exams List", path: "teacher/exams/list" },
        { title: "Question Bank", path: "teacher/exams/question-bank" },
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
  /* ================= SUPPORT STAFF ================= */
  "support staff": [
    { title: "Dashboard", path: "support", icon: LayoutDashboard },
    { title: "Assigned Tasks", path: "support/tasks", icon: ClipboardList },
    { title: "Attendance", path: "support/attendance", icon: Clock },
    { title: "Notices", path: "support/notices", icon: Bell },
    { title: "Messages", path: "support/messages", icon: MessageSquare, },
    {title: "Profile",path: "support/profile",icon: User,},
  ],
  /* ================= SECURITY ================= */
  security: [
    { title: "Dashboard", path: "security", icon: LayoutDashboard },
    {title: "Visitor Entry",path: "security/visitors",icon: UserPlus,},
    {title: "Gate Log",path: "security/gate-log",icon: ClipboardCheck,},
    {title: "Shift Attendance",path: "security/attendance",icon: Clock,},
    {title: "Emergency Alerts",path: "security/alerts",icon: Bell,},
    {title: "Profile", path: "security/profile",icon: User,},
  ],
  /* ================= PRINCIPAL ================= */
  "principal": [
    { title: "Dashboard", path: "principal", icon: LayoutDashboard },
    {title: "School Overview",path: "principal/overview",icon: School,},
    {title: "Staff Management",path: "principal/staff",icon: Users,},
    {title: "Student Management",path: "principal/students",icon: Users,},
    {title: "Academic Reports",path: "principal/reports/academic",icon: FileText,},
    {title: "Attendance Reports",path: "principal/reports/attendance",icon: CalendarClock,},
    { title: "Exams & Grades", path: "principal/exams", icon: GraduationCap },
    { title: "Library Overview", path: "principal/library", icon: BookOpen },
    { title: "Transport Overview", path: "principal/transport", icon: Bus },
    { title: "School Settings", path: "principal/settings", icon: Settings },
  ],

  /* ================= VICE PRINCIPAL ================= */
  "vice principal": [
    { title: "Dashboard", path: "viceprincipal", icon: LayoutDashboard },
    { title: "Academic Management", path: "viceprincipal/academics", icon: BookOpen },
    { title: "Exams & Grades", path: "viceprincipal/exams", icon: GraduationCap },
    { title: "Student Attendance", path: "viceprincipal/attendance/students", icon: UserCheck },
    { title: "Teacher Attendance", path: "viceprincipal/attendance/staff", icon: UserCheck },
    { title: "Reports", path: "viceprincipal/reports", icon: FileBarChart2 },
    { title: "Profile", path: "viceprincipal/profile", icon: User },
  ],

  /* ================= EXAM COORDINATOR ================= */
  "exam coordinator": [
    { title: "Dashboard", path: "examcoordinator", icon: LayoutDashboard },
    { title: "Create Exams", path: "examcoordinator/exams/create", icon: GraduationCap },
    { title: "Question Bank", path: "examcoordinator/exams/question-bank", icon: ClipboardList },
    { title: "Exam Schedule", path: "examcoordinator/exams/schedule", icon: CalendarClock },
    { title: "Grade Entry", path: "examcoordinator/exams/grades", icon: ClipboardSignature },
    { title: "Exam Reports", path: "examcoordinator/reports", icon: FileBarChart2 },
    { title: "Profile", path: "examcoordinator/profile", icon: User },
  ],

  /* ================= RECEPTIONIST ================= */
  "receptionist": [
    { title: "Dashboard", path: "receptionist", icon: LayoutDashboard },
    { title: "Visitor Management", path: "receptionist/visitors", icon: UserPlus },
    { title: "Enquiries", path: "receptionist/enquiries", icon: MessageSquare },
    { title: "Phone Calls Log", path: "receptionist/calls", icon: ClipboardCheck },
    { title: "Notifications", path: "receptionist/notifications", icon: Bell },
    { title: "Profile", path: "receptionist/profile", icon: User },
  ],

  /* ================= IT SUPPORT ================= */
  "it support": [
    { title: "Dashboard", path: "itsupport", icon: LayoutDashboard },
    { title: "System Maintenance", path: "itsupport/maintenance", icon: Wrench },
    { title: "User Support Tickets", path: "itsupport/tickets", icon: ClipboardList },
    { title: "Network Status", path: "itsupport/network", icon: Fuel },
    { title: "System Logs", path: "itsupport/logs", icon: FileBarChart2 },
    { title: "Profile", path: "itsupport/profile", icon: User },
  ],

  /* ================= COUNSELOR ================= */
  "counselor": [
    { title: "Dashboard", path: "counselor", icon: LayoutDashboard },
    { title: "Student Profiles", path: "counselor/students", icon: Users },
    { title: "Counseling Sessions", path: "counselor/sessions", icon: CalendarClock },
    { title: "Appointments", path: "counselor/appointments", icon: Clock },
    { title: "Reports", path: "counselor/reports", icon: FileBarChart2 },
    { title: "Profile", path: "counselor/profile", icon: User },
  ],

  /* ================= SUBJECT COORDINATOR ================= */
  "subject coordinator": [
    { title: "Dashboard", path: "subjectcoordinator", icon: LayoutDashboard },
    { title: "Subjects Overview", path: "subjectcoordinator/subjects", icon: BookOpen },
    { title: "Teacher Assignment", path: "subjectcoordinator/teachers", icon: Users },
    { title: "Class Assignment", path: "subjectcoordinator/classes", icon: Book },
    { title: "Exams & Grades", path: "subjectcoordinator/exams", icon: GraduationCap },
    { title: "Reports", path: "subjectcoordinator/reports", icon: FileBarChart2 },
    { title: "Profile", path: "subjectcoordinator/profile", icon: User },
  ],

  /* ================= HOSTEL WARDEN ================= */
  "hostel warden": [
    { title: "Dashboard", path: "hostelwarden", icon: LayoutDashboard },
    { title: "Hostel Rooms", path: "hostelwarden/rooms", icon: BookOpen },
    { title: "Student Allocation", path: "hostelwarden/students", icon: Users },
    { title: "Attendance", path: "hostelwarden/attendance", icon: UserCheck },
    { title: "Visitor Log", path: "hostelwarden/visitors", icon: UserPlus },
    { title: "Reports", path: "hostelwarden/reports", icon: FileBarChart2 },
    { title: "Profile", path: "hostelwarden/profile", icon: User },
  ],

};
