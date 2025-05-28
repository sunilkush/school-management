import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);
  const role = useSelector((state) => state.role.data); // fetched from roleSlice

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // If no specific role is required, allow access
  if (allowedRoles.length === 0) {
    return <Outlet />;
  }

  const userRoleName = role?.name || user?.role?.name;

  if (!allowedRoles.includes(userRoleName)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
