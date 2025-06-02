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
  FileCheck,
  IndianRupee
} from "lucide-react";

export const sidebarMenu = {
  'super admin': [
    { title: "Dashboard", path: "superadmin", icon: LayoutDashboard },
    {
      title: "Schools", icon: School,
      subMenu: [
        { title: "All Schools", path: "superadmin/schools", icon: School },
        { title: "Add School", path: "superadmin/schools/add", icon: School },
      ],
    },
    {
      title: "Admins", icon: UserCog,
      subMenu: [
        { title: "All Admins", path: "superadmin/admins", icon: Users },
        { title: "Register Admin", path: "superadmin/user-create", icon: UserCog },
      ],
    },
    {
      title: "Roles & Permissions", icon: ShieldCheck,
      subMenu: [
        { title: "Roles", path: "superadmin/roles", icon: ShieldCheck },
        { title: "Permissions", path: "superadmin/permissions", icon: ShieldCheck },
      ],
    },
    {
      title: "Modules", icon: Puzzle,
      subMenu: [
        { title: "Academic Years", path: "superadmin/modules/academicyears", icon: CalendarClock },
        { title: "All Modules", path: "superadmin/modules", icon: Puzzle },
      ],
    },
    { title: "Reports", path: "superadmin/reports", icon: FileText },
    { title: "Settings", path: "superadmin/settings", icon: Settings },
  ],

  'school admin': [
    { title: "Dashboard", path: "schooladmin", icon: LayoutDashboard },
    {
      title: "Users", icon: Users,
      subMenu: [
        { title: "Add Student", path: "schooladmin/users/student/add", icon: User },
        { title: "Add Teacher", path: "schooladmin/users/teacher/add", icon: User },
        { title: "Add Parent", path: "schooladmin/users/parent/add", icon: User },
        { title: "All Users", path: "schooladmin/users", icon: Users },
      ],
    },
    {
      title: "Classes & Subjects", icon: BookOpen,
      subMenu: [
        { title: "Manage Classes", path: "schooladmin/classes", icon: Book },
        { title: "Subjects", path: "schooladmin/subjects", icon: BookOpen },
      ],
    },
    {
      title: "Exams & Grades", icon: GraduationCap,
      subMenu: [
        { title: "Schedule Exams", path: "schooladmin/exams/schedule", icon: ClipboardSignature },
        { title: "Enter Grades", path: "schooladmin/exams/grades", icon: ClipboardList },
      ],
    },
    {
      title: "Attendance", icon: UserCheck,
      subMenu: [
        { title: "Student Attendance", path: "schooladmin/attendance/students", icon: UserCheck },
        { title: "Staff Attendance", path: "schooladmin/attendance/staff", icon: ClipboardCheck },
      ],
    },
    {
      title: "Library", icon: BookOpen,
      subMenu: [
        { title: "Books", path: "schooladmin/library/books", icon: Book },
        { title: "Issue Book", path: "schooladmin/library/issue", icon: FileCheck },
      ],
    },
    {
      title: "Timetables", icon: CalendarClock,
      subMenu: [
        { title: "Class Timetable", path: "schooladmin/timetable/class", icon: CalendarClock },
        { title: "Teacher Timetable", path: "schooladmin/timetable/teacher", icon: CalendarClock },
      ],
    },
    {
      title: "Fees Management", icon: CreditCard,
      subMenu: [
        { title: "Fee Categories", path: "schooladmin/fees/categories", icon: CreditCard },
        { title: "Collect Fees", path: "schooladmin/fees/collect", icon: IndianRupee },
      ],
    },
    {
      title: "Hostel", icon: Briefcase,
      subMenu: [
        { title: "Manage Hostel", path: "schooladmin/hostel", icon: Briefcase },
        { title: "Room Allocation", path: "schooladmin/hostel/allocation", icon: FileCheck },
      ],
    },
    {
      title: "Transport", icon: Bus,
      subMenu: [
        { title: "Routes", path: "schooladmin/transport/routes", icon: Bus },
        { title: "Vehicles", path: "schooladmin/transport/vehicles", icon: Bus },
      ],
    },
    {
      title: "Payroll", icon: IndianRupee,
      subMenu: [
        { title: "Employee Salaries", path: "schooladmin/payroll", icon: IndianRupee },
        { title: "Generate Payslip", path: "schooladmin/payroll/payslip", icon: FileText },
      ],
    },
    {
      title: "Communication", icon: Bell,
      subMenu: [
        { title: "Send Notification", path: "schooladmin/communication/send", icon: MessageSquare },
        { title: "SMS/Email History", path: "schooladmin/communication/history", icon: FileText },
      ],
    },
    { title: "Reports", path: "schooladmin/reports", icon: FileBarChart2 },
    { title: "Settings", path: "schooladmin/settings", icon: Settings },
  ],

  'teacher': [
    { title: "Dashboard", path: "teacher", icon: LayoutDashboard },
    { title: "My Classes", path: "teacher/classes", icon: Book },
    { title: "Students", path: "teacher/students", icon: Users },
    { title: "Assignments", path: "teacher/assignments", icon: ClipboardList },
    { title: "Attendance", path: "teacher/attendance", icon: UserCheck },
    { title: "Exams", path: "teacher/exams", icon: GraduationCap },
    { title: "Timetable", path: "teacher/timetable", icon: CalendarClock },
    { title: "Communication", path: "teacher/communication", icon: MessageCircle },
  ],

  'student': [
    { title: "Dashboard", path: "student/dashboard", icon: LayoutDashboard },
    { title: "My Profile", path: "student/profile", icon: User },
    { title: "Homework", path: "student/homework", icon: ClipboardList },
    { title: "Attendance", path: "student/attendance", icon: UserCheck },
    { title: "Grades", path: "student/grades", icon: Clipboard },
    { title: "Timetable", path: "student/timetable", icon: CalendarClock },
    { title: "Library", path: "student/library", icon: BookOpen },
    { title: "Hostel Info", path: "student/hostel", icon: Briefcase },
    { title: "Transport Info", path: "student/transport", icon: Bus },
    { title: "Fees", path: "student/fees", icon: CreditCard },
    { title: "Communication", path: "student/communication", icon: MessageCircle },
  ],

  'parent': [
    { title: "Dashboard", path: "parent", icon: LayoutDashboard },
    { title: "My Children", path: "parent/children", icon: Users },
    { title: "Attendance", path: "parent/attendance", icon: UserCheck },
    { title: "Grades", path: "parent/grades", icon: Clipboard },
    { title: "Homework", path: "parent/homework", icon: ClipboardList },
    { title: "Fees", path: "parent/fees", icon: CreditCard },
    { title: "Messages", path: "parent/messages", icon: MessageCircle },
  ],

  'accountant': [
    { title: "Dashboard", path: "accountant/dashboard", icon: LayoutDashboard },
    { title: "Fee Categories", path: "accountant/fees/categories", icon: CreditCard },
    { title: "Collect Fees", path: "accountant/fees/collect", icon: IndianRupee },
    { title: "Salary Management", path: "accountant/salary", icon: IndianRupee },
    { title: "Expense Reports", path: "accountant/reports", icon: FileBarChart2 },
  ],

  'staff': [
    { title: "Dashboard", path: "staff/dashboard", icon: LayoutDashboard },
    { title: "My Tasks", path: "staff/tasks", icon: ClipboardList },
    { title: "Attendance", path: "staff/attendance", icon: UserCheck },
    { title: "Messages", path: "staff/messages", icon: MessageCircle },
  ],
};
