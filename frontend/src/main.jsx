import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "@ant-design/v5-patch-for-react-19";
import "./index.css";
import "antd/dist/reset.css";
import App from "./App.jsx";
import store, { persistor } from "./store/store.js";
import {Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import React, { Suspense } from "react";
import Loader from "./components/Loader/Loader.jsx";
import { ConfigProvider, App as AntdApp, theme as antdTheme } from "antd";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";

export const ThemedAntWrapper = ({ children }) => {
  const { isDark } = useTheme();
  const palette = {
    primary: "#7c3aed",
    info: "#06b6d4",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          borderRadius: 14,
          borderRadiusLG: 18,
          borderRadiusSM: 10,
          colorPrimary: palette.primary,
          colorInfo: palette.info,
          colorSuccess: palette.success,
          colorWarning: palette.warning,
          colorError: palette.error,
          colorBgBase: isDark ? "#020617" : "#f8fafc",
          colorBgContainer: isDark ? "#0f172a" : "#ffffff",
          colorTextBase: isDark ? "#e2e8f0" : "#0f172a",
          colorBorder: isDark ? "#334155" : "#e2e8f0",
          boxShadow: isDark
            ? "0 12px 36px rgba(2, 6, 23, 0.55)"
            : "0 10px 30px rgba(15, 23, 42, 0.10)",
          fontFamily: '"Inter", "Poppins", sans-serif',
          fontSize: 13,
          fontSizeSM: 12,
          fontSizeLG: 14,
          fontSizeXL: 16,
          fontSizeHeading1: 28,
          fontSizeHeading2: 22,
          fontSizeHeading3: 18,
          fontSizeHeading4: 16,
          fontSizeHeading5: 14,
          fontWeightStrong: 500,
        },
        components: {
          Layout: {
            bodyBg: isDark ? "#020617" : "#f8fafc",
            siderBg: isDark ? "#0f172a" : "#ffffff",
            headerBg: isDark ? "#0f172a" : "#ffffff",
          },
          Card: {
            borderRadiusLG: 18,
          },
          Button: {
            borderRadius: 12,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 12,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 12,
            controlHeight: 40,
          },
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
};

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
const AccountantDashboard  = lazy(() => import("./pages/Accountant/Dashboard/AccountantDashboard.jsx"));
const IncomeManagement     = lazy(() => import("./pages/Accountant/Finance/IncomeManagement.jsx"));
const ExpenseManagement    = lazy(() => import("./pages/Accountant/Finance/ExpenseManagement.jsx"));
const FinancialReports     = lazy(() => import("./pages/Accountant/Reports/FinancialReports.jsx"));
const FeeReports           = lazy(() => import("./pages/Accountant/Reports/FeeReports.jsx"));
const StaffDashboard = lazy(() => import("./pages/Staff/Dashboard/StaffDashboard.jsx"));
const ParentDashboard = lazy(() => import("./pages/Parent/Dashboard/ParentDashboard.jsx"));

// Common
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Notification = lazy(() => import("./pages/Notification.jsx"));
const Message = lazy(() => import("./pages/Message.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const Schedule = lazy(() => import("./pages/Schedule.jsx"));
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
const AttendanceSummary = lazy(() => import("./pages/Super_Admin/Reports_&_Analytics/AttendanceSummary.jsx"));
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
const RoleDocumentation = lazy(() => import("./pages/Documentation/RoleDocumentation.jsx"));
// School Admin
const TeacherList = lazy(() => import("./pages/School_Admin/User_Management/TeacherList.jsx"));
const AddStudent = lazy(() => import("./pages/School_Admin/Teachers_&_Students/AddStudent.jsx"));
//const AddTeacher = lazy(() => import("./pages/School_Admin/User_Management/AddTeacher.jsx"));
const ParentList = lazy(() => import("./pages/School_Admin/User_Management/ParentsList.jsx"));
const StudentList = lazy(() => import("./pages/School_Admin/User_Management/StudentList.jsx"));
const StudentPromotion = lazy(() => import("./pages/School_Admin/Teachers_&_Students/StudentPromotion.jsx"));
const RollNumberManagement = lazy(() => import("./pages/School_Admin/Teachers_&_Students/RollNumberManagement.jsx"));
const CertificatesPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/CertificatesPage.jsx"));
const IDCardsPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/IDCardsPage.jsx"));
const HealthRecordsPage = lazy(() => import("./pages/MedicalOfficer/HealthRecordsPage.jsx"));
const DisciplinePage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/DisciplinePage.jsx"));
const AlumniPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/AlumniPage.jsx"));
const CanteenPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/CanteenPage.jsx"));
const PTMSessionsPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/PTMSessionsPage.jsx"));
const PTMBooking = lazy(() => import("./pages/Parent/PTM/PTMBooking.jsx"));
const SportsPage = lazy(() => import("./pages/SportsTeacher/SportsPage.jsx"));

const Classes = lazy(() => import("./pages/School_Admin/Academic_Management/Classes.jsx"));
const Subjects = lazy(() => import("./pages/School_Admin/Academic_Management/Subjects.jsx"));
const ClassTeacherAssignmentPage = lazy(() => import("./pages/School_Admin/Academic_Management/ClassTeacherAssignmentPage.jsx"));
const MyClassPage = lazy(() => import("./pages/Teacher/ClassTeacher/MyClassPage.jsx"));

const ExamSchedule = lazy(() => import("./pages/School_Admin/Exams_and_Grades/ExamSchedule.jsx"));
const EnterGrades = lazy(() => import("./pages/School_Admin/Exams_and_Grades/EnterGrades.jsx"));
const ExamReports = lazy(() => import("./pages/School_Admin/Exams_and_Grades/ExamReport.jsx"));
const ExamsPage = lazy(() => import("./pages/School_Admin/Exams_and_Grades/ExamPage.jsx"));
const ExamCreate = lazy(() => import("./pages/School_Admin/Exams_and_Grades/CreateExam.jsx"));
const PaperBuilder = lazy(() => import("./pages/School_Admin/Exams_and_Grades/PageBuilder.jsx"));
const AdmitCardPage = lazy(() => import("./pages/School_Admin/Exams_and_Grades/AdmitCardPage.jsx"));
const SeatPlanPage = lazy(() => import("./pages/School_Admin/Exams_and_Grades/SeatPlanPage.jsx"));
const ExamAnalyticsPage = lazy(() => import("./pages/School_Admin/Exams_and_Grades/ExamAnalyticsPage.jsx"));
const AllStudentsAttendance     = lazy(() => import("./pages/School_Admin/Attendance/AllStudentsAttendance.jsx"));
const StaffAttendance           = lazy(() => import("./pages/School_Admin/Attendance/StaffAttendance.jsx"));
const SATeacherAttendance       = lazy(() => import("./pages/School_Admin/Attendance/TeacherAttendance.jsx"));
const SALeaveManagement         = lazy(() => import("./pages/School_Admin/Attendance/LeaveManagement.jsx"));
const SAAttendanceReports       = lazy(() => import("./pages/School_Admin/Attendance/AttendanceReports.jsx"));
const SAAttendanceAnalytics     = lazy(() => import("./pages/School_Admin/Attendance/AttendanceAnalytics.jsx"));
const SAAttendanceDashboard     = lazy(() => import("./pages/School_Admin/Attendance/AttendanceDashboard.jsx"));

const Books = lazy(() => import("./pages/School_Admin/Library/Books.jsx"));
const IssueBook = lazy(() => import("./pages/School_Admin/Library/IssueBook.jsx"));
const LibraryCard = lazy(() => import("./pages/School_Admin/Library/LibraryCard.jsx"));
// Librarian Portal pages
const LibraryDashboard = lazy(() => import("./pages/Librarian/LibraryDashboard.jsx"));
const LibraryMembers   = lazy(() => import("./pages/Librarian/LibraryMembers.jsx"));
const LibraryReports   = lazy(() => import("./pages/Librarian/LibraryReports.jsx"));
const FineManagement   = lazy(() => import("./pages/Librarian/FineManagement.jsx"));
const LibrarySettings  = lazy(() => import("./pages/Librarian/LibrarySettings.jsx"));

const SchoolAdminTimetablePage = lazy(() => import("./pages/Timetable/SchoolAdminTimetablePage.jsx"));
const TimeSlotManager = lazy(() => import("./pages/Timetable/TimeSlotManager.jsx"));
const RoomManager = lazy(() => import("./pages/Timetable/RoomManager.jsx"));
const TeacherTimetablePage = lazy(() => import("./pages/Timetable/TeacherTimetablePage.jsx"));
const StudentTimetablePage = lazy(() => import("./pages/Timetable/StudentTimetablePage.jsx"));
const ParentChildTimetablePage = lazy(() => import("./pages/Timetable/ParentChildTimetablePage.jsx"));
const PrincipalTimetableOverview = lazy(() => import("./pages/Timetable/PrincipalTimetableOverview.jsx"));
const ClassTimetable = SchoolAdminTimetablePage;
const TeacherTimetable = TeacherTimetablePage;

const FeeStructure = lazy(() => import("./pages/School_Admin/Fees_Management/FeeStructure.jsx"));
const StudentAssignFees = lazy(() => import("./pages/School_Admin/Fees_Management/AssignStudentFeeForm.jsx"));
const SchoolFeeCategories = lazy(() => import("./pages/School_Admin/Fees_Management/SchoolFeeCategories.jsx"));
const FeeCollection = lazy(() => import("./pages/School_Admin/Fees_Management/FeeCollection.jsx"));
const AdmissionInquiryPage = lazy(() => import("./pages/School_Admin/Teachers_&_Students/AdmissionInquiry.jsx"));

const HostelManagement = lazy(() => import("./pages/School_Admin/Hostel/HostelManagement.jsx"));
const HostelAllocations = lazy(() => import("./pages/School_Admin/Hostel/HostelAllocations.jsx"));
const RoomAllocation = lazy(() => import("./pages/School_Admin/Hostel/RoomAllocation.jsx"));
const HostelDashboard      = lazy(() => import("./pages/HostelWarden/HostelDashboard.jsx"));
const LeaveManagement      = lazy(() => import("./pages/HostelWarden/LeaveManagement.jsx"));
const VisitorLog           = lazy(() => import("./pages/HostelWarden/VisitorLog.jsx"));
const ComplaintManagement  = lazy(() => import("./pages/HostelWarden/ComplaintManagement.jsx"));
const HostelAttendance     = lazy(() => import("./pages/HostelWarden/HostelAttendance.jsx"));
const HostelReports        = lazy(() => import("./pages/HostelWarden/HostelReports.jsx"));

const RoutesPage = lazy(() => import("./pages/School_Admin/Transport/RoutesPage.jsx"));
const Vehicles = lazy(() => import("./pages/School_Admin/Transport/Vehicles.jsx"));
const TransportAssignments = lazy(() => import("./pages/School_Admin/Transport/Assignments.jsx"));

const EmployeeSalaries = lazy(() => import("./pages/School_Admin/Payroll/EmployeeSalaries.jsx"));
const SalaryStructures = lazy(() => import("./pages/School_Admin/Payroll/SalaryStructures.jsx"));
const GeneratePayslip = lazy(() => import("./pages/School_Admin/Payroll/GeneratePayslip.jsx"));
const MonthlyPayrollReport = lazy(() => import("./pages/School_Admin/Payroll/MonthlyPayrollReport.jsx"));
const PayrollSelfServicePage = lazy(() => import("./pages/Employee/PayrollSelfServicePage.jsx"));
const CreateEmployee = lazy(()=>import('./pages/School_Admin/Payroll/CreateEmployee.jsx'));
const SalaryAdvance = lazy(() => import("./pages/School_Admin/Payroll/SalaryAdvance.jsx"));
const BonusIncentivePage = lazy(() => import("./pages/School_Admin/Payroll/BonusIncentivePage.jsx"));
const ReimbursementsPage = lazy(() => import("./pages/School_Admin/Payroll/ReimbursementsPage.jsx"));
const EmployeeSelfAttendance = lazy(() => import("./pages/Attendance/EmployeeSelfAttendance.jsx"));
const GeofenceSettings = lazy(() => import("./pages/School_Admin/Attendance/GeofenceSettings.jsx"));

const SendNotification = lazy(() => import("./pages/School_Admin/Communication/SendNotification.jsx"));
const CommunicationHub = lazy(() => import("./pages/School_Admin/Communication/CommunicationHub.jsx"));
const TaskManagement = lazy(() => import("./pages/School_Admin/Tasks/TaskManagement.jsx"));
const MyTasks = lazy(() => import("./pages/Tasks/MyTasks.jsx"));
const SmsEmailHistory = lazy(() => import("./pages/School_Admin/Communication/SmsEmailHistory.jsx"));

const Supplies = lazy(() => import("./pages/School_Admin/Inventory/supplies.jsx"));
const Assets = lazy(() => import("./pages/School_Admin/Inventory/assets.jsx"));
const InventoryStore = lazy(() => import("./pages/School_Admin/Inventory/InventoryStore.jsx"));

const Events = lazy(() => import("./pages/School_Admin/Events_&_Calendar/events.jsx"));
const CalendarPage = lazy(() => import("./pages/School_Admin/Events_&_Calendar/CalendarPage.jsx"));

const SettingsPage = lazy(() => import("./pages/School_Admin/Settings/SettingsPage.jsx"));
const SchoolAdminReport = lazy(() => import("./pages/School_Admin/Reports/schoolAdminReport.jsx"));
const SchoolSetup = lazy(()=>import("./pages/School_Admin/School_Setup/SchoolSetup.jsx"));

// Teacher
const QuestionBank = lazy(() => import("./pages/Teacher/Exams/QuestionBank.jsx"));
const TeacherExamsPage = lazy(() => import("./pages/Teacher/Exams/TeacherExamsPage.jsx"));
const TeacherEvaluationPage = lazy(() => import("./pages/Teacher/Exams/TeacherEvaluationPage.jsx"));
const AssignedClasses = lazy(() => import("./pages/Teacher/Classes/AssignedClasses.jsx"));
const ClassDetails = lazy(() => import("./pages/Teacher/Classes/ClassDetails.jsx"));
const Assignments = lazy(() => import("./pages/Teacher/Assignments/Assignments.jsx"));
const MyStudents = lazy(() => import("./pages/Teacher/My_Students/MyStudents.jsx"));
const StudentAttendance = lazy(() => import("./pages/Teacher/Attendance/StudentAttendance.jsx"));
const EmployeeDetailes = lazy(() => import("./pages/Teacher/Profile/EmployeeDetailes.jsx"));
const AdminUserProfile = lazy(() => import("./pages/School_Admin/User_Management/AdminUserProfile.jsx"));
const MonthlyAttendanceReport = lazy(() => import("./pages/Teacher/Attendance/MonthlyAttendanceReport.jsx"));
const MyAttendancePage = lazy(() => import("./pages/Attendance/MyAttendancePage.jsx"));
const TeacherReports = lazy(() => import("./pages/Teacher/Reports/TeacherReports.jsx"));
const TeacherLeave = lazy(() => import("./pages/Teacher/Leave/TeacherLeave.jsx"));
const SubjectResources = lazy(() => import("./pages/Teacher/StudyMaterials/SubjectResources.jsx"));
const LessonPlans = lazy(() => import("./pages/Teacher/LessonPlans/LessonPlans.jsx"));
const MyAttendanceMonthlyReport = lazy(() => import("./pages/Attendance/MyAttendanceMonthlyReport.jsx"));

// Student
const StudentHostel = lazy(() => import("./pages/Student/Hostel/StudentHostel.jsx"));
const StudentLeave = lazy(() => import("./pages/Student/Leave/StudentLeave.jsx"));
const StudyMaterials = lazy(() => import("./pages/Student/StudyMaterials/StudyMaterials.jsx"));
const AcademicCalendar = lazy(() => import("./pages/Student/Calendar/AcademicCalendar.jsx"));
const FeeStudent = lazy(() => import("./pages/Student/Fees/FeeStudent.jsx"));
const StudentHomework = lazy(() => import("./pages/Student/Homework/StudentHomework.jsx"));
const ExamLive = lazy(() => import("./pages/Student/Exams/ExamLive.jsx"));
const AttemptReview = lazy(() => import("./pages/Student/Exams/AttemptReview.jsx"));
const StudentExamsPage = lazy(() => import("./pages/Student/Exams/StudentExamsPage.jsx"));
const StudentAllowedBook = lazy(() => import("./pages/Student/Library/StudentAllowedBook.jsx"));
const StudentTimetable = lazy(() => import("./pages/Timetable/StudentTimetablePage.jsx"));
const StudentAttendancePage = lazy(() => import("./pages/Student/Attendance/MyAttendancePage.jsx"));
const StudentTransport = lazy(() => import("./pages/Student/Transport/StudentTransport.jsx"));
const StudentGrades = lazy(() => import("./pages/Student/Grades/StudentGrades.jsx"));

// Parent
const MyChildren      = lazy(() => import("./pages/Parent/Children/MyChildren.jsx"));
const ChildGrades     = lazy(() => import("./pages/Parent/Grades/ChildGrades.jsx"));
const ChildHomework   = lazy(() => import("./pages/Parent/Homework/ChildHomework.jsx"));
const ParentExamsPage = lazy(() => import("./pages/Parent/Exams/ParentExamsPage.jsx"));
const ParentFees      = lazy(() => import("./pages/Parent/Fee/ParentFees.jsx"));
const ChildTransport  = lazy(() => import("./pages/Parent/Transport/ChildTransport.jsx"));
const ChildHostel     = lazy(() => import("./pages/Parent/Hostel/ChildHostel.jsx"));
const ChildLibrary    = lazy(() => import("./pages/Parent/Library/ChildLibrary.jsx"));
const ChildLeave      = lazy(() => import("./pages/Parent/Leave/ChildLeave.jsx"));
const ChildProgress   = lazy(() => import("./pages/Parent/Progress/ChildProgress.jsx"));
// Accountant
const CollectFees = lazy(() => import("./pages/Accountant/Fees_Management/CollectFees.jsx"));
// Other
const UserRegister = lazy(() => import("./pages/UserRegister.jsx"));
const RoleWorkspace = lazy(() => import("./pages/RoleWorkspace.jsx"));
const RoleDynamicPortal = lazy(() => import("./pages/RoleDynamicPortal.jsx"));
const ITSupportDashboard = lazy(() =>
  import("./pages/IT_Support/ITSupportPages.jsx").then((module) => ({ default: module.ITSupportDashboard }))
);
const SystemMaintenance = lazy(() =>
  import("./pages/IT_Support/ITSupportPages.jsx").then((module) => ({ default: module.SystemMaintenance }))
);
const UserSupportTickets = lazy(() =>
  import("./pages/IT_Support/ITSupportPages.jsx").then((module) => ({ default: module.UserSupportTickets }))
);
const NetworkStatus = lazy(() =>
  import("./pages/IT_Support/ITSupportPages.jsx").then((module) => ({ default: module.NetworkStatus }))
);
const SystemLogs = lazy(() =>
  import("./pages/IT_Support/ITSupportPages.jsx").then((module) => ({ default: module.SystemLogs }))
);
const ModuleOverview = lazy(() => import("./pages/modules/ModuleOverview.jsx"));
const ModuleDetail = lazy(() => import("./pages/modules/ModuleDetail.jsx"));
const StyleGuide = lazy(() => import("./pages/StyleGuide.jsx"));

const ChangePassword = lazy(()=> import("./pages/Auth/ResetPasswordPage.jsx"));
const SecuritySettings = lazy(() => import("./pages/Security/SecuritySettings.jsx"));
const AttendanceDashboardPage = lazy(() => import("./pages/Attendance/AttendanceDashboard.jsx"));
const MarkAttendancePage = lazy(() => import("./pages/Attendance/MarkAttendancePage.jsx"));
const AttendanceTablePage = lazy(() => import("./pages/Attendance/AttendanceTablePage.jsx"));
const MonthlyReportPage = lazy(() => import("./pages/Attendance/MonthlyReportPage.jsx"));

const ChildAttendancePage = lazy(() => import("./pages/Attendance/ChildAttendancePage.jsx"));
const SupportTicketsPage = lazy(() => import("./pages/Support/SupportTicketsPage.jsx"));

// Vice Principal
const VicePrincipalReports = lazy(() => import("./pages/Vice_Principal/VicePrincipalReports.jsx"));

// Role-specific pages (Receptionist, Counselor, Security, Transport)
const VisitorManagement  = lazy(() => import("./pages/Receptionist/ReceptionistPages.jsx").then(m => ({ default: m.VisitorManagement })));
const Enquiries          = lazy(() => import("./pages/Receptionist/ReceptionistPages.jsx").then(m => ({ default: m.Enquiries })));
const CallLog            = lazy(() => import("./pages/Receptionist/ReceptionistPages.jsx").then(m => ({ default: m.CallLog })));
const Broadcasts         = lazy(() => import("./pages/Receptionist/ReceptionistPages.jsx").then(m => ({ default: m.Broadcasts })));

const CounselorStudents  = lazy(() => import("./pages/Counselor/CounselorPages.jsx").then(m => ({ default: m.CounselorStudents })));
const CounselingSessions = lazy(() => import("./pages/Counselor/CounselorPages.jsx").then(m => ({ default: m.CounselingSessions })));
const Appointments       = lazy(() => import("./pages/Counselor/CounselorPages.jsx").then(m => ({ default: m.Appointments })));
const CounselorReports   = lazy(() => import("./pages/Counselor/CounselorPages.jsx").then(m => ({ default: m.CounselorReports })));

const EntryRegister      = lazy(() => import("./pages/Security/SecurityPages.jsx").then(m => ({ default: m.EntryRegister })));
const GateLogs           = lazy(() => import("./pages/Security/SecurityPages.jsx").then(m => ({ default: m.GateLogs })));
const EmergencyAlerts    = lazy(() => import("./pages/Security/SecurityPages.jsx").then(m => ({ default: m.EmergencyAlerts })));

const DriversPage             = lazy(() => import("./pages/Transport/TransportPages.jsx").then(m => ({ default: m.DriversPage })));
const VehicleMaintenance      = lazy(() => import("./pages/Transport/TransportPages.jsx").then(m => ({ default: m.VehicleMaintenance })));
const TransportManagerDashboard = lazy(() => import("./pages/Transport/TransportPages.jsx").then(m => ({ default: m.TransportManagerDashboard })));
const ReceptionistDashboard   = lazy(() => import("./pages/Receptionist/ReceptionistPages.jsx").then(m => ({ default: m.ReceptionistDashboard })));
const CounselorDashboard      = lazy(() => import("./pages/Counselor/CounselorPages.jsx").then(m => ({ default: m.CounselorDashboard })));
const SecurityDashboard       = lazy(() => import("./pages/Security/SecurityPages.jsx").then(m => ({ default: m.SecurityDashboard })));
const ExamCoordinatorDashboard = lazy(() => import("./pages/Exam_Coordinator/ExamCoordinatorDashboard.jsx"));
const SubjectCoordinatorDashboard = lazy(() => import("./pages/Subject_Coordinator/SubjectCoordinatorDashboard.jsx"));

// Routes helpers (NO lazy)
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import RoleBasedRedirect from "./routes/RoleBasedRedirect.jsx";
import Register from "./components/forms/RegisterForm.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
      { path: "/login", element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
      { path: "/style-guide", element: <StyleGuide /> },
      { path: "/forgot-password", element: <PublicOnlyRoute><ForgetPasswordPage /></PublicOnlyRoute> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/resend-verification", element: <ResendVerificationPage /> },
      { path: "/no-active-year", element: <NoActiveYear /> },
      { path: "unauthorized", element: <Unauthorized /> },
      { path: "*", element: <NotFoundPage /> },
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
                  "Class Teacher",
                  "Sports Teacher",
                  "Lab Technician",
                  "Medical Officer",
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
                  "Class Teacher",
                  "Sports Teacher",
                  "Lab Technician",
                  "Medical Officer",
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
                  "Class Teacher",
                  "Sports Teacher",
                  "Lab Technician",
                  "Medical Officer",
                ]}
              >
                <SupportTicketsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "support/documentation",
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
                  "Sports Teacher",
                  "Lab Technician",
                  "Medical Officer",
                  "Class Teacher",
                ]}
              >
                <RoleDocumentation />
              </ProtectedRoute>
            ),
          },
          {
            path: "security-settings",
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
                <SecuritySettings />
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
              { path: "style-guide", element: <StyleGuide /> },
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
              { path: "class-teacher-assignments", element: <ClassTeacherAssignmentPage /> },
              { path: "subjects", element: <Subjects /> },
              { path: "attendance/students",  element: <AllStudentsAttendance /> },
              { path: "attendance/staff",     element: <StaffAttendance /> },
              { path: "attendance/teachers",  element: <SATeacherAttendance /> },
              { path: "attendance/leave",     element: <SALeaveManagement /> },
              { path: "attendance/reports",   element: <SAAttendanceReports /> },
              { path: "attendance/analytics", element: <SAAttendanceAnalytics /> },
              { path: "attendance/dashboard", element: <SAAttendanceDashboard /> },
              { path: "attendance/mark",      element: <MarkAttendancePage /> },
              { path: "attendance/table",     element: <AttendanceTablePage /> },
              { path: "attendance/monthly",   element: <MonthlyReportPage /> },
              { path: "attendance/geofence",  element: <GeofenceSettings /> },
              { path: "attendance/live",      element: <GeofenceSettings /> },
              { path: "library/books", element: <Books /> },
              { path: "library/issue", element: <IssueBook /> },
              { path: "library/card", element: <LibraryCard /> },
              { path: "timetable", element: <SchoolAdminTimetablePage /> },
              { path: "timetable/time-slots", element: <TimeSlotManager /> },
              { path: "timetable/rooms", element: <RoomManager /> },
              { path: "timetable/class", element: <ClassTimetable /> },
              { path: "timetable/teacher", element: <TeacherTimetable /> },
              { path: "fees/categories", element: <SchoolFeeCategories /> },
              { path: "fees/collect", element: <FeeCollection /> },
              { path: "admission/inquiry", element: <AdmissionInquiryPage /> },
              { path: "hostel", element: <HostelManagement /> },
              { path: "transport/routes", element: <RoutesPage /> },
              { path: "transport/vehicles", element: <Vehicles /> },
              { path: "transport/assignments", element: <TransportAssignments /> },
              { path: "payroll/monthly-run", element: <EmployeeSalaries /> },
              { path: "payroll/salary-structures", element: <SalaryStructures /> },
              { path: "payroll/create-employee", element: <CreateEmployee/> },
              { path: "payroll/payslips", element: <GeneratePayslip /> },
              { path: "payroll/reports/monthly", element: <MonthlyPayrollReport /> },
              { path: "payroll/advance", element: <SalaryAdvance /> },
              { path: "payroll/bonus", element: <BonusIncentivePage /> },
              { path: "payroll/reimbursements", element: <ReimbursementsPage /> },
              { path: "communication", element: <CommunicationHub /> },
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
              { path: "students/roll-numbers", element: <RollNumberManagement /> },
              { path: "students/certificates", element: <CertificatesPage /> },
              { path: "students/id-cards", element: <IDCardsPage /> },
              { path: "health-records", element: <HealthRecordsPage /> },
              { path: "students/discipline", element: <DisciplinePage /> },
              { path: "students/alumni", element: <AlumniPage /> },
              { path: "students/canteen", element: <CanteenPage /> },
              { path: "students/ptm", element: <PTMSessionsPage /> },
              { path: "students/sports", element: <SportsPage /> },
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
            
              { path: "users/employee-details", element: <AdminUserProfile /> },
              { path: "users/employee-form",    element: <AdminUserProfile /> },
              // Legacy alias
              { path: "users/employee-detailes", element: <AdminUserProfile /> },
              { path: "calendar", element: <CalendarPage /> },
              { path: "events", element: <Events /> },
              { path: "inventory/supplies", element: <Supplies /> },
              { path: "inventory/assets", element: <Assets /> },
              { path: "inventory", element: <InventoryStore /> },
              { path: "fees/feestructure", element: <FeeStructure /> },
              { path: "fees/assign", element: <StudentAssignFees /> },
              { path: "school-setup", element: <SchoolSetup /> },
              { path: "tasks", element: <TaskManagement /> },

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
              { path: "my-class", element: <MyClassPage /> },
              { path: "classes", element: <AssignedClasses /> },
              { path: "classes/:classId", element: <ClassDetails /> },
              { path: "students", element: <MyStudents /> },
              { path: "assignments", element: <Assignments /> },
              { path: "attendance/students", element: <StudentAttendance /> },
              { path: "attendance", element: <MonthlyAttendanceReport /> },
              { path: "attendance/my", element: <MyAttendancePage /> },
              { path: "attendance/my/monthly", element: <MyAttendanceMonthlyReport /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
             // { path: "exams", element: <ScheduleExams /> },
              { path: "exams/create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/list", element: <TeacherExamsPage /> },
              { path: "exams/evaluation", element: <TeacherEvaluationPage /> },
              { path: "timetable", element: <TeacherTimetablePage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "payroll", element: <PayrollSelfServicePage /> },
               { path: "attendance", element: <MyAttendancePage /> },
              { path: "attendance/table", element: <AttendanceTablePage /> },
              { path: "attendance/monthly", element: <MonthlyReportPage /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "profile/change-password", element: <ChangePassword /> },
              { path: "reports", element: <TeacherReports /> },
              { path: "leave", element: <TeacherLeave /> },
              { path: "resources", element: <SubjectResources /> },
              { path: "lesson-plans", element: <LessonPlans /> },
              { path: "tasks", element: <MyTasks /> },
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
              { path: "attendance", element: <StudentAttendancePage /> },
              { path: "grades", element: <StudentGrades /> },
              { path: "timetable", element: <StudentTimetablePage /> },
              { path: "library", element: <StudentAllowedBook /> },
              { path: "hostel", element: <StudentHostel /> },
              { path: "transport", element: <StudentTransport /> },
              { path: "leave", element: <StudentLeave /> },
              { path: "study-materials", element: <StudyMaterials /> },
              { path: "calendar", element: <AcademicCalendar /> },
              { path: "fees", element: <FeeStudent /> },
              { path: "exams/attempt-review", element: <AttemptReview /> },
              { path: "exams/exam-live", element: <ExamLive /> },
              { path: "exams", element: <StudentExamsPage /> },
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
              { path: "children",   element: <MyChildren /> },
              { path: "ptm",        element: <PTMBooking /> },
              { path: "attendance", element: <ChildAttendancePage /> },
              { path: "grades",     element: <ChildGrades /> },
              { path: "homework",   element: <ChildHomework /> },
              { path: "fees",       element: <ParentFees /> },
              { path: "exams",      element: <ParentExamsPage /> },
              { path: "timetable",  element: <ParentChildTimetablePage /> },
              { path: "transport",  element: <ChildTransport /> },
              { path: "hostel",     element: <ChildHostel /> },
              { path: "library",    element: <ChildLibrary /> },
              { path: "leave",      element: <ChildLeave /> },
              { path: "calendar",   element: <AcademicCalendar /> },
              { path: "progress",   element: <ChildProgress /> },
              { path: "message",    element: <Message /> },
              { path: "profile",    element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "reports",    element: <ExamReports /> },
              { path: "communication/send",    element: <SendNotification /> },
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
              { path: "salary", element: <EmployeeSalaries /> },
              { path: "salary/structures", element: <SalaryStructures /> },
              { path: "salary/create-employee", element: <CreateEmployee /> },
              { path: "salary/payslips", element: <GeneratePayslip /> },
              { path: "salary/reports/monthly", element: <MonthlyPayrollReport /> },
              { path: "salary/advance", element: <SalaryAdvance /> },
              { path: "salary/bonus", element: <BonusIncentivePage /> },
              { path: "salary/reimbursements", element: <ReimbursementsPage /> },
              { path: "income",           element: <IncomeManagement /> },
              { path: "expenses",         element: <ExpenseManagement /> },
              { path: "reports",          element: <FinancialReports /> },
              { path: "fees/reports",     element: <FeeReports /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "payroll", element: <PayrollSelfServicePage /> },
              { path: "attendance",          element: <MyAttendancePage /> },
              { path: "attendance/self",     element: <EmployeeSelfAttendance /> },
              { path: "attendance/table",    element: <AttendanceTablePage /> },
              { path: "attendance/monthly",  element: <MonthlyReportPage /> },
              { path: "leave",              element: <TeacherLeave /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "tasks",              element: <MyTasks /> },
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
              { path: "library",         element: <LibraryCard /> },
              { path: "transport",       element: <RoutesPage /> },
              { path: "timetable",       element: <PrincipalTimetableOverview /> },
              { path: "message",         element: <Message /> },
              { path: "profile",         element: <Profile /> },
              { path: "notification",    element: <Notification /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "tasks",           element: <MyTasks /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",   element: <MyAttendancePage /> },
              { path: "leave",           element: <TeacherLeave /> },
            ],
          },
          {
            path: "viceprincipal",
            element: (
              <ProtectedRoute allowedRoles={["Vice Principal"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                      element: <SchoolAdminDashboard /> },
              { path: "discipline",               element: <DisciplinePage /> },
              { path: "ptm",                       element: <PTMSessionsPage /> },
              { path: "reports",                  element: <VicePrincipalReports /> },
              { path: "academics",                element: <ExamsPage /> },
              { path: "tasks",                    element: <MyTasks /> },
              { path: "payroll",                  element: <PayrollSelfServicePage /> },
              { path: "timetable",                element: <PrincipalTimetableOverview /> },
              { path: "exams",                    element: <ExamsPage /> },
              { path: "exams/create",             element: <ExamCreate /> },
              { path: "exams/edit/:id",           element: <ExamCreate /> },
              { path: "exams/schedule",           element: <ExamSchedule /> },
              { path: "exams/grades",             element: <EnterGrades /> },
              { path: "exams/paper-builder",      element: <PaperBuilder /> },
              { path: "exams/admit-card",         element: <AdmitCardPage /> },
              { path: "exams/seat-plan",          element: <SeatPlanPage /> },
              { path: "exams/analytics",          element: <ExamAnalyticsPage /> },
              { path: "attendance/students",  element: <AllStudentsAttendance /> },
              { path: "attendance/staff",     element: <StaffAttendance /> },
              { path: "attendance/table",     element: <AttendanceTablePage /> },
              { path: "attendance/self",      element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",        element: <MyAttendancePage /> },
              { path: "leave",               element: <TeacherLeave /> },
              { path: "profile",             element: <Profile /> },
              { path: "message",             element: <Message /> },
              { path: "notification",        element: <Notification /> },
              { path: "*",                   element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "subjectcoordinator",
            element: (
              <ProtectedRoute allowedRoles={["Subject Coordinator"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,             element: <SubjectCoordinatorDashboard /> },
              { path: "subjects",        element: <Subjects /> },
              { path: "teachers",        element: <TeacherList /> },
              { path: "classes",         element: <Classes /> },
              { path: "assessments",     element: <ExamsPage /> },
              { path: "exams/create",    element: <ExamCreate /> },
              { path: "exams/edit/:id",  element: <ExamCreate /> },
              { path: "reports",         element: <ExamReports /> },
              { path: "tasks",           element: <MyTasks /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",   element: <MyAttendancePage /> },
              { path: "leave",           element: <TeacherLeave /> },
              { path: "profile",         element: <Profile /> },
              { path: "message",         element: <Message /> },
              { path: "notification",    element: <Notification /> },
              { path: "*",               element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "librarian",
            element: (
              <ProtectedRoute allowedRoles={["Librarian"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,              element: <LibraryDashboard /> },
              { path: "book-catalog",     element: <Books /> },
              { path: "issue-return",     element: <IssueBook /> },
              { path: "members",          element: <LibraryMembers /> },
              { path: "reports",          element: <LibraryReports /> },
              { path: "fines",            element: <FineManagement /> },
              { path: "settings",         element: <LibrarySettings /> },
              { path: "payroll",          element: <PayrollSelfServicePage /> },
              { path: "attendance/self",  element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",    element: <MyAttendancePage /> },
              { path: "leave",            element: <TeacherLeave /> },
              { path: "profile",          element: <Profile /> },
              { path: "message",          element: <Message /> },
              { path: "notification",     element: <Notification /> },
              { path: "tasks",            element: <MyTasks /> },
              { path: "workspace",        element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "hostelwarden",
            element: (
              <ProtectedRoute allowedRoles={["Hostel Warden"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                    element: <HostelDashboard /> },
              { path: "rooms",                  element: <HostelManagement /> },
              { path: "allocations",            element: <HostelAllocations /> },
              { path: "leaves",                 element: <LeaveManagement /> },
              { path: "visitors",               element: <VisitorLog /> },
              { path: "complaints",             element: <ComplaintManagement /> },
              { path: "hostel-attendance",  element: <HostelAttendance /> },
              { path: "hostel-reports",     element: <HostelReports /> },
              { path: "payroll",            element: <PayrollSelfServicePage /> },
              { path: "attendance/self",    element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",      element: <MyAttendancePage /> },
              { path: "leave",              element: <TeacherLeave /> },
              { path: "profile",            element: <Profile /> },
              { path: "message",            element: <Message /> },
              { path: "notification",       element: <Notification /> },
              { path: "tasks",              element: <MyTasks /> },
            ],
          },
          {
            path: "transportmanager",
            element: (
              <ProtectedRoute allowedRoles={["Transport Manager"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,             element: <TransportManagerDashboard /> },
              { path: "routes",          element: <RoutesPage /> },
              { path: "vehicles",        element: <Vehicles /> },
              { path: "drivers",         element: <DriversPage /> },
              { path: "assignments",     element: <TransportAssignments /> },
              { path: "maintenance",     element: <VehicleMaintenance /> },
              { path: "tasks",           element: <MyTasks /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",   element: <MyAttendancePage /> },
              { path: "leave",           element: <TeacherLeave /> },
              { path: "profile",         element: <Profile /> },
              { path: "message",         element: <Message /> },
              { path: "notification",    element: <Notification /> },
              { path: "*",               element: <RoleDynamicPortal /> },
            ],
          },
           {
            path: "examcoordinator",
            element: (
              <ProtectedRoute allowedRoles={["Exam Coordinator"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <ExamCoordinatorDashboard /> },
              { path: "exams", element: <ExamsPage /> },
              { path: "exams/list", element: <ExamsPage /> },
              { path: "exams/create", element: <ExamCreate /> },
              { path: "exams/edit/:id", element: <ExamCreate /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
              { path: "exams/paper-builder", element: <PaperBuilder /> },
              { path: "exams/admit-card", element: <AdmitCardPage /> },
              { path: "exams/seat-plan", element: <SeatPlanPage /> },
              { path: "exams/analytics", element: <ExamAnalyticsPage /> },
              { path: "reports",          element: <ExamReports /> },
              { path: "payroll",          element: <PayrollSelfServicePage /> },
              { path: "attendance/self",  element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",    element: <MyAttendancePage /> },
              { path: "leave",            element: <TeacherLeave /> },
              { path: "profile",          element: <Profile /> },
              { path: "message",          element: <Message /> },
              { path: "notification",     element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "tasks",            element: <MyTasks /> },
            ],
          },
          {
            path: "receptionist",
            element: (
              <ProtectedRoute allowedRoles={["Receptionist"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,          element: <ReceptionistDashboard /> },
              { path: "visitors",     element: <VisitorManagement /> },
              { path: "enquiries",    element: <Enquiries /> },
              { path: "calls",        element: <CallLog /> },
              { path: "broadcasts",      element: <Broadcasts /> },
              { path: "tasks",           element: <MyTasks /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",   element: <MyAttendancePage /> },
              { path: "leave",           element: <TeacherLeave /> },
              { path: "profile",         element: <Profile /> },
              { path: "message",         element: <Message /> },
              { path: "notification",    element: <Notification /> },
              { path: "*",              element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "itsupport",
            element: (
              <ProtectedRoute allowedRoles={["IT Support"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <ITSupportDashboard /> },
              { path: "maintenance", element: <SystemMaintenance /> },
              { path: "tickets", element: <SupportTicketsPage /> },
              { path: "network", element: <NetworkStatus /> },
              { path: "logs",             element: <SystemLogs /> },
              { path: "payroll",          element: <PayrollSelfServicePage /> },
              { path: "attendance/self",  element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",    element: <MyAttendancePage /> },
              { path: "leave",            element: <TeacherLeave /> },
              { path: "profile",          element: <Profile /> },
              { path: "message",          element: <Message /> },
              { path: "notification",     element: <Notification /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
              { path: "tasks",            element: <MyTasks /> },
            ],
          },
          {
            path: "counselor",
            element: (
              <ProtectedRoute allowedRoles={["Counselor"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,            element: <CounselorDashboard /> },
              { path: "students",       element: <CounselorStudents /> },
              { path: "sessions",       element: <CounselingSessions /> },
              { path: "appointments",   element: <Appointments /> },
              { path: "reports",        element: <CounselorReports /> },
              { path: "tasks",           element: <MyTasks /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",   element: <MyAttendancePage /> },
              { path: "leave",           element: <TeacherLeave /> },
              { path: "profile",         element: <Profile /> },
              { path: "message",         element: <Message /> },
              { path: "notification",    element: <Notification /> },
              { path: "*",              element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "security",
            element: (
              <ProtectedRoute allowedRoles={["Security"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,               element: <SecurityDashboard /> },
              { path: "entry-register",    element: <EntryRegister /> },
              { path: "gate-logs",         element: <GateLogs /> },
              { path: "shift-attendance",  element: <MyAttendancePage /> },
              { path: "alerts",            element: <EmergencyAlerts /> },
              { path: "tasks",             element: <MyTasks /> },
              { path: "payroll",           element: <PayrollSelfServicePage /> },
              { path: "attendance/self",   element: <EmployeeSelfAttendance /> },
              { path: "leave",             element: <TeacherLeave /> },
              { path: "profile",           element: <Profile /> },
              { path: "message",           element: <Message /> },
              { path: "notification",      element: <Notification /> },
              { path: "*",                 element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "sportsteacher",
            element: (
              <ProtectedRoute allowedRoles={["Sports Teacher"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                        element: <TeacherDashboard /> },
              { path: "sports",                     element: <SportsPage /> },
              { path: "classes",                    element: <AssignedClasses /> },
              { path: "classes/:classId",           element: <ClassDetails /> },
              { path: "students",                   element: <MyStudents /> },
              { path: "assignments",                element: <Assignments /> },
              { path: "attendance/students",        element: <StudentAttendance /> },
              { path: "attendance/self",            element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",              element: <MyAttendancePage /> },
              { path: "leave",                      element: <TeacherLeave /> },
              { path: "payroll",                    element: <PayrollSelfServicePage /> },
              { path: "tasks",                      element: <MyTasks /> },
              { path: "message",                    element: <Message /> },
              { path: "notification",               element: <Notification /> },
              { path: "communication/send",         element: <SendNotification /> },
              { path: "communication/history",      element: <SmsEmailHistory /> },
              { path: "profile",                    element: <Profile /> },
              { path: "profile/change-password",    element: <ChangePassword /> },
            ],
          },
          {
            path: "labtechnician",
            element: (
              <ProtectedRoute allowedRoles={["Lab Technician"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                        element: <TeacherDashboard /> },
              { path: "students",                   element: <MyStudents /> },
              { path: "timetable",                  element: <TeacherTimetablePage /> },
              { path: "attendance/self",            element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",              element: <MyAttendancePage /> },
              { path: "leave",                      element: <TeacherLeave /> },
              { path: "payroll",                    element: <PayrollSelfServicePage /> },
              { path: "tasks",                      element: <MyTasks /> },
              { path: "message",                    element: <Message /> },
              { path: "notification",               element: <Notification /> },
              { path: "communication/send",         element: <SendNotification /> },
              { path: "communication/history",      element: <SmsEmailHistory /> },
              { path: "profile",                    element: <Profile /> },
              { path: "profile/change-password",    element: <ChangePassword /> },
            ],
          },
          {
            path: "medicalofficer",
            element: (
              <ProtectedRoute allowedRoles={["Medical Officer"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                        element: <TeacherDashboard /> },
              { path: "students",                   element: <MyStudents /> },
              { path: "health-records",              element: <HealthRecordsPage /> },
              { path: "attendance/self",            element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",              element: <MyAttendancePage /> },
              { path: "leave",                      element: <TeacherLeave /> },
              { path: "payroll",                    element: <PayrollSelfServicePage /> },
              { path: "tasks",                      element: <MyTasks /> },
              { path: "message",                    element: <Message /> },
              { path: "notification",               element: <Notification /> },
              { path: "communication/send",         element: <SendNotification /> },
              { path: "communication/history",      element: <SmsEmailHistory /> },
              { path: "profile",                    element: <Profile /> },
              { path: "profile/change-password",    element: <ChangePassword /> },
            ],
          },
          {
            path: "classteacher",
            element: (
              <ProtectedRoute allowedRoles={["Class Teacher"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,                        element: <TeacherDashboard /> },
              { path: "my-class",                   element: <MyClassPage /> },
              { path: "classes",                    element: <AssignedClasses /> },
              { path: "classes/:classId",           element: <ClassDetails /> },
              { path: "students",                   element: <MyStudents /> },
              { path: "discipline",                 element: <DisciplinePage /> },
              { path: "ptm",                         element: <PTMSessionsPage /> },
              { path: "assignments",                element: <Assignments /> },
              { path: "attendance/students",        element: <StudentAttendance /> },
              { path: "timetable",                  element: <TeacherTimetablePage /> },
              { path: "attendance/self",            element: <EmployeeSelfAttendance /> },
              { path: "attendance/my",              element: <MyAttendancePage /> },
              { path: "leave",                      element: <TeacherLeave /> },
              { path: "payroll",                    element: <PayrollSelfServicePage /> },
              { path: "tasks",                      element: <MyTasks /> },
              { path: "message",                    element: <Message /> },
              { path: "notification",               element: <Notification /> },
              { path: "communication/send",         element: <SendNotification /> },
              { path: "communication/history",      element: <SmsEmailHistory /> },
              { path: "profile",                    element: <Profile /> },
              { path: "profile/change-password",    element: <ChangePassword /> },
            ],
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
                  "Class Teacher",
                  "Sports Teacher",
                  "Lab Technician",
                  "Medical Officer",
                ]}
              >
                <RoleWorkspace />
              </ProtectedRoute>
            ),
          },
          {
            path: "classteacher",
            element: (
              <ProtectedRoute allowedRoles={["Class Teacher"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,          element: <RoleWorkspace /> },
              { path: "tasks",        element: <MyTasks /> },
              { path: "payroll",      element: <PayrollSelfServicePage /> },
              { path: "profile",      element: <Profile /> },
              { path: "message",      element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "*",            element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "sportsteacher",
            element: (
              <ProtectedRoute allowedRoles={["Sports Teacher"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,          element: <RoleWorkspace /> },
              { path: "tasks",        element: <MyTasks /> },
              { path: "payroll",      element: <PayrollSelfServicePage /> },
              { path: "profile",      element: <Profile /> },
              { path: "message",      element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "*",            element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "labtechnician",
            element: (
              <ProtectedRoute allowedRoles={["Lab Technician"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,          element: <RoleWorkspace /> },
              { path: "tasks",        element: <MyTasks /> },
              { path: "payroll",      element: <PayrollSelfServicePage /> },
              { path: "profile",      element: <Profile /> },
              { path: "message",      element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "*",            element: <RoleDynamicPortal /> },
            ],
          },
          {
            path: "medicalofficer",
            element: (
              <ProtectedRoute allowedRoles={["Medical Officer"]}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              { index: true,          element: <RoleWorkspace /> },
              { path: "tasks",        element: <MyTasks /> },
              { path: "payroll",      element: <PayrollSelfServicePage /> },
              { path: "profile",      element: <Profile /> },
              { path: "message",      element: <Message /> },
              { path: "notification", element: <Notification /> },
              { path: "*",            element: <RoleDynamicPortal /> },
            ],
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
              { path: "tasks",           element: <MyTasks /> },
              { path: "attendance",      element: <MyAttendancePage /> },
              { path: "attendance/self", element: <EmployeeSelfAttendance /> },
              { path: "leave",           element: <TeacherLeave /> },
              { path: "payroll",         element: <PayrollSelfServicePage /> },
              { path: "message",         element: <Message /> },
              { path: "profile",         element: <Profile /> },
              { path: "notification",    element: <Notification /> },
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
    <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={<Loader />} persistor={persistor}>
        <ThemeProvider>
          <ThemedAntWrapper>
            <Suspense fallback={<Loader />}>
              <RouterProvider router={router} />
            </Suspense>
          </ThemedAntWrapper>
        </ThemeProvider>
      </PersistGate>
    </Provider>
    </ErrorBoundary>
  );
};

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(renderApp);
}

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('Service worker registration failed:', error));
    });
  } else {
    // Dev mode: the SW's cache-first strategy for .js/.css caches Vite's
    // unbundled ESM modules, so edits never reach the browser. Unregister
    // and clear any leftover SW/caches from a previous production build.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }
}
