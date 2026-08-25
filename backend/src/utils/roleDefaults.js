// Single source of truth for a role's default module permissions and hierarchy level.
// Previously duplicated (and out of sync) between role.controllers.js's createRole and
// schoolSetup.js's per-school default-role seeding — the latter used a stale, wrong-shaped
// copy that crashed before it ever ran. Both now import from here.

export const ALL_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "export",
  "approve",
  "collect",
  "return",
  "assign",
];

export const DEFAULT_ROLE_PERMISSIONS = {
  "Super Admin": [
    { module: "Schools", actions: ["create", "read", "update", "delete"] },
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Settings", actions: ["read", "update"] },
  ],
  "School Admin": [
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Students", actions: ["create", "read", "update", "delete"] },
    { module: "Teachers", actions: ["create", "read", "update", "delete"] },
    { module: "Parents", actions: ["create", "read", "update", "delete"] },
    { module: "Classes", actions: ["create", "read", "update", "delete"] },
    { module: "Subjects", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["create", "read", "update"] },
    { module: "Exams", actions: ["create", "read", "update", "delete", "export"] },
    { module: "Settings", actions: ["read", "update"] },
    { module: "Reports", actions: ["read", "export"] },
  ],
  Principal: [
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Students", actions: ["create", "read", "update", "delete"] },
    { module: "Teachers", actions: ["create", "read", "update", "delete"] },
    { module: "Parents", actions: ["create", "read", "update", "delete"] },
    { module: "Classes", actions: ["create", "read", "update", "delete"] },
    { module: "Subjects", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["create", "read", "update"] },
    { module: "Exams", actions: ["create", "read", "update", "delete", "export"] },
    { module: "Settings", actions: ["read", "update"] },
    { module: "Reports", actions: ["read", "export"] },
  ],
  "Vice Principal": [
    { module: "Users", actions: ["create", "read", "update", "delete"] },
    { module: "Students", actions: ["create", "read", "update", "delete"] },
    { module: "Teachers", actions: ["create", "read", "update", "delete"] },
    { module: "Parents", actions: ["create", "read", "update", "delete"] },
    { module: "Classes", actions: ["create", "read", "update", "delete"] },
    { module: "Subjects", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["create", "read", "update"] },
    { module: "Settings", actions: ["read", "update"] },
    { module: "Reports", actions: ["read", "export"] },
  ],
  Teacher: [
    { module: "Students", actions: ["read"] },
    { module: "Assignments", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Exams", actions: ["create", "read", "update"] },
    { module: "Attendance", actions: ["create", "read"] },
  ],
  Student: [
    { module: "Assignments", actions: ["read"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Exams", actions: ["read"] },
    { module: "Reports", actions: ["read"] },
  ],
  Parent: [
    { module: "Students", actions: ["read"] },
    { module: "Exams", actions: ["read"] },
    { module: "Reports", actions: ["read"] },
    { module: "Fees", actions: ["read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  Accountant: [
    { module: "Fees", actions: ["create", "read", "update", "delete", "collect"] },
    { module: "Finance", actions: ["create", "read", "update", "delete", "export"] },
    { module: "Expenses", actions: ["create", "read", "update", "delete"] },
  ],
  Staff: [
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  Librarian: [
    { module: "Books", actions: ["create", "read", "update", "delete"] },
    { module: "IssuedBooks", actions: ["create", "read", "return"] },
    { module: "Library", actions: ["read"] },
  ],
  "Hostel Warden": [
    { module: "Hostel", actions: ["read", "update"] },
    { module: "Rooms", actions: ["read", "update"] },
  ],
  "Transport Manager": [
    { module: "Transport", actions: ["read", "update"] },
    { module: "Routes", actions: ["read", "update"] },
    { module: "Vehicles", actions: ["read", "update"] },
  ],
  "Exam Coordinator": [
    { module: "Exams", actions: ["create", "read", "update", "delete"] },
    { module: "Reports", actions: ["read", "export"] },
  ],
  Receptionist: [
    { module: "Users", actions: ["read", "create"] },
    { module: "Students", actions: ["read"] },
  ],
  "IT Support": [
    { module: "Settings", actions: ["read", "update"] },
    { module: "Users", actions: ["read", "update"] },
  ],
  Counselor: [
    { module: "Students", actions: ["read", "update"] },
    { module: "Parents", actions: ["read"] },
  ],
  "Subject Coordinator": [
    { module: "Subjects", actions: ["create", "read", "update"] },
    { module: "Teachers", actions: ["read"] },
  ],
  Security: [
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Transport", actions: ["read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  "Sports Teacher": [
    { module: "Students", actions: ["read"] },
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Assignments", actions: ["create", "read", "update", "delete"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  "Lab Technician": [
    { module: "Students", actions: ["read"] },
    { module: "Inventory", actions: ["read", "update"] },
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  "Medical Officer": [
    { module: "Students", actions: ["read", "update"] },
    { module: "Attendance", actions: ["read"] },
    { module: "Notifications", actions: ["read"] },
    { module: "Reports", actions: ["read"] },
  ],
  "Class Teacher": [
    { module: "Students", actions: ["read"] },
    { module: "Assignments", actions: ["create", "read", "update", "delete"] },
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Timetable", actions: ["read"] },
    { module: "Notifications", actions: ["read"] },
  ],
  // Wired up in transport.routes.js (GET /vehicles/my) and frontend/src/utils/roles.js's
  // ROLE_PATH_MAP, but had no entry here — creating this role from the admin UI without
  // manually adding permission rows hit "No default permissions defined for role: Driver".
  Driver: [
    { module: "Transport", actions: ["read"] },
    { module: "Attendance", actions: ["create", "read"] },
    { module: "Notifications", actions: ["read"] },
  ],
};

export const ROLE_LEVEL_MAP = {
  "Super Admin": 1,
  "School Admin": 2,
  Principal: 2,
  "Vice Principal": 2,
  Teacher: 3,
  "Subject Coordinator": 3,
  Student: 4,
  Parent: 4,
  Accountant: 4,
  Staff: 4,
  "Support Staff": 4,
  Librarian: 4,
  "Hostel Warden": 4,
  "Transport Manager": 4,
  "Exam Coordinator": 4,
  Receptionist: 4,
  "IT Support": 4,
  Counselor: 4,
  Security: 4,
  "Sports Teacher": 3,
  "Lab Technician": 4,
  "Medical Officer": 4,
  "Class Teacher": 3,
  Driver: 4,
};
