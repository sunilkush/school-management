import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, accessToken} = useSelector((state) => state.auth);
  
 

  // 🔐 Not logged in
  if (!accessToken || !user) {
    return <Navigate to="/" replace />;
  }

  // 🟢 No role restriction
  if (allowedRoles.length === 0) {
    return <Outlet />;
  }

  const userRoleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name;

  if (!allowedRoles.includes(userRoleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;