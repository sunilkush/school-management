import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ roles, children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;
