import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import store from './store/store.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import LoginPage from './pages/Login.jsx';
import CreateUser from './pages/CreateUser.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SchoolList from './pages/SchoolList.jsx';
import Page404 from './pages/Page404.jsx';
import SchoolRegister from './pages/SchoolRegister.jsx';
// If needed
import NotFound from './pages/NotFound.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "", element: <LoginPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "adminDashboard", element: <AdminDashboard /> },

      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          { path: "school-list", element: <SchoolList /> },
          { path: "create-user", element: <CreateUser /> },
          { path: "school-register", element: <SchoolRegister /> },
        ],
      },

      { path: "page404", element: <Page404 /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
