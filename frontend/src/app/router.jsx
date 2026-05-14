import { lazy } from "react";
import { Outlet, createBrowserRouter } from "react-router-dom";

import App from "./App.jsx";

// Auth & Core
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const Dashboard = lazy(() => import("../components/layout/MainDashboard.jsx"));
const Unauthorized = lazy(() => import("../pages/common/Unauthorized.jsx"));
const NoActiveYear = lazy(() => import("../pages/common/no-active-year.jsx"));
const ForgetPasswordPage = lazy(()=>import("../pages/auth/ForgetPasswordPage.jsx"));
const ResetPasswordPage = lazy(()=>import("../pages/auth/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(()=> import("../pages/auth/VerifyEmailPage.jsx"));
const ResendVerificationPage = lazy(()=>import("../pages/auth/ResendVerificationPage.jsx"));

const NotFoundPage = lazy(()=>import("../pages/common/NotFoundPage.jsx"));
// Dashboards
const SuperAdminDashboard = lazy(() => import("../pages/roles/super-admin/dashboard/SuperAdminDashboard.jsx"));
const SchoolAdminDashboard = lazy(() => import("../pages/roles/school-admin/dashboard/SchoolAdminDashboard.jsx"));
const StudentDashboard = lazy(() => import("../pages/roles/student/dashboard/StudentDashboard.jsx"));
const TeacherDashboard = lazy(() => import("../pages/roles/teacher/dashboard/TeacherDashboard.jsx"));
const AccountantDashboard = lazy(() => import("../pages/roles/accountant/dashboard/AccountantDashboard.jsx"));
const StaffDashboard = lazy(() => import("../pages/roles/staff/dashboard/StaffDashboard.jsx"));
const ParentDashboard = lazy(() => import("../pages/roles/parent/dashboard/ParentDashboard.jsx"));

// Common
const Profile = lazy(() => import("../pages/common/Profile.jsx"));
const Notification = lazy(() => import("../pages/common/Notification.jsx"));
const Message = lazy(() => import("../pages/common/Message.jsx"));
const Settings = lazy(() => import("../pages/common/Settings.jsx"));
const Documents = lazy(() => import("../pages/common/Documents.jsx"));
const Schedule = lazy(() => import("../pages/common/Schedule.jsx"));
const Loader = lazy(()=> import("../components/Loader/Loader.jsx"));
// Super Admin
const Reports = lazy(() => import("../pages/roles/super-admin/reports-analytics/Reports.jsx"));
const Schools = lazy(() => import("../pages/roles/super-admin/school-management/Schools.jsx"));
const AddSchool = lazy(() => import("../pages/roles/super-admin/school-management/AddSchool.jsx"));
const SubscriptionPlans = lazy(() => import("../pages/roles/super-admin/school-management/SubscriptionPlans.jsx"));
const SchoolReports = lazy(() => import("../pages/roles/super-admin/school-management/SchoolReports.jsx"));
const PaymentsPage = lazy(() => import("../pages/roles/super-admin/school-management/PaymentsPage.jsx"));
const RevenuePage = lazy(() => import("../pages/roles/super-admin/school-management/RevenuePage.jsx"));
//const PlanLogs = lazy(() => import("../pages/roles/super-admin/school-management/PlanLogs.jsx"));

const Roles = lazy(() => import("../pages/roles/super-admin/system-settings/Roles.jsx"));
const Permissions = lazy(() => import("../pages/roles/super-admin/system-settings/Permissions.jsx"));
const GlobalConfig = lazy(() => import("../pages/roles/super-admin/system-settings/GlobalConfig.jsx"));
const AuditLogs = lazy(() => import("../pages/roles/super-admin/system-settings/AuditLogs.jsx"));
const Backups = lazy(() => import("../pages/roles/super-admin/system-settings/Backups.jsx"));

const AcademicYears = lazy(() => import("../pages/roles/super-admin/master-settings/AcademicYears.jsx"));
const ClassPage = lazy(() => import("../pages/roles/super-admin/master-settings/ClassPage.jsx"));
const ClassSectionList = lazy(() => import("../pages/roles/super-admin/master-settings/ClassSectionList.jsx"));
const SubjectsAdmin = lazy(() => import("../pages/roles/super-admin/master-settings/SubjectsAdmin.jsx"));
const FeeCategories = lazy(() => import("../pages/roles/super-admin/master-settings/FeeCategories.jsx"));
const Designations = lazy(() => import("../pages/roles/super-admin/master-settings/Designations.jsx"));
const Departments = lazy(() => import("../pages/roles/super-admin/master-settings/Departments.jsx"));
const SchoolBoards = lazy(() => import("../pages/roles/super-admin/master-settings/SchoolBoards.jsx"));
const ChaptersTopics = lazy(() => import("../pages/roles/super-admin/master-settings/ChaptersTopics.jsx"));
const BoardClassPage = lazy(() => import("../pages/roles/super-admin/master-settings/BoardClassPage.jsx"));

const Modules = lazy(() => import("../pages/roles/super-admin/modules/Modules.jsx"));
const SchoolWiseReports = lazy(() => import("../pages/roles/super-admin/reports-analytics/SchoolWiseReports.jsx"));
const AttendanceSummary = lazy(() => import("../pages/roles/school-admin/reports/schoolAdminReport.jsx"));
const FinanceSummary = lazy(() => import("../pages/roles/super-admin/reports-analytics/FinanceSummary.jsx"));
const AcademicReports = lazy(() => import("../pages/roles/super-admin/reports-analytics/AcademicReports.jsx"));
const ActivityLogs = lazy(() => import("../pages/roles/super-admin/reports-analytics/ActivityLogs.jsx"));
const PlatformUsage = lazy(() => import("../pages/roles/super-admin/reports-analytics/PlatfromUsage.jsx"));
const RevenueAnalytics = lazy(()=> import("../pages/roles/super-admin/reports-analytics/RevenueAnalytics.jsx"));
// Super Admin Users
const Admins = lazy(() => import("../pages/roles/super-admin/users-management/Admins.jsx"));
const Staff = lazy(() => import("../pages/roles/super-admin/users-management/Staff.jsx"));
const Teachers = lazy(() => import("../pages/roles/super-admin/users-management/Teachers.jsx"));
const Parents = lazy(() => import("../pages/roles/super-admin/users-management/Parents.jsx"));
const Students = lazy(() => import("../pages/roles/super-admin/users-management/students.jsx"));
const Accountant = lazy(() => import("../pages/roles/super-admin/users-management/Accountant.jsx"));
const Librarian = lazy(() => import("../pages/roles/super-admin/users-management/Librarian.jsx"));
const Transport = lazy(() => import("../pages/roles/super-admin/users-management/Transport.jsx"));
// Super Admin Support
const TicketPage = lazy(() => import("../pages/roles/super-admin/support/TicketPage.jsx"));
const Faqs = lazy(() => import("../pages/roles/super-admin/support/Faqs.jsx"));
const ContactSupport = lazy(() => import("../pages/roles/super-admin/support/ContactSupport.jsx"));
const Documentation = lazy(() => import("../pages/roles/super-admin/support/Documentation.jsx"));
// School Admin
const TeacherList = lazy(() => import("../pages/roles/school-admin/user-management/TeacherList.jsx"));
const AddStudent = lazy(() => import("../pages/roles/school-admin/teachers-students/AddStudent.jsx"));
const ParentList = lazy(() => import("../pages/roles/school-admin/user-management/ParentsList.jsx"));
const StudentList = lazy(() => import("../pages/roles/school-admin/user-management/StudentList.jsx"));
const StudentPromotion = lazy(() => import("../pages/roles/school-admin/teachers-students/StudentPromotion.jsx"));

const Classes = lazy(() => import("../pages/roles/school-admin/academic-management/Classes.jsx"));
const Subjects = lazy(() => import("../pages/roles/school-admin/academic-management/Subjects.jsx"));

const ExamSchedule = lazy(() => import("../pages/roles/school-admin/exams-grades/ExamSchedule.jsx"));
const EnterGrades = lazy(() => import("../pages/roles/school-admin/exams-grades/EnterGrades.jsx"));
const ExamReports = lazy(() => import("../pages/roles/school-admin/exams-grades/ExamReport.jsx"));
const ExamsPage = lazy(() => import("../pages/roles/school-admin/exams-grades/ExamPage.jsx"));
const ExamCreate = lazy(() => import("../pages/roles/school-admin/exams-grades/CreateExam.jsx"));
const PaperBuilder = lazy(() => import("../pages/roles/school-admin/exams-grades/PageBuilder.jsx"));
const AdmitCardPage = lazy(() => import("../pages/roles/school-admin/exams-grades/AdmitCardPage.jsx"));
const SeatPlanPage = lazy(() => import("../pages/roles/school-admin/exams-grades/SeatPlanPage.jsx"));
const ExamAnalyticsPage = lazy(() => import("../pages/roles/school-admin/exams-grades/ExamAnalyticsPage.jsx"));
const AllStudentsAttendance = lazy(() => import("../pages/roles/school-admin/attendance/AllStudentsAttendance.jsx"));
const StaffAttendance = lazy(() => import("../pages/roles/school-admin/attendance/StaffAttendance.jsx"));

const Books = lazy(() => import("../pages/roles/school-admin/library/Books.jsx"));
const IssueBook = lazy(() => import("../pages/roles/school-admin/library/IssueBook.jsx"));
const LibraryCard = lazy(() => import("../pages/roles/school-admin/library/LibraryCard.jsx"));

const SchoolAdminTimetablePage = lazy(() => import("../pages/timetable/SchoolAdminTimetablePage.jsx"));
const TimeSlotManager = lazy(() => import("../pages/timetable/TimeSlotManager.jsx"));
const RoomManager = lazy(() => import("../pages/timetable/RoomManager.jsx"));
const TeacherTimetablePage = lazy(() => import("../pages/timetable/TeacherTimetablePage.jsx"));
const StudentTimetablePage = lazy(() => import("../pages/timetable/StudentTimetablePage.jsx"));
const ParentChildTimetablePage = lazy(() => import("../pages/timetable/ParentChildTimetablePage.jsx"));
const PrincipalTimetableOverview = lazy(() => import("../pages/timetable/PrincipalTimetableOverview.jsx"));
const ClassTimetable = SchoolAdminTimetablePage;
const TeacherTimetable = TeacherTimetablePage;

const FeeStructure = lazy(() => import("../pages/roles/school-admin/fees-management/FeeStructure.jsx"));
const StudentAssignFees = lazy(() => import("../pages/roles/school-admin/fees-management/AssignStudentFeeForm.jsx"));
const SchoolFeeCategories = lazy(() => import("../pages/roles/school-admin/fees-management/SchoolFeeCategories.jsx"));

const HostelManagement = lazy(() => import("../pages/roles/school-admin/hostel/HostelManagement.jsx"));
const RoomAllocation = lazy(() => import("../pages/roles/school-admin/hostel/RoomAllocation.jsx"));

const RoutesPage = lazy(() => import("../pages/roles/school-admin/transport/RoutesPage.jsx"));
const Vehicles = lazy(() => import("../pages/roles/school-admin/transport/Vehicles.jsx"));
const TransportAssignments = lazy(() => import("../pages/roles/school-admin/transport/Assignments.jsx"));



const SendNotification = lazy(() => import("../pages/roles/school-admin/communication/SendNotification.jsx"));
const SmsEmailHistory = lazy(() => import("../pages/roles/school-admin/communication/SmsEmailHistory.jsx"));

const Supplies = lazy(() => import("../pages/roles/school-admin/inventory/supplies.jsx"));
const Assets = lazy(() => import("../pages/roles/school-admin/inventory/assets.jsx"));

const Events = lazy(() => import("../pages/roles/school-admin/events-calendar/events.jsx"));
const CalendarPage = lazy(() => import("../pages/roles/school-admin/events-calendar/CalendarPage.jsx"));

const SettingsPage = lazy(() => import("../pages/roles/school-admin/settings/SettingsPage.jsx"));
const SchoolAdminReport = lazy(() => import("../pages/roles/school-admin/reports/schoolAdminReport.jsx"));
const SchoolSetup = lazy(()=>import("../pages/roles/school-admin/school-setup/SchoolSetup.jsx"));

// Teacher
const QuestionBank = lazy(() => import("../pages/roles/teacher/exams/QuestionBank.jsx"));
const CreateQuestion = lazy(() => import("../pages/roles/teacher/exams/CreateQuestion.jsx"));
const BulkUploadQuestions = lazy(() => import("../pages/roles/teacher/exams/BulkUploadQuestions.jsx"));
const TeacherExamsPage = lazy(() => import("../pages/roles/teacher/exams/TeacherExamsPage.jsx"));
const TeacherEvaluationPage = lazy(() => import("../pages/roles/teacher/exams/TeacherEvaluationPage.jsx"));
const AssignedClasses = lazy(() => import("../pages/roles/teacher/classes/AssignedClasses.jsx"));
const ClassDetails = lazy(() => import("../pages/roles/teacher/classes/ClassDetails.jsx"));
const Assignments = lazy(() => import("../pages/roles/teacher/assignments/Assignments.jsx"));
const MyStudents = lazy(() => import("../pages/roles/teacher/my-students/MyStudents.jsx"));
const StudentAttendance = lazy(() => import("../pages/roles/teacher/attendance/StudentAttendance.jsx"));
const EmployeeDetailes = lazy(() => import("../pages/roles/teacher/profile/EmployeeDetailes.jsx"));
const MonthlyAttendanceReport = lazy(() => import("../pages/roles/teacher/attendance/MonthlyAttendanceReport.jsx"));
const MyAttendancePage = lazy(() => import("../pages/attendance/MyAttendancePage.jsx"));
const TeacherReports = lazy(() => import("../pages/roles/teacher/reports/TeacherReports.jsx"));
const MyAttendanceMonthlyReport = lazy(() => import("../pages/attendance/MyAttendancePage.jsx"));

// Student
const FeeStudent = lazy(() => import("../pages/roles/student/fees/FeeStudent.jsx"));
const StudentHomework = lazy(() => import("../pages/roles/student/homework/StudentHomework.jsx"));
const ExamLive = lazy(() => import("../pages/roles/student/exams/ExamLive.jsx"));
const AttemptReview = lazy(() => import("../pages/roles/student/exams/AttemptReview.jsx"));
const StudentExamsPage = lazy(() => import("../pages/roles/student/exams/StudentExamsPage.jsx"));
const StudentAllowedBook = lazy(() => import("../pages/roles/student/library/StudentAllowedBook.jsx"));
const StudentTimetable = lazy(() => import("../pages/timetable/StudentTimetablePage.jsx"));
const StudentAttendancePage = lazy(() => import("../pages/roles/student/attendance/MyAttendancePage.jsx"));
const StudentTransport = lazy(() => import("../pages/roles/student/transport/StudentTransport.jsx"));
const StudentGrades = lazy(() => import("../pages/roles/student/grades/StudentGrades.jsx"));
const StudentProfile = lazy(()=>import("../pages/roles/student/profile/Profile.jsx"))

// Parent
const MyChildren = lazy(() => import("../pages/roles/parent/children/MyChildren.jsx"));
const ChildAttendance = lazy(() => import("../pages/roles/parent/attendance/ChildAttendance.jsx"));
const ChildGrades = lazy(() => import("../pages/roles/parent/grades/ChildGrades.jsx"));
const ChildHomework = lazy(() => import("../pages/roles/parent/homework/ChildHomework.jsx"));
/* const ChildMessages = lazy(() => import("../pages/roles/parent/messages/ChildMessages.jsx")); */
const ParentExamsPage = lazy(() => import("../pages/roles/parent/exams/ParentExamsPage.jsx"));
const ParentFees = lazy(() => import("../pages/roles/parent/fee/ParentFees.jsx"));
// Accountant
const CollectFees = lazy(() => import("../pages/roles/accountant/fees-management/CollectFees.jsx"));
// Other
const UserRegister = lazy(() => import("../pages/common/UserRegister.jsx"));
const RoleWorkspace = lazy(() => import("../pages/common/RoleWorkspace.jsx"));
const RoleDynamicPortal = lazy(() => import("../pages/common/RoleDynamicPortal.jsx"));
const ITSupportDashboard = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.ITSupportDashboard }))
);
const SystemMaintenance = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.SystemMaintenance }))
);
const UserSupportTickets = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.UserSupportTickets }))
);
const NetworkStatus = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.NetworkStatus }))
);
const SystemLogs = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.SystemLogs }))
);
const ITSupportProfile = lazy(() =>
  import("../pages/roles/it-support/ITSupportPages.jsx").then((module) => ({ default: module.ITSupportProfile }))
);
const ModuleOverview = lazy(() => import("../pages/modules/ModuleOverview.jsx"));
const ModuleDetail = lazy(() => import("../pages/modules/ModuleDetail.jsx"));

