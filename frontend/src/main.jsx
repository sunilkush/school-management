import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import { store } from './store/store.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SuperAdmin from './pages/SuperAdminDashboard.jsx';
import SchoolAdmin from './pages/SchoolAdminDashboard.jsx';
import TeacherAdmin from './pages/TeacherDashboard.jsx';
import StudentAdmin from './pages/StudentDashboard.jsx';
import ParentAdmin from './pages/ParentDashboard.jsx';
import ManageSchools from './pages/ManageSchools.jsx';
import Dashboard from './components/Dashboard.jsx';
import AddEditDeleteSchools from './components/AddEditDeleteSchools.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "login-page", element: <LoginPage /> },

      {
        path: "super-admin",
        element: <SuperAdmin />,
        children: [
          {
            index: true, // 👈 This will render by default at /super-admin
           element: <Dashboard />,
          },
          {
            path: "manage-schools", // ✅ RELATIVE path
            element: <ManageSchools />,
          },
           {
            path: "dashboard", // ✅ RELATIVE path
            element: <Dashboard />,
          },
          { path: "add-edit-schools", element: <AddEditDeleteSchools /> },
        ],
      },

      { path: "school-admin", element: <SchoolAdmin /> },
      { path: "teacher", element: <TeacherAdmin /> },
      { path: "student", element: <StudentAdmin /> },
      { path: "parent", element: <ParentAdmin /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
