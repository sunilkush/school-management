import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const Loader = lazy(() => import("../components/Loader/Loader"));

const resolveRoleName = (user) =>
  typeof user?.role === "string" ? user.role : user?.role?.name;

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const { user, accessToken, isAuthInitialized } = useSelector((state) => state.auth);
 
  if (!isAuthInitialized) {
    return (
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRoleName = resolveRoleName(user);

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
