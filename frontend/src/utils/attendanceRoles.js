export const ATTENDANCE_ROLE_OPTIONS = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Staff", value: "staff" },
  { label: "Support Staff", value: "support_staff" },
  { label: "Accountant", value: "accountant" },
  { label: "Admin", value: "admin" },
  { label: "School Admin", value: "school_admin" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Principal", value: "principal" },
  { label: "Vice Principal", value: "vice_principal" },
  { label: "Subject Coordinator", value: "subject_coordinator" },
  { label: "Librarian", value: "librarian" },
  { label: "Hostel Warden", value: "hostel_warden" },
  { label: "Transport Manager", value: "transport_manager" },
  { label: "Exam Coordinator", value: "exam_coordinator" },
  { label: "Receptionist", value: "receptionist" },
  { label: "IT Support", value: "it_support" },
  { label: "Counselor", value: "counselor" },
  { label: "Security", value: "security" },
  { label: "Parent", value: "parent" },
];

export const ROLE_NAME_TO_ATTENDANCE_ROLE = {
  "Super Admin": "super_admin",
  "School Admin": "school_admin",
  Admin: "admin",
  Principal: "principal",
  "Vice Principal": "vice_principal",
  Teacher: "teacher",
  "Subject Coordinator": "subject_coordinator",
  Student: "student",
  Parent: "parent",
  Accountant: "accountant",
  Staff: "staff",
  "Support Staff": "support_staff",
  Librarian: "librarian",
  "Hostel Warden": "hostel_warden",
  "Transport Manager": "transport_manager",
  "Exam Coordinator": "exam_coordinator",
  Receptionist: "receptionist",
  "IT Support": "it_support",
  Counselor: "counselor",
  Security: "security",
};

export const getAttendanceRoleFromUser = (user) => {
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name || user?.roleId?.name || "";
  return ROLE_NAME_TO_ATTENDANCE_ROLE[roleName] || "staff";
};