const ChangePassword = lazy(()=> import("../pages/auth/ResetPasswordPage.jsx"));
const AttendanceDashboardPage = lazy(() => import("../pages/attendance/AttendanceDashboard.jsx"));
const MarkAttendancePage = lazy(() => import("../pages/attendance/MarkAttendancePage.jsx"));
const AttendanceTablePage = lazy(() => import("../pages/attendance/AttendanceTablePage.jsx"));
const MonthlyReportPage = lazy(() => import("../pages/attendance/MonthlyReportPage.jsx"));

const ChildAttendancePage = lazy(() => import("../pages/attendance/ChildAttendancePage.jsx"));
const SupportTicketsPage = lazy(() => import("../pages/support/SupportTicketsPage.jsx"));


// Payroll Module
const SuperAdminPayrollOverview = lazy(() => import("../features/payroll/pages/SuperAdminPayrollOverview.jsx"));
const CreateEmployee = lazy(() => import("../pages/roles/school-admin/payroll/CreateEmployee.jsx"));
const PayrollDashboardPage = lazy(() => import("../features/payroll/pages/PayrollDashboard.jsx"));
const PayrollSettingsPage = lazy(() => import("../features/payroll/pages/PayrollSettingsPage.jsx"));
const SalaryComponentsPage = lazy(() => import("../features/payroll/pages/SalaryComponentsPage.jsx"));
const SalaryStructurePage = lazy(() => import("../features/payroll/pages/SalaryStructurePage.jsx"));
const PayrollCyclePage = lazy(() => import("../features/payroll/pages/PayrollCyclePage.jsx"));
const PayrollRunPageFeature = lazy(() => import("../features/payroll/pages/PayrollRunPage.jsx"));
const PayslipPage = lazy(() => import("../features/payroll/pages/PayslipPage.jsx"));
const MyPayslipsPage = lazy(() => import("../features/payroll/pages/MyPayslipsPage.jsx"));
const EmployeeLoanPage = lazy(() => import("../features/payroll/pages/EmployeeLoanPage.jsx"));
const TaxDeclarationPage = lazy(() => import("../features/payroll/pages/TaxDeclarationPage.jsx"));
const PayrollReportsPage = lazy(() => import("../features/payroll/pages/PayrollReportsPage.jsx"));
const PrincipalPayrollApprovalPage = lazy(() => import("../features/payroll/pages/PrincipalPayrollApprovalPage.jsx"));
const AccountantPayrollWorkspace = lazy(() => import("../features/payroll/pages/AccountantPayrollWorkspace.jsx"));
const HRSalaryManagementPage = lazy(() => import("../features/payroll/pages/HRSalaryManagementPage.jsx"));
const EmployeeLoanManagementPage = lazy(() => import("../features/payroll/pages/EmployeeLoanManagementPage.jsx"));
const MyPayrollDashboard = lazy(() => import("../features/payroll/pages/MyPayrollDashboard.jsx"));
const MyLoanRequestPage = lazy(() => import("../features/payroll/pages/MyLoanRequestPage.jsx"));
const MyTaxDeclarationPage = lazy(() => import("../features/payroll/pages/MyTaxDeclarationPage.jsx"));
const PayrollAuditReportsPage = lazy(() => import("../features/payroll/pages/PayrollAuditReportsPage.jsx"));

