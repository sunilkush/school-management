import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TimetableScreen } from '../screens/TimetableScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { StudentListScreen } from '../screens/StudentListScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { FeesScreen } from '../screens/FeesScreen';
import { TeachersScreen } from '../screens/TeachersScreen';
import { ParentsScreen } from '../screens/ParentsScreen';
import { ClassesScreen } from '../screens/ClassesScreen';
import { SubjectsScreen } from '../screens/SubjectsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AssignmentsScreen } from '../screens/AssignmentsScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { BooksScreen } from '../screens/BooksScreen';
import { RoutesScreen } from '../screens/RoutesScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { RoomsScreen } from '../screens/RoomsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { SchoolsScreen } from '../screens/SchoolsScreen';
import { IssuedBooksScreen } from '../screens/IssuedBooksScreen';
import { HostelScreen } from '../screens/HostelScreen';
import { ExamsScreen } from '../screens/ExamsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { LeaveScreen } from '../screens/LeaveScreen';
import { PayrollScreen } from '../screens/PayrollScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { ModulePlaceholderScreen } from '../screens/ModulePlaceholderScreen';
import { GroupMenuScreen } from '../screens/GroupMenuScreen';
import { AssignedClassesView } from '../screens/teacher/AssignedClassesView';
import { LessonPlansView } from '../screens/teacher/LessonPlansView';
import { StudyMaterialsView } from '../screens/teacher/StudyMaterialsView';
import { MyTasksView } from '../screens/teacher/MyTasksView';
import { SelfAttendanceView } from '../screens/teacher/SelfAttendanceView';
import { SelfAttendanceHistoryView } from '../screens/teacher/SelfAttendanceHistoryView';
import { QuestionBankView } from '../screens/teacher/QuestionBankView';
import { EvaluationView } from '../screens/teacher/EvaluationView';
import { ExamReportsView } from '../screens/teacher/ExamReportsView';
import { StudentMonthlyReportView } from '../screens/teacher/StudentMonthlyReportView';
import { GeofenceSettingsView } from '../screens/schoolAdmin/GeofenceSettingsView';
import { InventoryView } from '../screens/schoolAdmin/InventoryView';
import { FeeCategoriesView } from '../screens/schoolAdmin/FeeCategoriesView';
import { AdminAttendanceTableView } from '../screens/schoolAdmin/AdminAttendanceTableView';
import { AdminMonthlyReportView } from '../screens/schoolAdmin/AdminMonthlyReportView';
import { ClassTeacherAssignmentsView } from '../screens/schoolAdmin/ClassTeacherAssignmentsView';
import { TeacherTimetableView } from '../screens/schoolAdmin/TeacherTimetableView';

// Real screens built so far, keyed by nav item key (== permission module, or 'Dashboard'/'Profile').
// Anything not listed here still renders ModulePlaceholderScreen until a later Phase 4 batch.
const SCREEN_MAP = {
  Dashboard: DashboardScreen,
  Profile: ProfileScreen,
  Timetable: TimetableScreen,
  Attendance: AttendanceScreen,
  Students: StudentListScreen,
  Notifications: NotificationsScreen,
  // FeesScreen only has a real view for Student/Parent (the "view + pay my fees" flow, fully
  // verified against source) — Accountant/School Admin's fee-collection-for-any-student flow is a
  // separate, larger feature (search a student, then collect) not built yet; that role sees
  // FeesScreen's own "not available for this role" empty state, not a crash or wrong data.
  Fees: FeesScreen,
  // Read-only directories, matching the web app's own Staff/Parents pages — add/edit/delete and
  // "assign additional roles" (web-only, admin-gated actions) are a separate CRUD feature not
  // built here.
  Teachers: TeachersScreen,
  Parents: ParentsScreen,
  Classes: ClassesScreen,
  Subjects: SubjectsScreen,
  Reports: ReportsScreen,
  // Homework/Assignments — Teacher gets create + grade, Student gets submit; other roles with
  // this nav item (none currently) would see an honest "not available" state.
  Assignments: AssignmentsScreen,
  Finance: FinanceScreen,
  Expenses: ExpensesScreen,
  Books: BooksScreen,
  Routes: RoutesScreen,
  Vehicles: VehiclesScreen,
  Rooms: RoomsScreen,
  Users: UsersScreen,
  Schools: SchoolsScreen,
  IssuedBooks: IssuedBooksScreen,
  Hostel: HostelScreen,
  Exams: ExamsScreen,
  Messages: MessagesScreen,
  Leave: LeaveScreen,
  Payroll: PayrollScreen,
  Events: EventsScreen,
  // Teacher — built this batch (see constants/roles.js NAV_CONFIG.Teacher for the full item list).
  AssignedClasses: AssignedClassesView,
  LessonPlans: LessonPlansView,
  SubjectResources: StudyMaterialsView,
  MyTasks: MyTasksView,
  // "My Daily Attendance" and "GPS Check-In/Out" are the same status+check-in/out screen — the
  // web sidebar lists them as two destinations, but there's only one real feature here.
  MyDailyAttendance: SelfAttendanceView,
  GpsCheckInOut: SelfAttendanceView,
  MyMonthlyReport: SelfAttendanceHistoryView,
  QuestionBank: QuestionBankView,
  Evaluation: EvaluationView,
  ExamReports: ExamReportsView,
  StudentMonthlyReport: StudentMonthlyReportView,
  // School Admin — first batch of a much larger remaining set (see conversation summary for the
  // full deferred list: Payroll sub-system, Paper Builder, Seat Plan, Fee Collection, Admissions).
  GeofenceSettings: GeofenceSettingsView,
  Inventory: InventoryView,
  FeeCategories: FeeCategoriesView,
  // One admin-wide attendance browser (role filter chips) behind 5 separate web sidebar entries —
  // see AdminAttendanceTableView's own header comment for why these are really the same screen.
  AttendanceDashboard: AdminAttendanceTableView,
  AttendanceTable: AdminAttendanceTableView,
  StudentAttendance: AdminAttendanceTableView,
  TeacherAttendance: AdminAttendanceTableView,
  StaffAttendance: AdminAttendanceTableView,
  // One monthly per-student attendance % report behind 3 separate web sidebar entries — all three
  // are the same GET /attendance/report/monthly aggregate, just different labels on the web side.
  AttendanceReports: AdminMonthlyReportView,
  AttendanceAnalytics: AdminMonthlyReportView,
  MonthlyReport: AdminMonthlyReportView,
  ClassTeacherAssignments: ClassTeacherAssignmentsView,
  TeacherTimetable: TeacherTimetableView,
};

// Screens that are themselves a nested navigator (e.g. a list that pushes to a detail screen, or
// Profile pushing to Settings) and so render their own header — the outer Tab/Drawer must not
// also show one for that item, or the user sees two stacked header bars.
export const SELF_HEADERED_KEYS = new Set(['Students', 'Profile', 'Assignments', 'Messages']);

// True for anything that renders its own nested Stack.Navigator (and so its own header) — the
// named self-headered screens above, plus every submenu group (GroupMenuScreen), regardless of
// whether that group ends up as a quick tab or tucked inside "More".
export function isSelfHeadered(item) {
  return item.isGroup || SELF_HEADERED_KEYS.has(item.key);
}

export function screenForModule(item) {
  if (item.isGroup) return GroupMenuScreen;
  return SCREEN_MAP[item.key] ?? ModulePlaceholderScreen;
}
