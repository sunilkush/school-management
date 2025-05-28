import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userRole = user?.role?.name?.toLowerCase();
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
