import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const rolePathMap = {
  "Super Admin": "superadmin",
  "School Admin": "schooladmin",
  Principal: "workspace",
  "Vice Principal": "workspace",
  Teacher: "teacher",
  "Subject Coordinator": "workspace",
  Student: "student",
  Parent: "parent",
  Accountant: "accountant",
  Staff: "staff",
  "Support Staff": "workspace",
  Librarian: "workspace",
  "Hostel Warden": "workspace",
  "Transport Manager": "workspace",
  "Exam Coordinator": "workspace",
  Receptionist: "workspace",
  "IT Support": "workspace",
  Counselor: "workspace",
  Security: "workspace",
};

const RoleBasedRedirect = () => {
  const role = useSelector((state) =>
    typeof state.auth.user?.role === "string"
      ? state.auth.user?.role
      : state.auth.user?.role?.name
  );

  const path = rolePathMap[role] || "unauthorized";
  return <Navigate to={`/dashboard/${path}`} replace />;
};

export default RoleBasedRedirect;
