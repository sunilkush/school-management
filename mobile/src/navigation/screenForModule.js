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
};

// Screens that are themselves a nested navigator (e.g. a list that pushes to a detail screen, or
// Profile pushing to Settings) and so render their own header — the outer Tab/Drawer must not
// also show one for that item, or the user sees two stacked header bars.
export const SELF_HEADERED_KEYS = new Set(['Students', 'Profile', 'Assignments', 'Messages']);

export function screenForModule(item) {
  return SCREEN_MAP[item.key] ?? ModulePlaceholderScreen;
}
