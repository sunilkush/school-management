import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store.js";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from "./pages/login.jsx";
import Dashboard from "./pages/dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx"; // ✅ Import ProtectedRoute
import SignUp from "./pages/signUp.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/signUp", element: <SignUp /> },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