// Routes helpers (NO lazy)
import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import RoleBasedRedirect from "../routes/RoleBasedRedirect.jsx";
import Register from "../components/forms/RegisterForm.jsx";

const employeePayrollRoleRoutes = [
  ["viceprincipal", "Vice Principal"],
  ["subjectcoordinator", "Subject Coordinator"],
  ["librarian", "Librarian"],
  ["hostelwarden", "Hostel Warden"],
  ["transportmanager", "Transport Manager"],
  ["examcoordinator", "Exam Coordinator"],
  ["receptionist", "Receptionist"],
  ["itsupport", "IT Support"],
  ["counselor", "Counselor"],
  ["security", "Security"],
].flatMap(([basePath, role]) => [
  { path: `${basePath}/payroll`, element: (<ProtectedRoute allowedRoles={[role]}><MyPayrollDashboard /></ProtectedRoute>) },
  { path: `${basePath}/payroll/payslips`, element: (<ProtectedRoute allowedRoles={[role]}><MyPayslipsPage /></ProtectedRoute>) },
  { path: `${basePath}/payroll/salary-structure`, element: (<ProtectedRoute allowedRoles={[role]}><SalaryStructurePage /></ProtectedRoute>) },
  { path: `${basePath}/payroll/loans`, element: (<ProtectedRoute allowedRoles={[role]}><MyLoanRequestPage /></ProtectedRoute>) },
  { path: `${basePath}/payroll/tax-declaration`, element: (<ProtectedRoute allowedRoles={[role]}><MyTaxDeclarationPage /></ProtectedRoute>) },
]);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgetPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/resend-verification", element: <ResendVerificationPage /> },
      { path: "/no-active-year", element: <NoActiveYear /> },
      { path: "unauthorized", element: <Unauthorized /> },
      { path: "*", element: <Unauthorized /> },
      { path: "NotFoundPage", element:<NotFoundPage/> },
      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          { index: true, element: <RoleBasedRedirect /> },

          {
            path: "modules",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "School Admin",
                  "Principal",
                  "Vice Principal",
                  "Teacher",
                  "Subject Coordinator",
                  "Student",
                  "Parent",
                  "Accountant",
                  "Staff",
                  "Support Staff",
                  "Librarian",
                  "Hostel Warden",
                  "Transport Manager",
                  "Exam Coordinator",
                  "Receptionist",
                  "IT Support",
                  "Counselor",
                  "Security",
                ]}
              >
                <ModuleOverview />
              </ProtectedRoute>
            ),
          },
          {
            path: "modules/:moduleKey",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "School Admin",
                  "Principal",
                  "Vice Principal",
                  "Teacher",
                  "Subject Coordinator",
                  "Student",
                  "Parent",
                  "Accountant",
                  "Staff",
                  "Support Staff",
                  "Librarian",
                  "Hostel Warden",
                  "Transport Manager",
                  "Exam Coordinator",
                  "Receptionist",
                  "IT Support",
                  "Counselor",
                  "Security",
                ]}
              >
                <ModuleDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "support/tickets",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "Super Admin",
                  "School Admin",
                  "Principal",
                  "Vice Principal",
                  "Teacher",
                  "Subject Coordinator",
                  "Student",
                  "Parent",
                  "Accountant",
                  "Staff",
                  "Support Staff",
                  "Librarian",
                  "Hostel Warden",
                  "Transport Manager",
                  "Exam Coordinator",
                  "Receptionist",
                  "IT Support",
                  "Counselor",
                  "Security",
                ]}
              >
                <SupportTicketsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "superadmin",
            element: (
              <ProtectedRoute allowedRoles={["Super Admin"]}>
               <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SuperAdminDashboard /> },
              { path: "payroll", element: <SuperAdminPayrollOverview /> },
              { path: "payroll/schools", element: <SuperAdminPayrollOverview /> },
              { path: "payroll/plans", element: <SuperAdminPayrollOverview /> },
              { path: "payroll/compliance-templates", element: <PayrollReportsPage /> },
              { path: "payroll/audit-logs", element: <PayrollAuditReportsPage /> },
              { path: "schools", element: <Schools /> },
              { path: "subscriptions", element: <SubscriptionPlans /> },
             // { path: "subscriptions/:id/logs", element: <PlanLogs /> },
              { path: "reports/schools", element: <SchoolReports /> },
              { path: "users/admins", element: <Admins /> },
              { path: "users/teachers", element: <Teachers /> },
              { path: "users/staff", element: <Staff /> },
              { path: "users/students", element: <Students /> },
              { path: "users/parents", element: <Parents /> },
              { path: "users/accountant", element: <Accountant /> },
              { path: "users/librarian", element: <Librarian /> },
              { path: "users/transport", element: <Transport /> },
              { path: "user-create", element: <UserRegister /> },
              { path: "settings/roles", element: <Roles /> },
              { path: "settings/permissions", element: <Permissions /> },
              { path: "modules", element: <Modules /> },
              { path: "academics/academic-years", element: <AcademicYears /> },
              { path: "reports", element: <Reports /> },
              { path: "settings", element: <Settings /> },
              { path: "academics/subjects", element: <SubjectsAdmin /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "academics/classes", element: <ClassPage /> },
              { path: "classes-sections/list", element: <ClassSectionList /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "reports/school-wise", element: <SchoolWiseReports /> },
              { path: "reports/attendance", element: <AttendanceDashboardPage /> },
               { path: "attendance/mark", element: <MarkAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "reports/finance", element: <FinanceSummary /> },
              { path: "reports/academic", element: <AcademicReports /> },
              { path: "reports/activity", element: <ActivityLogs /> },
              { path: "fees/categories", element: <FeeCategories /> },
              { path: "designations", element: <Designations /> },
              { path: "departments", element: <Departments /> },
              { path: "settings/global", element: <GlobalConfig /> },
              { path: "settings/audit", element: <AuditLogs /> },
              { path: "settings/backup", element: <Backups /> },
              { path: "academics/boards", element: <SchoolBoards /> },
              { path: "academics/chapters-topics", element: <ChaptersTopics /> },
              { path: "academics/boards-class", element: <BoardClassPage /> },
              { path: "payments", element: <PaymentsPage /> },
              { path: "revenue", element: <RevenuePage /> },
              { path: "reports/usage", element: <PlatformUsage /> },
              { path: "reports/revenue", element: <RevenueAnalytics/> },
              { path: "support/tickets", element: <TicketPage/> },
              { path: "support/contact", element: <ContactSupport/> },
              { path: "support/documentation", element: <Documentation/> },
              { path: "support/faqs", element: <Faqs/> },
            ],
          },
          {
            path: "schooladmin",
            element: (
              <ProtectedRoute allowedRoles={["School Admin"]}>
              <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SchoolAdminDashboard /> },
              //{ path: "users/student/add", element: <AddStudent /> },
              //{ path: "users/teacher/add", element: <AddTeacher /> },
              { path: "parents-register", element: <ParentList /> },
              { path: "teacher", element: <TeacherList /> },
              { path: "user-create", element: <UserRegister /> },
              { path: "classes", element: <Classes /> },
              { path: "subjects", element: <Subjects /> },
              { path: "attendance/students", element: <AllStudentsAttendance /> },
              { path: "attendance/staff", element: <StaffAttendance /> },
               { path: "attendance/mark", element: <MarkAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/dashboard", element: <AttendanceDashboardPage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "library/books", element: <Books /> },
              { path: "library/issue", element: <IssueBook /> },
              { path: "library/card", element: <LibraryCard /> },
              { path: "timetable", element: <SchoolAdminTimetablePage /> },
              { path: "timetable/time-slots", element: <TimeSlotManager /> },
              { path: "timetable/rooms", element: <RoomManager /> },
              { path: "timetable/class", element: <ClassTimetable /> },
              { path: "timetable/teacher", element: <TeacherTimetable /> },
              { path: "fees/categories", element: <SchoolFeeCategories /> },
             
              { path: "hostel", element: <HostelManagement /> },
              { path: "hostel/allocation", element: <RoomAllocation /> },
              { path: "transport/routes", element: <RoutesPage /> },
              { path: "transport/vehicles", element: <Vehicles /> },
              { path: "transport/assignments", element: <TransportAssignments /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "reports", element: <SchoolAdminReport /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "admission", element: <AddStudent /> },
              { path: "studentList", element: <StudentList /> },
              { path: "students/promotion", element: <StudentPromotion /> },
              { path: "exams/exams-create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/exams-list", element: <ExamsPage /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
               { path: "exams/paper-builder", element: <PaperBuilder /> },
              { path: "exams/admit-card", element: <AdmitCardPage /> },
              { path: "exams/seat-plan", element: <SeatPlanPage /> },
              { path: "exams/analytics", element: <ExamAnalyticsPage /> },
              { path: "exams/reports", element: <ExamReports /> },
            
              { path: "users/employee-details", element: <EmployeeDetailes /> },
              // Backward-compatible routes (legacy typos)
             
              { path: "users/employee-detailes", element: <EmployeeDetailes /> },
              { path: "calendar", element: <CalendarPage /> },
              { path: "events", element: <Events /> },
              { path: "inventory/supplies", element: <Supplies /> },
              { path: "inventory/assets", element: <Assets /> },
              { path: "fees/feestructure", element: <FeeStructure /> },
              { path: "fees/assign", element: <StudentAssignFees /> },
              { path: "payroll", element: <PayrollDashboardPage /> },
              { path: "payroll/create-employee", element: <CreateEmployee /> },
              { path: "payroll/settings", element: <PayrollSettingsPage /> },
              { path: "payroll/components", element: <SalaryComponentsPage /> },
              { path: "payroll/salary-structures", element: <SalaryStructurePage /> },
              { path: "payroll/cycles", element: <PayrollCyclePage /> },
              { path: "payroll/runs", element: <PayrollRunPageFeature /> },
              { path: "payroll/runs/:cycleId", element: <PayrollRunPageFeature /> },
              { path: "payroll/payslips", element: <PayslipPage /> },
              { path: "payroll/loans", element: <EmployeeLoanPage /> },
              { path: "payroll/tax-declarations", element: <TaxDeclarationPage /> },
              { path: "payroll/reports", element: <PayrollReportsPage /> },
              { path: "payroll/audit-logs", element: <PayrollAuditReportsPage /> },
              { path: "school-setup", element: <SchoolSetup /> },
              

            ],
          },
          {
            path: "teacher",
            element: (
              <ProtectedRoute allowedRoles={["Teacher"]}>
               <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <TeacherDashboard /> },
              { path: "classes", element: <AssignedClasses /> },
              { path: "classes/:classId", element: <ClassDetails /> },
              { path: "students", element: <MyStudents /> },
              { path: "assignments", element: <Assignments /> },
              { path: "attendance/students", element: <StudentAttendance /> },
              { path: "attendance", element: <MonthlyAttendanceReport /> },
              { path: "attendance/my", element: <MyAttendancePage /> },
              { path: "attendance/my/monthly", element: <MyAttendanceMonthlyReport /> },
             // { path: "exams", element: <ScheduleExams /> },
              { path: "exams/create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/create-question", element: <CreateQuestion /> },
              { path: "exams/bulk-upload-questions", element: <BulkUploadQuestions /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/list", element: <TeacherExamsPage /> },
              { path: "exams/evaluation", element: <TeacherEvaluationPage /> },
              { path: "timetable", element: <TeacherTimetablePage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              
               { path: "attendance", element: <MyAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "profile/change-password", element: <ChangePassword /> },
              { path: "payroll", element: <MyPayrollDashboard /> },
              { path: "payroll/payslips", element: <MyPayslipsPage /> },
              { path: "my-payslips", element: <MyPayslipsPage /> },
              { path: "payroll/salary-structure", element: <SalaryStructurePage /> },
              { path: "payroll/loans", element: <MyLoanRequestPage /> },
              { path: "payroll/tax-declaration", element: <MyTaxDeclarationPage /> },
              { path: "reports", element: <TeacherReports /> },
             

            ],
          },
          {
            path: "student",
            element: (
              <ProtectedRoute allowedRoles={["Student"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <StudentDashboard /> },
              { path: "profile", element: <StudentProfile /> },
              { path: "homework", element: <StudentHomework /> },
              { path: "attendance", element: <StudentAttendancePage /> },
              { path: "grades", element: <StudentGrades /> },
              { path: "timetable", element: <StudentTimetablePage /> },
              { path: "library", element: <StudentAllowedBook /> },
              { path: "hostel", element: <HostelManagement /> },
              { path: "transport", element: <StudentTransport /> },
              { path: "fees", element: <FeeStudent /> },
              { path: "exams/attempt-review", element: <AttemptReview /> },
              { path: "exams/exam-live", element: <ExamLive /> },
              { path: "exams", element: <StudentExamsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "notification", element: <Notification /> },
 
            ],
          },
          {
            path: "parent",
            element: (
              <ProtectedRoute allowedRoles={["Parent"]}>
              <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <ParentDashboard /> },
              { path: "children", element: <MyChildren /> },
              { path: "attendance", element: <ChildAttendancePage /> },
              { path: "grades", element: <ChildGrades /> },
              { path: "homework", element: <ChildHomework /> },
               { path: "fees", element: <ParentFees /> },
              { path: "exams", element: <ParentExamsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "reports", element: <ExamReports /> },
               { path: "timetable", element: <ParentChildTimetablePage /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
          {
            path: "accountant",
            element: (
              <ProtectedRoute allowedRoles={["Accountant"]}>
              <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <AccountantDashboard /> },
              { path: "fees/collect", element: <CollectFees /> },
              { path: "payroll", element: <AccountantPayrollWorkspace /> },
              { path: "payroll/cycles", element: <PayrollCyclePage /> },
              { path: "payroll/runs", element: <PayrollRunPageFeature /> },
              { path: "payroll/runs/:cycleId", element: <PayrollRunPageFeature /> },
              { path: "payroll/adjustments", element: <AccountantPayrollWorkspace /> },
              { path: "payroll/payslips", element: <PayslipPage /> },
              { path: "payroll/bank-export", element: <PayrollReportsPage /> },
              { path: "payroll/reports", element: <PayrollReportsPage /> },
            
              { path: "reports", element: <Reports /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
             
              { path: "attendance", element: <MyAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },

          {
            path: "principal",
            element: (
              <ProtectedRoute allowedRoles={["Principal"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SchoolAdminDashboard /> },
              { path: "overview", element: <SchoolAdminDashboard /> },
              { path: "payroll", element: <PayrollDashboardPage /> },
              { path: "payroll/approvals", element: <PrincipalPayrollApprovalPage /> },
              { path: "payroll/reports", element: <PayrollReportsPage /> },
              { path: "payroll/audit-logs", element: <PayrollAuditReportsPage /> },
              { path: "staff", element: <TeacherList /> },
              { path: "students", element: <StudentList /> },
              { path: "reports/academic", element: <ExamReports /> },
              { path: "reports/attendance", element: <MonthlyReportPage /> },
              { path: "attendance/mark", element: <MarkAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "exams", element: <ExamsPage /> },
               { path: "exams/create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
              { path: "exams/paper-builder", element: <PaperBuilder /> },
              { path: "exams/admit-card", element: <AdmitCardPage /> },
              { path: "exams/seat-plan", element: <SeatPlanPage /> },
              { path: "exams/analytics", element: <ExamAnalyticsPage /> },
              { path: "library", element: <LibraryCard /> },
              { path: "transport", element: <RoutesPage /> },
              { path: "timetable", element: <PrincipalTimetableOverview /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
            
            ],
         
          },
           ...employeePayrollRoleRoutes,
          {
            path: "viceprincipal/timetable",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <PrincipalTimetableOverview />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <ExamsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/create",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <ExamCreate />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/edit/:id",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <ExamCreate />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/schedule",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <ExamSchedule />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/grades",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <EnterGrades />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/paper-builder",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <PaperBuilder />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/admit-card",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <AdmitCardPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/seat-plan",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <SeatPlanPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/exams/analytics",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <ExamAnalyticsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "viceprincipal/*",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "subjectcoordinator/*",
            element: (
              <ProtectedRoute allowedRoles={["Subject Coordinator"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "librarian/*",
            element: (
              <ProtectedRoute allowedRoles={["Librarian"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "hostelwarden/*",
            element: (
              <ProtectedRoute allowedRoles={["Hostel Warden"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "transportmanager/*",
            element: (
              <ProtectedRoute allowedRoles={["Transport Manager"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
           {
            path: "examcoordinator",
            element: (
              <ProtectedRoute allowedRoles={["Exam Coordinator"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <RoleDynamicPortal /> },
              { path: "exams", element: <ExamsPage /> },
              { path: "exams/create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
               { path: "exams/paper-builder", element: <PaperBuilder /> },
              { path: "exams/admit-card", element: <AdmitCardPage /> },
              { path: "exams/seat-plan", element: <SeatPlanPage /> },
              { path: "exams/analytics", element: <ExamAnalyticsPage /> },
              { path: "reports", element: <ExamReports /> },
              { path: "profile", element: <Profile /> },
              { path: "message", element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
          {
            path: "receptionist/*",
            element: (
              <ProtectedRoute allowedRoles={["Receptionist"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "itsupport/*",
            element: (
              <ProtectedRoute allowedRoles={["IT Support"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <ITSupportDashboard /> },
              { path: "maintenance", element: <SystemMaintenance /> },
              { path: "tickets", element: <UserSupportTickets /> },
              { path: "network", element: <NetworkStatus /> },
              { path: "logs", element: <SystemLogs /> },
              { path: "profile", element: <ITSupportProfile /> },
              { path: "message", element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
          {
            path: "counselor/*",
            element: (
              <ProtectedRoute allowedRoles={["Counselor"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },
          {
            path: "security/*",
            element: (
              <ProtectedRoute allowedRoles={["Security"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
          },

          { path: "hr/payroll/salary-management", element: (<ProtectedRoute allowedRoles={["HR"]}><HRSalaryManagementPage /></ProtectedRoute>) },
          { path: "hr/payroll/salary-revisions", element: (<ProtectedRoute allowedRoles={["HR"]}><HRSalaryManagementPage /></ProtectedRoute>) },
          { path: "hr/payroll/loans", element: (<ProtectedRoute allowedRoles={["HR"]}><EmployeeLoanManagementPage /></ProtectedRoute>) },
          { path: "hr/payroll/tax-declarations", element: (<ProtectedRoute allowedRoles={["HR"]}><TaxDeclarationPage /></ProtectedRoute>) },
          { path: "hr/payroll/employee-profiles", element: (<ProtectedRoute allowedRoles={["HR"]}><SalaryStructurePage /></ProtectedRoute>) },
          { path: "auditor/payroll/reports", element: (<ProtectedRoute allowedRoles={["Auditor", "Management"]}><PayrollAuditReportsPage /></ProtectedRoute>) },
          { path: "auditor/payroll/department-cost", element: (<ProtectedRoute allowedRoles={["Auditor", "Management"]}><PayrollReportsPage /></ProtectedRoute>) },
          { path: "auditor/payroll/statutory", element: (<ProtectedRoute allowedRoles={["Auditor", "Management"]}><PayrollReportsPage /></ProtectedRoute>) },
          { path: "auditor/payroll/audit-logs", element: (<ProtectedRoute allowedRoles={["Auditor", "Management"]}><PayrollAuditReportsPage /></ProtectedRoute>) },
          {
            path: "workspace",
            element: (
              <ProtectedRoute
                allowedRoles={[
                  "Principal",
                  "Vice Principal",
                  "Subject Coordinator",
                  "Support Staff",
                  "Librarian",
                  "Hostel Warden",
                  "Transport Manager",
                  "Exam Coordinator",
                  "Receptionist",
                  "IT Support",
                  "Counselor",
                  "Security",
                ]}
              >
                <RoleWorkspace />
              </ProtectedRoute>
            ),
          },
          {
            path: "staff",
            element: (
                <ProtectedRoute allowedRoles={["Staff", "Support Staff"]}>
            <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "tasks", element: <Schedule /> },
              { path: "payroll", element: <MyPayrollDashboard /> },
              { path: "payroll/payslips", element: <MyPayslipsPage /> },
              { path: "my-payslips", element: <MyPayslipsPage /> },
              { path: "payroll/salary-structure", element: <SalaryStructurePage /> },
              { path: "payroll/loans", element: <MyLoanRequestPage /> },
              { path: "payroll/tax-declaration", element: <MyTaxDeclarationPage /> },
              { path: "attendance", element: <MyAttendancePage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
