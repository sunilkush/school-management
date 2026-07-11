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
import { IncomeScreen } from '../screens/IncomeScreen';
import { FeeCollectionScreen } from '../screens/FeeCollectionScreen';
import { FeeReportsScreen } from '../screens/FeeReportsScreen';
import { MembersScreen } from '../screens/MembersScreen';
import { FineManagementScreen } from '../screens/FineManagementScreen';
import { LibrarySettingsScreen } from '../screens/LibrarySettingsScreen';
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
import { SettingsScreen } from '../screens/SettingsScreen';
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
import { TaskManagementView } from '../screens/schoolAdmin/TaskManagementView';
import { CommunicationView } from '../screens/schoolAdmin/CommunicationView';
import { SupportTicketsView } from '../screens/schoolAdmin/SupportTicketsView';
import { TransportAssignmentsView } from '../screens/schoolAdmin/TransportAssignmentsView';
import { FeeStructuresView } from '../screens/schoolAdmin/FeeStructuresView';
import { AssignFeesView } from '../screens/schoolAdmin/AssignFeesView';
import { DocumentationView } from '../screens/schoolAdmin/DocumentationView';
import { StudentAdmissionView } from '../screens/schoolAdmin/StudentAdmissionView';
import { AdmissionInquiriesView } from '../screens/schoolAdmin/AdmissionInquiriesView';
import { StudentPromotionView } from '../screens/schoolAdmin/StudentPromotionView';
import { CreateUserView } from '../screens/schoolAdmin/CreateUserView';
import { ExamManagementView } from '../screens/schoolAdmin/ExamManagementView';
import { AdmitCardView } from '../screens/schoolAdmin/AdmitCardView';
import { ExamAnalyticsView } from '../screens/schoolAdmin/ExamAnalyticsView';
import { SeatPlanView } from '../screens/schoolAdmin/SeatPlanView';
import { GradesScreen } from '../screens/GradesScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { TransportScreen } from '../screens/TransportScreen';
import { StudyMaterialsBrowseView } from '../screens/student/StudyMaterialsBrowseView';
import { MyChildrenScreen } from '../screens/MyChildrenScreen';
import { ProgressReportScreen } from '../screens/ProgressReportScreen';

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
  Income: IncomeScreen,
  FeeCollection: FeeCollectionScreen,
  FeeReports: FeeReportsScreen,
  Books: BooksScreen,
  Routes: RoutesScreen,
  Vehicles: VehiclesScreen,
  Rooms: RoomsScreen,
  Users: UsersScreen,
  Schools: SchoolsScreen,
  IssuedBooks: IssuedBooksScreen,
  // Librarian — 'BookCatalog' is a different NAV_CONFIG key than 'Books' but the same real
  // catalog CRUD screen (BooksScreen now has add/edit/delete, extended this batch).
  BookCatalog: BooksScreen,
  Members: MembersScreen,
  FineManagement: FineManagementScreen,
  LibrarySettings: LibrarySettingsScreen,
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
  // Same self-attendance history screen under a different sidebar label — used by 7 other roles
  // (Accountant, Principal, VP, Librarian, Hostel Warden, Transport Manager, Receptionist), all of
  // which had this exact key dangling with no SCREEN_MAP entry until now.
  MyAttendance: SelfAttendanceHistoryView,
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
  TaskManagement: TaskManagementView,
  Communication: CommunicationView,
  // Role-generic — also completes Super Admin's own 'SupportTickets' item for free.
  SupportTickets: SupportTicketsView,
  // Role-generic — also completes Transport Manager's own 'TransportAssignments' item for free
  // (backend TRANSPORT_MANAGE allows both School Admin and Transport Manager).
  TransportAssignments: TransportAssignmentsView,
  FeeStructures: FeeStructuresView,
  AssignFees: AssignFeesView,
  // Role-branches internally — only School Admin/Principal/Vice Principal get real content so far.
  Documentation: DocumentationView,
  SchoolSettings: SettingsScreen,
  StudentAdmission: StudentAdmissionView,
  AdmissionInquiries: AdmissionInquiriesView,
  StudentPromotion: StudentPromotionView,
  CreateUser: CreateUserView,
  // CreateExam/ExamSchedule are the same underlying feature on the web app too (confirmed:
  // ExamSchedule.jsx dispatches the identical createExam/getExams thunks as CreateExam.jsx, just
  // presented as a calendar) — one real screen behind both nav entries.
  CreateExam: ExamManagementView,
  ExamSchedule: ExamManagementView,
  AdmitCard: AdmitCardView,
  // Same POST /exams/marks/bulk endpoint Teacher's Evaluation screen already uses — School Admin
  // is included in TEACHER_ROLES server-side and getExams/getStudentsByRole are already
  // school-wide (not teacher-assigned-scoped), so the existing screen works unmodified here.
  GradeEntry: EvaluationView,
  ExamAnalytics: ExamAnalyticsView,
  SeatPlan: SeatPlanView,
  // Student — role-branching wrappers since 'Grades'/'Library'/'Transport' are ALSO Parent nav
  // items (viewing a child's data, a separate not-yet-built per-child-picker flow) — see each
  // screen's own header comment for why Parent gets an honest placeholder here, not a 403.
  Grades: GradesScreen,
  Library: LibraryScreen,
  Transport: TransportScreen,
  StudyMaterials: StudyMaterialsBrowseView,
  // Same underlying /events feature as the 'Events' key above — EventsScreen's own Student branch
  // (AgendaEventsView) already covers "Academic Calendar" under a different sidebar label.
  AcademicCalendar: EventsScreen,
  // Parent — MyChildrenView/StudentDetailsScreen already existed (built for Parent's 'Students'
  // tab, which Parent's NAV_CONFIG never actually references — only 'MyChildren' does); this is
  // the missing wiring, not a new feature.
  MyChildren: MyChildrenScreen,
  ProgressReport: ProgressReportScreen,
};

// Screens that are themselves a nested navigator (e.g. a list that pushes to a detail screen, or
// Profile pushing to Settings) and so render their own header — the outer Tab/Drawer must not
// also show one for that item, or the user sees two stacked header bars.
export const SELF_HEADERED_KEYS = new Set(['Students', 'Profile', 'Assignments', 'Messages', 'MyChildren']);

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
