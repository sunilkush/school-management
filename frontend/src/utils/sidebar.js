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
  File,
  MessageCircle,
  Clipboard,
  ClipboardSignature,
  DollarSign,
  FileBarChart2,
  Book,
  Briefcase,
  MessageSquare,
  User,
  FileCheck
} from "lucide-react";

export const sidebarMenu = {
  'super admin': [
    { title: "Dashboard", path: "/superadmin/dashboard", icon: LayoutDashboard },
    {
      title: "Schools", icon: School,
      subMenu: [
        { title: "All Schools", path: "/superadmin/schools", icon: School },
        { title: "Add School", path: "/superadmin/schools/add", icon: School },
      ],
    },
    {
      title: "Admins", icon: UserCog,
      subMenu: [
        { title: "All Admins", path: "/superadmin/admins", icon: Users },
        { title: "Register Admin", path: "user-create", icon: UserCog },
      ],
    },
    {
      title: "Roles & Permissions", icon: ShieldCheck,
      subMenu: [
        { title: "Roles", path: "/superadmin/roles", icon: ShieldCheck },
        { title: "Permissions", path: "/superadmin/permissions", icon: ShieldCheck },
      ],
    },
    {
      title: "Modules", icon: Puzzle,
      subMenu: [
        { title: "Academic Years", path: "/superadmin/modules/academicyears", icon: CalendarClock },
        { title: "All Modules", path: "/superadmin/modules", icon: Puzzle },
      ],
    },
    { title: "Reports", path: "/superadmin/reports", icon: FileText },
    { title: "Settings", path: "/superadmin/settings", icon: Settings },
  ],

  'School Admin': [
    { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    {
      title: "Users", icon: Users,
      subMenu: [
        { title: "Add Student", path: "/admin/users/student/add", icon: User },
        { title: "Add Teacher", path: "/admin/users/teacher/add", icon: User },
        { title: "Add Parent", path: "/admin/users/parent/add", icon: User },
        { title: "All Users", path: "/admin/users", icon: Users },
      ],
    },
    {
      title: "Classes & Subjects", icon: BookOpen,
      subMenu: [
        { title: "Manage Classes", path: "/admin/classes", icon: Book },
        { title: "Subjects", path: "/admin/subjects", icon: BookOpen },
      ],
    },
    {
      title: "Exams & Grades", icon: GraduationCap,
      subMenu: [
        { title: "Schedule Exams", path: "/admin/exams/schedule", icon: ClipboardSignature },
        { title: "Enter Grades", path: "/admin/exams/grades", icon: ClipboardList },
      ],
    },
    {
      title: "Attendance", icon: UserCheck,
      subMenu: [
        { title: "Student Attendance", path: "/admin/attendance/students", icon: UserCheck },
        { title: "Staff Attendance", path: "/admin/attendance/staff", icon: ClipboardCheck },
      ],
    },
    {
      title: "Library", icon: BookOpen,
      subMenu: [
        { title: "Books", path: "/admin/library/books", icon: Book },
        { title: "Issue Book", path: "/admin/library/issue", icon: FileCheck },
      ],
    },
    {
      title: "Timetables", icon: CalendarClock,
      subMenu: [
        { title: "Class Timetable", path: "/admin/timetable/class", icon: CalendarClock },
        { title: "Teacher Timetable", path: "/admin/timetable/teacher", icon: CalendarClock },
      ],
    },
    {
      title: "Fees Management", icon: CreditCard,
      subMenu: [
        { title: "Fee Categories", path: "/admin/fees/categories", icon: CreditCard },
        { title: "Collect Fees", path: "/admin/fees/collect", icon: DollarSign },
      ],
    },
    {
      title: "Hostel", icon: Briefcase,
      subMenu: [
        { title: "Manage Hostel", path: "/admin/hostel", icon: Briefcase },
        { title: "Room Allocation", path: "/admin/hostel/allocation", icon: FileCheck },
      ],
    },
    {
      title: "Transport", icon: Bus,
      subMenu: [
        { title: "Routes", path: "/admin/transport/routes", icon: Bus },
        { title: "Vehicles", path: "/admin/transport/vehicles", icon: Bus },
      ],
    },
    {
      title: "Payroll", icon: DollarSign,
      subMenu: [
        { title: "Employee Salaries", path: "/admin/payroll", icon: DollarSign },
        { title: "Generate Payslip", path: "/admin/payroll/payslip", icon: FileText },
      ],
    },
    {
      title: "Communication", icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "/admin/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "/admin/communication/history", icon: FileText },
      ],
    },
    { title: "Reports", path: "/admin/reports", icon: FileBarChart2 },
    { title: "Settings", path: "/admin/settings", icon: Settings },
  ],

  'teacher': [
    { title: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "My Classes", path: "/teacher/classes", icon: Book },
    { title: "Students", path: "/teacher/students", icon: Users },
    { title: "Assignments", path: "/teacher/assignments", icon: ClipboardList },
    { title: "Attendance", path: "/teacher/attendance", icon: UserCheck },
    { title: "Exams", path: "/teacher/exams", icon: GraduationCap },
    { title: "Timetable", path: "/teacher/timetable", icon: CalendarClock },
    { title: "Communication", path: "/teacher/communication", icon: MessageCircle },
  ],

  'student': [
    { title: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { title: "My Profile", path: "/student/profile", icon: User },
    { title: "Homework", path: "/student/homework", icon: ClipboardList },
    { title: "Attendance", path: "/student/attendance", icon: UserCheck },
    { title: "Grades", path: "/student/grades", icon: Clipboard },
    { title: "Timetable", path: "/student/timetable", icon: CalendarClock },
    { title: "Library", path: "/student/library", icon: BookOpen },
    { title: "Hostel Info", path: "/student/hostel", icon: Briefcase },
    { title: "Transport Info", path: "/student/transport", icon: Bus },
    { title: "Fees", path: "/student/fees", icon: CreditCard },
    { title: "Communication", path: "/student/communication", icon: MessageCircle },
  ],

  'parent': [
    { title: "Dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
    { title: "My Children", path: "/parent/children", icon: Users },
    { title: "Attendance", path: "/parent/attendance", icon: UserCheck },
    { title: "Grades", path: "/parent/grades", icon: Clipboard },
    { title: "Homework", path: "/parent/homework", icon: ClipboardList },
    { title: "Fees", path: "/parent/fees", icon: CreditCard },
    { title: "Messages", path: "/parent/messages", icon: MessageCircle },
  ],

  'accountant': [
    { title: "Dashboard", path: "/accountant/dashboard", icon: LayoutDashboard },
    { title: "Fee Categories", path: "/accountant/fees/categories", icon: CreditCard },
    { title: "Collect Fees", path: "/accountant/fees/collect", icon: DollarSign },
    { title: "Salary Management", path: "/accountant/salary", icon: DollarSign },
    { title: "Expense Reports", path: "/accountant/reports", icon: FileBarChart2 },
  ],

  'staff': [
    { title: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
    { title: "My Tasks", path: "/staff/tasks", icon: ClipboardList },
    { title: "Attendance", path: "/staff/attendance", icon: UserCheck },
    { title: "Messages", path: "/staff/messages", icon: MessageCircle },
  ],
};
