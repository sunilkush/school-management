import { PrimeReactProvider } from 'primereact/api';
import Tailwind from 'primereact/passthrough/tailwind';
import { twMerge } from 'tailwind-merge';
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import "antd/dist/reset.css";
import App from "./App.jsx";
import store from "./store/store.js";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import Dashboard from "./components/layout/MainDashboard.jsx";
import Reports from "./pages/SuperAdmin/Reports/Reports.jsx";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard/SuperAdminDashboard.jsx";
import SchoolAdminDashboard from "./pages/SchoolAdmin/Dashboard/SchoolAdminDashboard.jsx";
import StudentDashboard from "./pages/Student/Dashboard/StudentDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Notification from "./pages/Notification.jsx";
import Message from "./pages/Message.jsx";
import Settings from "./pages/Settings.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import TeacherDashboard from "./pages/Teacher/Dashboard/TeacherDashboard.jsx";
import AccountantDashboard from "./pages/Accountant/Dashboard/AccountantDashboard.jsx";
import StaffDashboard from "./pages/Staff/Dashboard/StaffDashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Schedule from "./pages/Schedule.jsx";
import UserRegister from "./pages/UserRegister.jsx";
import Schools from "./pages/SuperAdmin/Schools/Schools.jsx";
import AddSchool from "./pages/SuperAdmin/Schools/AddSchool.jsx";
import Admins from "./pages/SuperAdmin/Admins/Admins.jsx";
import Roles from "./pages/SuperAdmin/Roles_&_Permissions/Roles.jsx";
import Permissions from "./pages/SuperAdmin/Roles_&_Permissions/Permissions.jsx";
import AcademicYears from "./pages/SuperAdmin/Modules/AcademicYears.jsx";
import Modules from "./pages/SuperAdmin/Modules/Modules.jsx";
import SettingsPage from "./pages/Settings.jsx";
import UsersPage from "./pages/SchoolAdmin/Teachers_&_Students/UsersList.jsx";
import AddStudent from "./pages/SchoolAdmin/Teachers_&_Students/AddStudent.jsx";
import AddTeacher from "./pages/SchoolAdmin/Teachers_&_Students/AddTeacher.jsx";
import AddParent from "./pages/SchoolAdmin/Teachers_&_Students/AddParent.jsx";
import Classes from "./pages/SchoolAdmin/Classes_&_Subjects/Classes.jsx";
import Subjects from "./pages/SchoolAdmin/Classes_&_Subjects/Subjects.jsx";
import ScheduleExams from "./pages/SchoolAdmin/Exams_&_Grades/ExamSchedule.jsx";
import EnterGrades from "./pages/SchoolAdmin/Exams_&_Grades/EnterGrades.jsx";
import StudentAttendance from "./pages/SchoolAdmin/Attendance/StudentAttendance.jsx";
import StaffAttendance from "./pages/SchoolAdmin/Attendance/StaffAttendance.jsx";
import Books from "./pages/SchoolAdmin/Library/Books.jsx";
import IssueBook from "./pages/SchoolAdmin/Library/IssueBook.jsx";
import ClassTimetable from "./pages/SchoolAdmin/Timetables/ClassTimetable.jsx";
import TeacherTimetable from "./pages/SchoolAdmin/Timetables/TeacherTimetable.jsx";
import FeeCategories from "./pages/SchoolAdmin/Fees_Management/FeeCategories.jsx";
import CollectFees from "./pages/SchoolAdmin/Fees_Management/CollectFees.jsx";
import HostelManagement from "./pages/SchoolAdmin/Hostel/HostelManagement.jsx";
import RoomAllocation from "./pages/SchoolAdmin/Hostel/RoomAllocation.jsx";
import RoutesPage from "./pages/SchoolAdmin/Transport/RoutesPage.jsx";
import Vehicles from "./pages/SchoolAdmin/Transport/Vehicles.jsx";
import EmployeeSalaries from "./pages/SchoolAdmin/Payroll/EmployeeSalaries.jsx";
import GeneratePayslip from "./pages/SchoolAdmin/Payroll/GeneratePayslip.jsx";
import SendNotification from "./pages/SchoolAdmin/Communication/SendNotification.jsx";
import SmsEmailHistory from "./pages/SchoolAdmin/Communication/SmsEmailHistory.jsx";
import RoleBasedRedirect from "./routes/RoleBasedRedirect.jsx";
import SchoolAdminReport from "./pages/SchoolAdmin/Reports/schoolAdminReport.jsx";
import StudentList from "./pages/SchoolAdmin/Teachers_&_Students/StudentList.jsx"
import NoActiveYear from "./pages/no-active-year.jsx";
import ExamReports from './pages/SchoolAdmin/Exams_&_Grades/ExamReport.jsx';
import QuestionBank from './pages/SchoolAdmin/Exams_&_Grades/QuestionBank.jsx';
import CreateExam from './pages/SchoolAdmin/Exams_&_Grades/CreateExam.jsx';
import ExamLive from './pages/Student/Exams/ExamLive.jsx';
import AttemptReview from './pages/Student/Exams/AttemptReview.jsx';
import ClassSectionFrom from './pages/SuperAdmin/Classes_&_Section/ClassSectionFrom.jsx';
import ClassSectionList from './pages/SuperAdmin/Classes_&_Section/ClassSectionList.jsx';
import EmployeeForm from './components/forms/EmployeeForm.jsx';
import EmployeeDetailes from './pages/Teacher/Profile/EmployeeDetailes.jsx';
import FeeStudent from './pages/Student/Fees/FeeStudent.jsx';
import Calendar from './pages/SchoolAdmin/Events_&_Calendar/calendar.jsx';
import Supplies from './pages/SchoolAdmin/Inventory/supplies.jsx';
import Events from './pages/SchoolAdmin/Events_&_Calendar/events.jsx';
import Assets from './pages/SchoolAdmin/Inventory/assets.jsx';
import ExamSchedule from './pages/SchoolAdmin/Exams_&_Grades/ExamSchedule.jsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/no-active-year", element: <NoActiveYear /> },
      { path: "unauthorized", element: <Unauthorized /> },
      { path: "*", element: <Unauthorized /> },
      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          { index: true, element: <RoleBasedRedirect /> },
          {
            path: "superadmin",
            element: (
              <ProtectedRoute allowedRoles={["Super Admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SuperAdminDashboard /> },
              { path: "schools", element: <Schools /> },
              { path: "schools/add", element: <AddSchool /> },
              { path: "admins", element: <Admins /> },
              { path: "user-create", element: <UserRegister /> },
              { path: "roles", element: <Roles /> },
              { path: "permissions", element: <Permissions /> },
              { path: "modules", element: <Modules /> },
              { path: "modules/academicyears", element: <AcademicYears /> },
              { path: "reports", element: <Reports /> },
              { path: "settings", element: <Settings /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "classes-sections/form", element: <ClassSectionFrom /> },
              { path: "classes-sections/list", element: <ClassSectionList /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
          {
            path: "schooladmin",
            element: (
              <ProtectedRoute allowedRoles={["School Admin"]}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <SchoolAdminDashboard /> },
              { path: "users/student/add", element: <AddStudent /> },
              { path: "users/teacher/add", element: <AddTeacher /> },
              { path: "users/parent/add", element: <AddParent /> },
              { path: "users", element: <UsersPage /> },
              { path: "user-create", element: <UserRegister /> },
              { path: "classes", element: <Classes /> },
              { path: "subjects", element: <Subjects /> },
              { path: "exams/schedule", element: <ExamSchedule /> },
              { path: "exams/grades", element: <EnterGrades /> },
              { path: "attendance/students", element: <StudentAttendance /> },
              { path: "attendance/staff", element: <StaffAttendance /> },
              { path: "library/books", element: <Books /> },
              { path: "library/issue", element: <IssueBook /> },
              { path: "timetable/class", element: <ClassTimetable /> },
              { path: "timetable/teacher", element: <TeacherTimetable /> },
              { path: "fees/categories", element: <FeeCategories /> },
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
              { path: "admission", element: <AddStudent /> },
              { path: "studentList", element: <StudentList /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/create-exam", element: <CreateExam /> },
              { path: "users/employee-from", element: <EmployeeForm /> },
              { path: "users/employee-detailes", element: <EmployeeDetailes /> },
              { path: "calendar", element: <Calendar /> },
              { path: "events", element: <Events /> },
              { path: "inventory/supplies", element: <Supplies /> },
              { path: "inventory/assets", element: <Assets /> },

            ],
          },
          {
            path: "teacher",
            element: (
              <ProtectedRoute allowedRoles={["Teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <TeacherDashboard /> },
              { path: "classes", element: <Classes /> },
              { path: "students", element: <StudentList /> },
              { path: "assignments", element: <Schedule /> },
              { path: "attendance", element: <StudentAttendance /> },
              { path: "exams", element: <ScheduleExams /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "exams/question-bank", element: <QuestionBank /> },
              { path: "exams/create-exam", element: <CreateExam /> },
              { path: "timetable", element: <ClassTimetable /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "reports", element: <SchoolAdminReport /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },

            ],
          },
          {
            path: "student",
            element: (
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <StudentDashboard /> },
              { path: "profile", element: <Profile /> },
              { path: "homework", element: <Schedule /> },
              { path: "attendance", element: <StudentAttendance /> },
              { path: "grades", element: <EnterGrades /> },
              { path: "timetable", element: <ClassTimetable /> },
              { path: "library", element: <Books /> },
              { path: "hostel", element: <HostelManagement /> },
              { path: "transport", element: <RoutesPage /> },
              { path: "fees", element: <FeeStudent /> },
              { path: "exams/attempt-review", element: <AttemptReview /> },
              { path: "exams/exam-live", element: <ExamLive /> },
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
                <Profile />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <Profile /> },
              { path: "children", element: <UsersPage /> },
              { path: "attendance", element: <StudentAttendance /> },
              { path: "grades", element: <EnterGrades /> },
              { path: "homework", element: <Schedule /> },
              { path: "fees", element: <FeeCategories /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "exams/reports", element: <ExamReports /> },
              { path: "communication/send", element: <SendNotification /> },
              { path: "communication/history", element: <SmsEmailHistory /> },
            ],
          },
          {
            path: "accountant",
            element: (
              <ProtectedRoute allowedRoles={["Accountant"]}>
                <AccountantDashboard />
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
            path: "staff",
            element: (
              <ProtectedRoute allowedRoles={["Staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <StaffDashboard /> },
              { path: "tasks", element: <Schedule /> },
              { path: "attendance", element: <StudentAttendance /> },
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


createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PrimeReactProvider
      value={{
        unstyled: true, // ✅ Must be true to apply Tailwind styles
        pt: Tailwind,    // ✅ Add Tailwind preset
        ptOptions: {
          mergeSections: true,
          mergeProps: true,
          classNameMergeFunction: twMerge,
        },
      }}
    >
      <RouterProvider router={router} />
    </PrimeReactProvider>
  </Provider>
);
