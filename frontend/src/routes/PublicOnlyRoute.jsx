import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getRoleName, getRolePath } from "../utils/roles";

const Loader = lazy(() => import("../components/Loader/Loader"));

/**
 * Redirects already-authenticated users to their role dashboard.
 * Use this to wrap login, forgot-password, reset-password, etc.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, accessToken, isAuthInitialized } = useSelector((s) => s.auth);

  if (!isAuthInitialized) {
    return (
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    );
  }

  if (accessToken && user) {
    const path = getRolePath(getRoleName(user));
    return <Navigate to={`/dashboard/${path}`} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
