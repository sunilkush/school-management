import { PrimeReactProvider } from 'primereact/api';
import Tailwind from 'primereact/passthrough/tailwind';
import { twMerge } from 'tailwind-merge';
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./index.css";
import "antd/dist/reset.css";
import App from "./App.jsx";
import store, { persistor } from "./store/store.js";
import {Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import React, { Suspense } from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
// Auth & Core
const LoginPage = lazy(() => import("./pages/Auth/LoginPage.jsx"));
const Dashboard = lazy(() => import("./components/layout/MainDashboard.jsx"));
const Unauthorized = lazy(() => import("./pages/Unauthorized.jsx"));
const NoActiveYear = lazy(() => import("./pages/no-active-year.jsx"));
const ForgetPasswordPage = lazy(()=>import("./pages/Auth/ForgetPasswordPage.jsx"));
const ResetPasswordPage = lazy(()=>import("./pages/Auth/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(()=> import("./pages/Auth/VerifyEmailPage.jsx"));
const ResendVerificationPage = lazy(()=>import("./pages/Auth/ResendVerificationPage.jsx"));

const NotFoundPage = lazy(()=>import("./pages/NotFoundPage.jsx"));
// Dashboards
const SuperAdminDashboard = lazy(() => import("./pages/Super_Admin/Dashboard/SuperAdminDashboard.jsx"));
const SchoolAdminDashboard = lazy(() => import("./pages/School_Admin/Dashboard/SchoolAdminDashboard.jsx"));
const StudentDashboard = lazy(() => import("./pages/Student/Dashboard/StudentDashboard.jsx"));
const TeacherDashboard = lazy(() => import("./pages/Teacher/Dashboard/TeacherDashboard.jsx"));
const AccountantDashboard = lazy(() => import("./pages/Accountant/Dashboard/AccountantDashboard.jsx"));
const StaffDashboard = lazy(() => import("./pages/Staff/Dashboard/StaffDashboard.jsx"));
const ParentDashboard = lazy(() => import("./pages/Parent/Dashboard/ParentDashboard.jsx"));

// Common
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Notification = lazy(() => import("./pages/Notification.jsx"));
const Message = lazy(() => import("./pages/Message.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const Schedule = lazy(() => import("./pages/Schedule.jsx"));
const Loader = lazy(()=> import("./components/Loader/Loader.jsx"));
// Super Admin
const Reports = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/Reports.jsx"));
const Schools = lazy(() => import("./pages/Super_Admin/School_Management/Schools.jsx"));
const AddSchool = lazy(() => import("./pages/Super_Admin/School_Management/AddSchool.jsx"));
const SubscriptionPlans = lazy(() => import("./pages/Super_Admin/School_Management/SubscriptionPlans.jsx"));
const SchoolReports = lazy(() => import("./pages/Super_Admin/School_Management/SchoolReports.jsx"));
const PaymentsPage = lazy(() => import("./pages/Super_Admin/School_Management/PaymentsPage.jsx"));
const RevenuePage = lazy(() => import("./pages/Super_Admin/School_Management/RevenuePage.jsx"));
//const PlanLogs = lazy(() => import("./pages/SuperAdmin/Schools/PlanLogs.jsx"));

const Roles = lazy(() => import("./pages/Super_Admin/System_Settings/Roles.jsx"));
const Permissions = lazy(() => import("./pages/Super_Admin/System_Settings/Permissions.jsx"));
const GlobalConfig = lazy(() => import("./pages/Super_Admin/System_Settings/GlobalConfig.jsx"));
const AuditLogs = lazy(() => import("./pages/Super_Admin/System_Settings/AuditLogs.jsx"));
const Backups = lazy(() => import("./pages/Super_Admin/System_Settings/Backups.jsx"));

const AcademicYears = lazy(() => import("./pages/Super_Admin/Master_Settings/AcademicYears.jsx"));
const ClassPage = lazy(() => import("./pages/Super_Admin/Master_Settings/ClassPage.jsx"));
const ClassSectionList = lazy(() => import("./pages/Super_Admin/Master_Settings/ClassSectionList.jsx"));
const SubjectsAdmin = lazy(() => import("./pages/Super_Admin/Master_Settings/SubjectsAdmin.jsx"));
const FeeCategories = lazy(() => import("./pages/Super_Admin/Master_Settings/FeeCategories.jsx"));
const Designations = lazy(() => import("./pages/Super_Admin/Master_Settings/Designations.jsx"));
const Departments = lazy(() => import("./pages/Super_Admin/Master_Settings/Departments.jsx"));
const SchoolBoards = lazy(() => import("./pages/Super_Admin/Master_Settings/SchoolBoards.jsx"));
const ChaptersTopics = lazy(() => import("./pages/Super_Admin/Master_Settings/ChaptersTopics.jsx"));
const BoardClassPage = lazy(() => import("./pages/Super_Admin/Master_Settings/BoardClassPage.jsx"));

const Modules = lazy(() => import("./pages/Super_Admin/Modules/Modules.jsx"));
const SchoolWiseReports = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/SchoolWiseReports.jsx"));
const AttendanceSummary = lazy(() => import("./pages/School_Admin/Reports/schoolAdminReport.jsx"));
const FinanceSummary = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/FinanceSummary.jsx"));
const AcademicReports = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/AcademicReports.jsx"));
const ActivityLogs = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/ActivityLogs.jsx"));
const PlatformUsage = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/PlatfromUsage.jsx"));
const RevenueAnalytics = lazy(()=> import("./pages/Super_Admin/Reports_&_Analytics/RevenueAnalytics.jsx"));
// Super Admin Users
const Admins = lazy(() => import("./pages/Super_Admin/Users_Management/Admins.jsx"));
const Staff = lazy(() => import("./pages/Super_Admin/Users_Management/Staff.jsx"));
const Teachers = lazy(() => import("./pages/Super_Admin/Users_Management/Teachers.jsx"));
const Parents = lazy(() => import("./pages/Super_Admin/Users_Management/Parents.jsx"));
const Students = lazy(() => import("./pages/Super_Admin/Users_Management/students.jsx"));
const Accountant = lazy(() => import("./pages/Super_Admin/Users_Management/Accountant.jsx"));
const Librarian = lazy(() => import("./pages/Super_Admin/Users_Management/Librarian.jsx"));
const Transport = lazy(() => import("./pages/Super_Admin/Users_Management/Transport.jsx"));
// Super Admin Support
const TicketPage = lazy(() => import("./pages/Super_Admin/Support/TicketPage.jsx"));
const Faqs = lazy(() => import("./pages/Super_Admin/Support/Faqs.jsx"));
const ContactSupport = lazy(() => import("./pages/Super_Admin/Support/ContactSupport.jsx"));
const Documentation = lazy(() => import("./pages/Super_Admin/Support/Documentation.jsx"));
// School Admin
const TeacherList = lazy(() => import("./pages/School_Admin/User_Management/TeacherList.jsx"));
//const AddStudent = lazy(() => import("./pages/School_Admin/User_Management/AddStudent.jsx"));
//const AddTeacher = lazy(() => import("./pages/School_Admin/User_Management/AddTeacher.jsx"));
const ParentList = lazy(() => import("./pages/School_Admin/User_Management/ParentsList.jsx"));
const StudentList = lazy(() => import("./pages/School_Admin/User_Management/StudentList.jsx"));

const Classes = lazy(() => import("./pages/School_Admin/Academic_Management/Classes.jsx"));
const Subjects = lazy(() => import("./pages/School_Admin/Academic_Management/Subjects.jsx"));

const ExamSchedule = lazy(() => import("./pages/School_Admin/Exams_&_Grades/ExamSchedule.jsx"));
const EnterGrades = lazy(() => import("./pages/School_Admin/Exams_&_Grades/EnterGrades.jsx"));
const ExamReports = lazy(() => import("./pages/School_Admin/Exams_&_Grades/ExamReport.jsx"));
const ExamsPage = lazy(() => import("./pages/School_Admin/Exams_&_Grades/ExamPage.jsx"));
const ExamCreate = lazy(() => import("./pages/School_Admin/Exams_&_Grades/CreateExam.jsx"));

const AllStudentsAttendance = lazy(() => import("./pages/School_Admin/Attendance/AllStudentsAttendance.jsx"));
const StaffAttendance = lazy(() => import("./pages/School_Admin/Attendance/StaffAttendance.jsx"));

const Books = lazy(() => import("./pages/School_Admin/Library/Books.jsx"));
const IssueBook = lazy(() => import("./pages/School_Admin/Library/IssueBook.jsx"));
const LibraryCard = lazy(() => import("./pages/School_Admin/Library/LibraryCard.jsx"));

const ClassTimetable = lazy(() => import("./pages/School_Admin/Timetables/ClassTimetable.jsx"));
const TeacherTimetable = lazy(() => import("./pages/School_Admin/Timetables/TeacherTimetable.jsx"));

const CollectFees = lazy(() => import("./pages/School_Admin/Fees_Management/CollectFees.jsx"));
const FeeStructure = lazy(() => import("./pages/School_Admin/Fees_Management/FeeStructure.jsx"));
const StudentAssignFees = lazy(() => import("./pages/School_Admin/Fees_Management/AssignStudentFeeForm.jsx"));
const SchoolFeeCategories = lazy(() => import("./pages/School_Admin/Fees_Management/SchoolFeeCategories.jsx"));

const HostelManagement = lazy(() => import("./pages/School_Admin/Hostel/HostelManagement.jsx"));
const RoomAllocation = lazy(() => import("./pages/School_Admin/Hostel/RoomAllocation.jsx"));

const RoutesPage = lazy(() => import("./pages/School_Admin/Transport/RoutesPage.jsx"));
const Vehicles = lazy(() => import("./pages/School_Admin/Transport/Vehicles.jsx"));

const EmployeeSalaries = lazy(() => import("./pages/School_Admin/Payroll/EmployeeSalaries.jsx"));
const GeneratePayslip = lazy(() => import("./pages/School_Admin/Payroll/GeneratePayslip.jsx"));

const SendNotification = lazy(() => import("./pages/School_Admin/Communication/SendNotification.jsx"));
const SmsEmailHistory = lazy(() => import("./pages/School_Admin/Communication/SmsEmailHistory.jsx"));

const Supplies = lazy(() => import("./pages/School_Admin/Inventory/supplies.jsx"));
const Assets = lazy(() => import("./pages/School_Admin/Inventory/assets.jsx"));

const Events = lazy(() => import("./pages/School_Admin/Events_&_Calendar/events.jsx"));
const CalendarPage = lazy(() => import("./pages/School_Admin/Events_&_Calendar/CalendarPage.jsx"));

const SettingsPage = lazy(() => import("./pages/School_Admin/Settings/SettingsPage.jsx"));
const SchoolAdminReport = lazy(() => import("./pages/School_Admin/Reports/schoolAdminReport.jsx"));
const SchoolSetup = lazy(()=>import("./pages/School_Admin/School_Setup/SchoolSetup.jsx"));

// Teacher
const QuestionBank = lazy(() => import("./pages/Teacher/Exams/QuestionBank.jsx"));
const CreateExam = lazy(() => import("./pages/Teacher/Exams/EditExamForm.jsx"));
const TeacherExamsPage = lazy(() => import("./pages/Teacher/Exams/TeacherExamsPage.jsx"));
const AssignedClasses = lazy(() => import("./pages/Teacher/Classes/AssignedClasses.jsx"));
const ClassDetails = lazy(() => import("./pages/Teacher/Classes/ClassDetails.jsx"));
const Assignments = lazy(() => import("./pages/Teacher/Assignments/Assignments.jsx"));
const MyStudents = lazy(() => import("./pages/Teacher/My_Students/MyStudents.jsx"));
const StudentAttendance = lazy(() => import("./pages/Teacher/Attendance/StudentAttendance.jsx"));
const EmployeeDetailes = lazy(() => import("./pages/Teacher/Profile/EmployeeDetailes.jsx"));
const MonthlyAttendanceReport = lazy(() => import("./pages/Teacher/Attendance/MonthlyAttendanceReport.jsx"));
const MyAttendancePage = lazy(() => import("./pages/Teacher/Profile/MyAttendancePage.jsx"));
const TeacherReports = lazy(() => import("./pages/Teacher/Reports/TeacherReports.jsx"));
// Student
const FeeStudent = lazy(() => import("./pages/Student/Fees/FeeStudent.jsx"));
const StudentHomework = lazy(() => import("./pages/Student/Homework/StudentHomework.jsx"));
const ExamLive = lazy(() => import("./pages/Student/Exams/ExamLive.jsx"));
const AttemptReview = lazy(() => import("./pages/Student/Exams/AttemptReview.jsx"));
const StudentExamsPage = lazy(() => import("./pages/Student/Exams/StudentExamsPage.jsx"));

// Parent
const MyChildren = lazy(() => import("./pages/Parent/Children/MyChildren.jsx"));
const ChildAttendance = lazy(() => import("./pages/Parent/Attendance/ChildAttendance.jsx"));
const ChildGrades = lazy(() => import("./pages/Parent/Grades/ChildGrades.jsx"));
const ChildHomework = lazy(() => import("./pages/Parent/Homework/ChildHomework.jsx"));
const ChildMessages = lazy(() => import("./pages/Parent/Messages/ChildMessages.jsx"));
const ParentExamsPage = lazy(() => import("./pages/Parent/Exams/ParentExamsPage.jsx"));

// Other
const UserRegister = lazy(() => import("./pages/UserRegister.jsx"));
const RoleWorkspace = lazy(() => import("./pages/RoleWorkspace.jsx"));
const RoleDynamicPortal = lazy(() => import("./pages/RoleDynamicPortal.jsx"));
const ModuleOverview = lazy(() => import("./pages/modules/ModuleOverview.jsx"));
const ModuleDetail = lazy(() => import("./pages/modules/ModuleDetail.jsx"));
const EmployeeForm = lazy(() => import("./components/forms/EmployeeForm.jsx"));
const ChangePassword = lazy(()=> import("./pages/Auth/ResetPasswordPage.jsx"));
const AttendanceDashboardPage = lazy(() => import("./pages/Attendance/AttendanceDashboard.jsx"));
const MarkAttendancePage = lazy(() => import("./pages/Attendance/MarkAttendancePage.jsx"));
const AttendanceTablePage = lazy(() => import("./pages/Attendance/AttendanceTablePage.jsx"));
const MonthlyReportPage = lazy(() => import("./pages/Attendance/MonthlyReportPage.jsx"));

const ChildAttendancePage = lazy(() => import("./pages/Attendance/ChildAttendancePage.jsx"));

// Routes helpers (NO lazy)
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleBasedRedirect from "./routes/RoleBasedRedirect.jsx";

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
            path: "superadmin",
            element: (
              <ProtectedRoute allowedRoles={["Super Admin"]}>
               <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SuperAdminDashboard /> },
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
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/dashboard", element: <AttendanceDashboardPage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "library/books", element: <Books /> },
              { path: "library/issue", element: <IssueBook /> },
              { path: "library/card", element: <LibraryCard /> },
              { path: "timetable/class", element: <ClassTimetable /> },
              { path: "timetable/teacher", element: <TeacherTimetable /> },
              { path: "fees/categories", element: <SchoolFeeCategories /> },
              { path: "fees/collect", element: <CollectFees /> },
              { path: "hostel", element: <HostelManagement /> },
              { path: "hostel/allocation", element: <RoomAllocation /> },
              { path: "transport/routes", element: <RoutesPage /> },
              { path: "transport/vehicles", element: <Vehicles /> },
              { path: "payroll", element: <EmployeeSalaries /> },
              { path: "payroll/payslip", element: <GeneratePayslip /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "reports", element: <SchoolAdminReport /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
             // { path: "admission", element: <AddStudent /> },
              { path: "studentList", element: <StudentList /> },
              { path: "exams/exams-create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/exams-list", element: <ExamsPage /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "users/employee-from", element: <EmployeeForm /> },
              { path: "users/employee-detailes", element: <EmployeeDetailes /> },
              { path: "calendar", element: <CalendarPage /> },
              { path: "events", element: <Events /> },
              { path: "inventory/supplies", element: <Supplies /> },
              { path: "inventory/assets", element: <Assets /> },
              { path: "fees/feestructure", element: <FeeStructure /> },
              { path: "fees/assign", element: <StudentAssignFees /> },
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
              { path: "attendance", element: <MonthlyAttendanceReport /> },
              { path: "attendance/my", element: <MyAttendancePage /> },
              { path: "attendance/my/monthly", element: <MyAttendancePage /> },
             // { path: "exams", element: <ScheduleExams /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/list", element: <TeacherExamsPage /> },
              { path: "timetable", element: <ClassTimetable /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "profile/change-password", element: <ChangePassword /> },
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
              { path: "profile", element: <Profile /> },
              { path: "homework", element: <StudentHomework /> },
              { path: "attendance", element: <MyAttendancePage /> },
              { path: "grades", element: <EnterGrades /> },
              { path: "timetable", element: <ClassTimetable /> },
              { path: "library", element: <Books /> },
              { path: "hostel", element: <HostelManagement /> },
              { path: "transport", element: <RoutesPage /> },
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
              { path: "fees", element: <FeeStudent /> },
              { path: "exams", element: <ParentExamsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <ChildMessages /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "reports", element: <ExamReports /> },
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
              { path: "fees/categories", element: <FeeCategories /> },
              { path: "fees/collect", element: <CollectFees /> },
              { path: "salary", element: <EmployeeSalaries /> },
              { path: "reports", element: <Reports /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },

          {
            path: "principal/*",
            element: (
              <ProtectedRoute allowedRoles={["Principal"]}>
                <RoleDynamicPortal />
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
            path: "examcoordinator/*",
            element: (
              <ProtectedRoute allowedRoles={["Exam Coordinator"]}>
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
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
                <RoleDynamicPortal />
              </ProtectedRoute>
            ),
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
              <ProtectedRoute allowedRoles={["Staff"]}>
            <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "tasks", element: <Schedule /> },
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



const mountNode = document.getElementById("root");

if (!mountNode) {
  throw new Error('Root container "#root" was not found.');
}

const ROOT_INSTANCE_KEY = "__school_management_react_root__";
const root = mountNode[ROOT_INSTANCE_KEY] ?? createRoot(mountNode);
mountNode[ROOT_INSTANCE_KEY] = root;

const renderApp = () => {
  root.render(
    <Provider store={store}>
      <PersistGate loading={<Loader />} persistor={persistor}>
        <ThemeProvider>
          <PrimeReactProvider
            value={{
              unstyled: true, // ✅ Must be true to apply Tailwind styles
              pt: Tailwind, // ✅ Add Tailwind preset
              ptOptions: {
                mergeSections: true,
                mergeProps: true,
                classNameMergeFunction: twMerge,
              },
            }}
          >
            <Suspense fallback={<Loader />}>
              <RouterProvider router={router} />
            </Suspense>
          </PrimeReactProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(renderApp);
}