import { PrimeReactProvider } from 'primereact/api';
import Tailwind from 'primereact/passthrough/tailwind';
import { twMerge } from 'tailwind-merge';
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import store from "./store/store.js";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./components/layout/Dashboard.jsx";
import Reports from "./pages/Reports.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Notification from "./pages/Notification.jsx";
import Message from "./pages/Message.jsx";
import Settings from "./pages/Settings.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import AccountantDashboard from "./pages/AccountantDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Schedule from "./pages/Schedule.jsx";
import UserRegister from "./pages/UserRegister.jsx";
import Schools from "./pages/Schools.jsx";
import AddSchool from "./pages/AddSchool.jsx";
import Admins from "./pages/Admins.jsx";
import Roles from "./pages/Roles.jsx";
import Permissions from "./pages/Permissions.jsx";
import AcademicYears from "./pages/AcademicYears.jsx";
import Modules from "./pages/Modules.jsx";
import SettingsPage from "./pages/Settings.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import AddStudent from "./pages/AddStudent.jsx";
import AddTeacher from "./pages/AddTeacher.jsx";
import AddParent from "./pages/AddParent.jsx";
import Classes from "./pages/Classes.jsx";
import Subjects from "./pages/Subjects.jsx";
import ScheduleExams from "./pages/ScheduleExams.jsx";
import EnterGrades from "./pages/EnterGrades.jsx";
import StudentAttendance from "./pages/StudentAttendance.jsx";
import StaffAttendance from "./pages/StaffAttendance.jsx";
import Books from "./pages/Books.jsx";
import IssueBook from "./pages/IssueBook.jsx";
import ClassTimetable from "./pages/ClassTimetable.jsx";
import TeacherTimetable from "./pages/TeacherTimetable.jsx";
import FeeCategories from "./pages/FeeCategories.jsx";
import CollectFees from "./pages/CollectFees.jsx";
import HostelManagement from "./pages/HostelManagement.jsx";
import RoomAllocation from "./pages/RoomAllocation.jsx";
import RoutesPage from "./pages/RoutesPage.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import EmployeeSalaries from "./pages/EmployeeSalaries.jsx";
import GeneratePayslip from "./pages/GeneratePayslip.jsx";
import SendNotification from "./pages/SendNotification.jsx";
import SmsEmailHistory from "./pages/SmsEmailHistory.jsx";
import RoleBasedRedirect from "./routes/RoleBasedRedirect.jsx";
import SchoolAdminReport from "./pages/schoolAdminReport.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
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
              { path: "settings", element: <SettingsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
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
              { path: "exams/schedule", element: <ScheduleExams /> },
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
              { path: "students", element: <UsersPage /> },
              { path: "assignments", element: <Schedule /> },
              { path: "attendance", element: <StudentAttendance /> },
              { path: "exams", element: <ScheduleExams /> },
              { path: "timetable", element: <ClassTimetable /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
              { path: "notification", element: <Notification /> },

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
              { path: "fees", element: <FeeCategories /> },

              { path: "settings", element: <SettingsPage /> },
              { path: "message", element: <Message /> },
              { path: "profile", element: <Profile /> },
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
