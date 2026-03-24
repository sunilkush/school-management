import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, accessToken} = useSelector((state) => state.auth);


  // 🔐 Not logged in
  if (!accessToken || !user) {
    return <Navigate to="/" replace />;
  }

  // 🟢 No role restriction
  if (allowedRoles.length === 0) {
   return children || <Outlet />;
  }

  const userRoleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name;

  if (!allowedRoles.includes(userRoleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;