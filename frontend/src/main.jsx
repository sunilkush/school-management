import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import { store } from './store/store.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './components/layout/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      {
        path: "dashboard", element: <Dashboard />, children: [
          {path: "super-admin",element:<SuperAdminDashboard/> },
          {path: "reports", element: <Reports /> },
        ]
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
