import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleBasedRedirect = () => {
  const role = useSelector((state) =>
    typeof state.auth.user?.role === "string"
      ? state.auth.user?.role
      : state.auth.user?.role?.name
  );

  const path = {
    "Super Admin": "superadmin",
    "School Admin": "schooladmin",
    Teacher: "teacher",
    Student: "student",
    Parent: "parent",
    Accountant: "accountant",
    Staff: "staff",
  }[role] || "unauthorized";

  return <Navigate to={`/dashboard/${path}`} replace />;
};

export default RoleBasedRedirect;
