import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRoleName, getRolePath } from "../utils/roles";

const Loader = lazy(() => import("../components/Loader/Loader"));

const RoleBasedRedirect = () => {
  const { user, isAuthInitialized } = useSelector((state) => state.auth);

  if (!isAuthInitialized) {
    return (
      <Suspense fallback={null}>
        <Loader />
      </Suspense>
    );
  }

  const path = getRolePath(getRoleName(user));
  return <Navigate to={`/dashboard/${path}`} replace />;
};

export default RoleBasedRedirect;