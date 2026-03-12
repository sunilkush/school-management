import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const rolePathMap = {
  "Super Admin": "superadmin",
  "School Admin": "schooladmin",
  Principal: "principal",
  "Vice Principal": "viceprincipal",
  Teacher: "teacher",
  "Subject Coordinator": "subjectcoordinator",
  Student: "student",
  Parent: "parent",
  Accountant: "accountant",
  Staff: "staff",
  "Support Staff": "staff",
  Librarian: "librarian",
  "Hostel Warden": "hostelwarden",
  "Transport Manager": "transportmanager",
  "Exam Coordinator": "examcoordinator",
  Receptionist: "receptionist",
  "IT Support": "itsupport",
  Counselor: "counselor",
  Security: "security",
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
