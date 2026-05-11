import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../components/Loader/Loader";
import { getRoleName, getRolePath } from "../utils/roles";

const RoleBasedRedirect = () => {
  const { user, isAuthInitialized } = useSelector((state) => state.auth);

  if (!isAuthInitialized) {
    return <Loader />;
  }

  const path = getRolePath(getRoleName(user));
  return <Navigate to={`/dashboard/${path}`} replace />;
};

export default RoleBasedRedirect;