import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import  store  from './store/store.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './components/layout/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import Profile from './pages/Profile.jsx';
import Notification from './pages/Notification.jsx';
import Message from './pages/Message.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import AccountantDashboard from './pages/AccountantDashboard.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import Documents from './pages/Documents.jsx';
import Schedule from './pages/Schedule.jsx';
import UserRegister from './pages/UserRegister.jsx';

// Get user from localStorage or store
const user = JSON.parse(localStorage.getItem("user"));

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
          {
            path: "super-admin",
            element: (
              <ProtectedRoute allowedRoles={["Super Admin"]} user={user}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "school-admin",
            element: (
              <ProtectedRoute allowedRoles={["School Admin"]} user={user}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "student",
            element: (
              <ProtectedRoute allowedRoles={["Student"]} user={user}>
                <StudentDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "teacher",
            element: (
              <ProtectedRoute allowedRoles={["Teacher"]} user={user}>
                <TeacherDashboard />
              </ProtectedRoute>
            ),
          },
           {
            path: "accountant",
            element: (
              <ProtectedRoute allowedRoles={["Accountant"]} user={user}>
                <AccountantDashboard />
              </ProtectedRoute>
            ),
          },
           {
            path: "staff",
            element: (
              <ProtectedRoute allowedRoles={["Staff"]} user={user}>
                <StaffDashboard />
              </ProtectedRoute>
            ),
          },
          
        
          
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
