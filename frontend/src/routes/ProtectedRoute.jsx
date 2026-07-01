import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const Loader = lazy(() => import("../components/Loader/Loader"));

const resolveRoleName = (user) =>
  typeof user?.role === "string" ? user.role : user?.role?.name;

const resolveAllRoleNames = (user) => {
  const primary = resolveRoleName(user);
  const additional = (user?.additionalRoles || [])
    .map((r) => (typeof r === "string" ? r : r?.name))
    .filter(Boolean);
  return [primary, ...additional].filter(Boolean);
};

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

  const allRoles = resolveAllRoleNames(user);

  if (allowedRoles.length > 0 && !allRoles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
