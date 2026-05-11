export const ROLE_PATH_MAP = {
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

export const ALL_ROLE_NAMES = Object.keys(ROLE_PATH_MAP).filter((role) => role !== "Support Staff");

export const getRoleName = (user) => {
  if (typeof user?.role === "string") return user.role;
  return user?.role?.name || user?.roleId?.name || "";
};

export const getRolePath = (roleName) => ROLE_PATH_MAP[roleName] || "workspace";
