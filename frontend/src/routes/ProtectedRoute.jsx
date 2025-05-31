import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  
  
  const { user, accessToken } = useSelector((state) => state.auth);
 const role = user?.role?.name // fetched from roleSlice
  console.log(role)
  if (!accessToken || !user) {
    return <Navigate to="/" />;
  }

  // If no specific role is required, allow access
  if (allowedRoles.length === 0) {
    return <Outlet />;
  }

  const userRoleName =  user?.role?.name;

  if (!allowedRoles.includes(userRoleName)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
