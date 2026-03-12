export const ERP_MODULES = [
  { key: "school-management", title: "School Management", description: "School profile, settings, and subscription controls." },
  { key: "academic-management", title: "Academic Management", description: "Boards, classes, sections, subjects, chapters, and lesson plans." },
  { key: "student-management", title: "Student Management", description: "Admissions, profile management, promotions, and documents." },
  { key: "teacher-management", title: "Teacher Management", description: "Teacher profile, assignment, attendance, and salary tracking." },
  { key: "attendance-system", title: "Attendance System", description: "Student/staff attendance with QR and biometric support." },
  { key: "exam-result", title: "Exam & Result", description: "Exam creation, scheduling, marks, report cards, and analytics." },
  { key: "fees-management", title: "Fees Management", description: "Fee structures, installments, collections, receipts, and finance reports." },
  { key: "transport-management", title: "Transport Management", description: "Routes, vehicles, drivers, and transport operations." },
  { key: "hostel-management", title: "Hostel Management", description: "Hostel/room setup and bed allocation workflows." },
  { key: "library-management", title: "Library Management", description: "Books catalog, issue/return, fines, and member activity." },
  { key: "inventory", title: "Inventory", description: "Items, supplier, purchase, and expense lifecycle." },
  { key: "communication", title: "Communication", description: "Notifications, SMS, email, and in-app messaging flows." },
  { key: "learning-management", title: "Learning Management", description: "Homework, assignments, tests, quizzes, and study materials." },
  { key: "reports-analytics", title: "Reports & Analytics", description: "Performance, attendance, financial, and dashboard reporting." },
];

export const ROLE_MODULE_ACCESS = {
  "Super Admin": ERP_MODULES.map((m) => m.key),
  "School Admin": ERP_MODULES.map((m) => m.key),
  Principal: ERP_MODULES.map((m) => m.key),
  "Vice Principal": ["academic-management", "student-management", "teacher-management", "attendance-system", "exam-result", "learning-management", "reports-analytics", "communication"],
  Teacher: ["academic-management", "student-management", "attendance-system", "exam-result", "learning-management", "communication", "reports-analytics"],
  "Subject Coordinator": ["academic-management", "teacher-management", "exam-result", "learning-management", "reports-analytics"],
  Student: ["learning-management", "exam-result", "attendance-system", "library-management", "communication", "fees-management"],
  Parent: ["student-management", "attendance-system", "exam-result", "fees-management", "communication", "learning-management"],
  Accountant: ["fees-management", "reports-analytics", "inventory", "communication"],
  Staff: ["attendance-system", "communication", "reports-analytics"],
  "Support Staff": ["attendance-system", "communication"],
  Librarian: ["library-management", "reports-analytics", "communication"],
  "Hostel Warden": ["hostel-management", "student-management", "attendance-system", "reports-analytics"],
  "Transport Manager": ["transport-management", "student-management", "communication", "reports-analytics"],
  "Exam Coordinator": ["exam-result", "academic-management", "reports-analytics", "communication"],
  Receptionist: ["student-management", "communication", "school-management"],
  "IT Support": ["school-management", "communication", "reports-analytics", "inventory"],
  Counselor: ["student-management", "communication", "reports-analytics", "learning-management"],
  Security: ["attendance-system", "communication", "transport-management"],
};

export const getRoleModules = (roleName, permissionModules = []) => {
  if (permissionModules.length) {
    const fromPermission = ERP_MODULES.filter((m) =>
      permissionModules.some((p) => p?.toLowerCase() === m.title.toLowerCase())
    );
    if (fromPermission.length) return fromPermission;
  }

  const allowedKeys = ROLE_MODULE_ACCESS[roleName] || [];
  return ERP_MODULES.filter((module) => allowedKeys.includes(module.key));
};
