import {
  LayoutDashboard,
  School,
  UserCog,
  ShieldCheck,
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
  "super admin": [
    { title: "Dashboard", path: "superadmin", icon: LayoutDashboard },
    {
      title: "Schools",
      icon: School,
      subMenu: [
        { title: "School List", path: "superadmin/schools" },
        { title: "Subscription Plans", path: "superadmin/subscriptions" },
        { title: "School Reports", path: "superadmin/reports/schools" },
      ],
    },
    {
      title: "Users Management",
      icon: Users,
      subMenu: [
        { title: "School Admins", path: "superadmin/users/admins" },
        { title: "Teachers", path: "superadmin/users/teachers" },
        { title: "Students", path: "superadmin/users/students" },
        { title: "Parents", path: "superadmin/users/parents" },
        { title: "Staff Members", path: "superadmin/users/staff" },
        { title: "Accountant", path: "superadmin/users/accountant" },
        { title: "Librarian", path: "superadmin/users/librarian" },
        { title: "Transport", path: "superadmin/users/transport" },
      ],
    },
    {
      title: "Modules",
      icon: Puzzle,
      subMenu: [{ title: "All Modules", path: "superadmin/modules", icon: Puzzle }],
    },
    {
      title: "Reports",
      path: "superadmin/reports",
      icon: FileText,
      subMenu: [
        { title: "School-Wise Reports", path: "superadmin/reports/school-wise" },
        { title: "Attendance Summary", path: "superadmin/reports/attendance" },
        { title: "Finance Summary", path: "superadmin/reports/finance" },
        { title: "Academic Reports", path: "superadmin/reports/academic" },
        { title: "Activity Logs", path: "superadmin/reports/activity" },
      ],
    },
    {
      title: "Master Settings",
      path: "superadmin/settings",
      icon: Settings,
      subMenu: [
        { title: "Academic Years", path: "superadmin/academic-years" },
        { title: "Classes & Sections", path: "superadmin/classes" },
        { title: "Subjects", path: "superadmin/subjects" },
        { title: "Fee Categories", path: "superadmin/fees/categories" },
        { title: "Designations", path: "superadmin/designations" },
        { title: "Departments", path: "superadmin/departments" },
      ],
    },
    {
      title: "System Settings",
      icon: Cog,
      subMenu: [
        { title: "Global Configuration", path: "superadmin/settings/global" },
        { title: "Role Manager", path: "superadmin/settings/roles" },
        { title: "Permission Manager", path: "superadmin/settings/permissions" },
        { title: "Backups", path: "superadmin/settings/backup" },
        { title: "Audit Logs", path: "superadmin/settings/audit" },
      ],
    },
  ],

  "school admin": [
    { title: "Dashboard", path: "schooladmin", icon: LayoutDashboard },
    {
      title: "Teachers & Students",
      icon: Users,
      subMenu: [
        { title: "Teachers & Staff", path: "schooladmin/users", icon: Users },
        { title: "Students", path: "schooladmin/studentList", icon: Users },
        { title: "Parents Register", path: "schooladmin/parents-register", icon: Users },
      ],
    },
    {
      title: "Classes & Subjects",
      icon: BookOpen,
      subMenu: [
        { title: "Manage Classes", path: "schooladmin/classes", icon: Book },
        { title: "Subjects", path: "schooladmin/subjects", icon: BookOpen },
      ],
    },
    {
      title: "Exams & Grades",
      icon: GraduationCap,
      subMenu: [
         { title: "Create Exam", path: "schooladmin/exams/create-exam", icon: ClipboardList },
          { title: "Question Bank", path: "schooladmin/exams/question-bank", icon: ClipboardList },
        { title: "Schedule Exams", path: "schooladmin/exams/schedule", icon: ClipboardSignature },
        { title: "Enter Grades", path: "schooladmin/exams/grades", icon: ClipboardList },
        { title: "Exams", path: "schooladmin/exams/exams-list", icon: ClipboardList },
       
       
        { title: "Reports", path: "schooladmin/exams/reports", icon: ClipboardList },
      ],
    },
    {
      title: "Attendance",
      icon: UserCheck,
      subMenu: [
        { title: "Student Attendance", path: "schooladmin/attendance/students", icon: UserCheck },
        { title: "Staff Attendance", path: "schooladmin/attendance/staff", icon: ClipboardCheck },
      ],
    },
    {
      title: "Library",
      icon: BookOpen,
      subMenu: [
        { title: "Books", path: "schooladmin/library/books", icon: Book },
        { title: "Issue Book", path: "schooladmin/library/issue", icon: FileCheck },
        { title: "Issue Card", path: "schooladmin/library/card", icon: FileCheck },
      ],
    },
    {
      title: "Timetables",
      icon: CalendarClock,
      subMenu: [
        { title: "Class Timetable", path: "schooladmin/timetable/class", icon: CalendarClock },
        { title: "Teacher Timetable", path: "schooladmin/timetable/teacher", icon: CalendarClock },
      ],
    },
    {
      title: "Fees Management",
      icon: CreditCard,
      subMenu: [
        { title: "Fee Categories", path: "schooladmin/fees/categories", icon: CreditCard },
        { title: "Collect Fees", path: "schooladmin/fees/collect", icon: IndianRupee },
        { title: "Fee Structure", path: "schooladmin/fees/feestructure", icon: IndianRupee },
        { title: "Student Assign Fees", path: "schooladmin/fees/assign", icon: IndianRupee },
      ],
    },
    {
      title: "Hostel",
      icon: Briefcase,
      subMenu: [
        { title: "Manage Hostel", path: "schooladmin/hostel", icon: Briefcase },
        { title: "Room Allocation", path: "schooladmin/hostel/allocation", icon: FileCheck },
      ],
    },
    {
      title: "Transport",
      icon: Bus,
      subMenu: [
        { title: "Routes", path: "schooladmin/transport/routes", icon: Bus },
        { title: "Vehicles", path: "schooladmin/transport/vehicles", icon: Bus },
      ],
    },
    {
      title: "Payroll",
      icon: IndianRupee,
      subMenu: [
        { title: "Employee Salaries", path: "schooladmin/payroll", icon: IndianRupee },
        { title: "Generate Payslip", path: "schooladmin/payroll/payslip", icon: FileText },
      ],
    },
    {
      title: "Events & Calendar",
      icon: CalendarClock,
      subMenu: [
        { title: "School Calendar", path: "schooladmin/calendar", icon: CalendarClock },
        { title: "Events", path: "schooladmin/events", icon: ClipboardList },
      ],
    },
    {
      title: "Inventory",
      icon: Briefcase,
      subMenu: [
        { title: "Supplies", path: "schooladmin/inventory/supplies", icon: FileText },
        { title: "Assets", path: "schooladmin/inventory/assets", icon: FileCheck },
      ],
    },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "schooladmin/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "schooladmin/communication/history", icon: FileText },
      ],
    },
    { title: "Reports", path: "schooladmin/reports", icon: FileBarChart2 },
    { title: "Settings", path: "schooladmin/settings", icon: Settings },
  ],

  teacher: [
    { title: "Dashboard", path: "teacher", icon: LayoutDashboard },
    { title: "My Classes", path: "teacher/classes", icon: Book },
    { title: "Students", path: "teacher/students", icon: Users },
    { title: "Assignments", path: "teacher/assignments", icon: ClipboardList },
    { title: "Attendance", path: "teacher/attendance", icon: UserCheck },
    {
      title: "Exams",
      path: "teacher/exams",
      icon: GraduationCap,
      subMenu: [
        { title: "Question Bank", path: "teacher/exams/question-bank", icon: FileText },
        { title: "Create Exam", path: "teacher/exams/create-exam", icon: FileText },
        { title: "Reports", path: "teacher/exams/reports", icon: FileText },
      ],
    },
    { title: "Timetable", path: "teacher/timetable", icon: CalendarClock },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "teacher/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "teacher/communication/history", icon: FileText },
      ],
    },
    { title: "Reports", path: "teacher/reports", icon: FileBarChart2 },
  ],

  student: [
    { title: "Dashboard", path: "student", icon: LayoutDashboard },
    { title: "My Profile", path: "student/profile", icon: User },
    {
      title: "Exams",
      path: "student/exams",
      icon: MessageCircle,
      subMenu: [
        { title: "Exam Live", path: "student/exams/exam-live", icon: FileText },
        { title: "Attempt Review", path: "student/exams/attempt-review", icon: FileText },
      ],
    },
    { title: "Homework", path: "student/homework", icon: ClipboardList },
    { title: "Attendance", path: "student/attendance", icon: UserCheck },
    { title: "Grades", path: "student/grades", icon: Clipboard },
    { title: "Timetable", path: "student/timetable", icon: CalendarClock },
    { title: "Library", path: "student/library", icon: BookOpen },
    { title: "Hostel Info", path: "student/hostel", icon: Briefcase },
    { title: "Transport Info", path: "student/transport", icon: Bus },
    { title: "Fees", path: "student/fees", icon: CreditCard },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "student/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "student/communication/history", icon: FileText },
      ],
    },
  ],

  parent: [
    { title: "Dashboard", path: "parent", icon: LayoutDashboard },
    { title: "My Children", path: "parent/children", icon: Users },
    { title: "Attendance", path: "parent/attendance", icon: UserCheck },
    { title: "Grades", path: "parent/grades", icon: Clipboard },
    { title: "Homework", path: "parent/homework", icon: ClipboardList },
    { title: "Fees", path: "parent/fees", icon: CreditCard },
    { title: "Messages", path: "parent/messages", icon: MessageCircle },
    { title: "Reports", path: "parent/reports", icon: ClipboardList },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "parent/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "parent/communication/history", icon: FileText },
      ],
    },
  ],

  accountant: [
    { title: "Dashboard", path: "accountant", icon: LayoutDashboard },
    { title: "Fee Categories", path: "accountant/fees/categories", icon: CreditCard },
    { title: "Collect Fees", path: "accountant/fees/collect", icon: IndianRupee },
    { title: "Salary Management", path: "accountant/salary", icon: IndianRupee },
    { title: "Expense Reports", path: "accountant/reports", icon: FileBarChart2 },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "accountant/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "accountant/communication/history", icon: FileText },
      ],
    },
  ],

  staff: [
    { title: "Dashboard", path: "staff", icon: LayoutDashboard },
    { title: "My Tasks", path: "staff/tasks", icon: ClipboardList },
    { title: "Attendance", path: "staff/attendance", icon: UserCheck },
    { title: "Messages", path: "staff/messages", icon: MessageCircle },
    {
      title: "Communication",
      icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "staff/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "staff/communication/history", icon: FileText },
      ],
    },
  ],

  librarian: [
    { title: "Dashboard", path: "librarian", icon: LayoutDashboard },
    {
      title: "Manage Books",
      icon: BookOpen,
      subMenu: [
        { title: "All Books", path: "librarian/books/all", icon: BookOpen },
        { title: "Add New Book", path: "librarian/books/add", icon: BookOpen },
        { title: "Book Categories / Genres", path: "librarian/books/book-categories", icon: BookOpen },
        { title: "Issue Book", path: "librarian/books/issue-book", icon: BookOpen },
        { title: "Return Book", path: "librarian/books/return-book", icon: BookOpen },
      ],
    },
    {
      title: "Members",
      icon: Users,
      subMenu: [
        { title: "All Members", path: "librarian/members/all", icon: Users },
        { title: "Add New Member", path: "librarian/members/add", icon: Users },
      ],
    },
    {
      title: "Issue & Return Records",
      icon: FileCheck,
      subMenu: [
        { title: "Issued Books", path: "librarian/records/issued-books", icon: FileCheck },
        { title: "Returned Books", path: "librarian/records/returned-books", icon: FileCheck },
        { title: "Overdue Books", path: "librarian/records/overdue-books", icon: FileCheck },
        { title: "Lost Books", path: "librarian/records/lost-books", icon: FileCheck },
        { title: "Fine Management", path: "librarian/records/fine-management", icon: IndianRupee },
      ],
    },
    {
      title: "Reports",
      icon: FileBarChart2,
      subMenu: [
        { title: "Inventory Reports", path: "librarian/reports/inventory", icon: FileBarChart2 },
        { title: "Member Activity Reports", path: "librarian/reports/member-activity", icon: FileBarChart2 },
        { title: "Issue/Return Reports", path: "librarian/reports/issue-return", icon: FileBarChart2 },
        { title: "Fine Collection Reports", path: "librarian/reports/fine-collection", icon: IndianRupee },
      ],
    },
  ],

  // ✅ Added missing comma here
  transport: [
    { title: "Dashboard", path: "transport", icon: LayoutDashboard },
    {
      title: "Vehicle Management",
      icon: BusFront,
      subMenu: [
        { title: "Add Vehicle", path: "transport/vehicles/add", icon: BusFront },
        { title: "Vehicle List", path: "transport/vehicles/list", icon: BusFront },
        { title: "Maintenance Records", path: "transport/vehicles/maintenance", icon: Wrench },
      ],
    },
    {
      title: "Routes Management",
      icon: MapPinned,
      subMenu: [
        { title: "Add Route", path: "transport/routes/add", icon: MapPinned },
        { title: "All Routes", path: "transport/routes/list", icon: MapPinned },
        { title: "Assign Stops", path: "transport/routes/stops", icon: MapPinned },
      ],
    },
    {
      title: "Driver & Staff",
      icon: Users,
      subMenu: [
        { title: "Add Driver / Conductor", path: "transport/drivers/add", icon: UserPlus },
        { title: "Driver List", path: "transport/drivers/list", icon: Users },
        { title: "License & Insurance Details", path: "transport/drivers/license-insurance", icon: FileCheck },
      ],
    },
    {
      title: "Student Transport Allocation",
      icon: GraduationCap,
      subMenu: [
        { title: "Assign Students to Routes / Vehicles", path: "transport/students/assign", icon: UserCheck },
        { title: "View Student Transport List", path: "transport/students/list", icon: Users },
      ],
    },
    {
      title: "Reports",
      icon: FileBarChart2,
      subMenu: [
        { title: "Daily Route Reports", path: "transport/reports/daily-route", icon: FileBarChart2 },
        { title: "Expense / Maintenance Reports", path: "transport/reports/expenses", icon: Receipt },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      subMenu: [
        { title: "Fuel Rate", path: "transport/settings/fuel-rate", icon: Fuel },
        { title: "Route Timing", path: "transport/settings/route-timing", icon: Clock },
      ],
    },
    ]
};



