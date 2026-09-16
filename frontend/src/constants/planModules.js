/**
 * The modules a subscription plan can switch on, and the caps it can set.
 *
 * The backend stores a plan feature as a bare module name plus `allowed`, and decides access from
 * that list (superAdminBilling.controllers.js → getFeatureAccessControl), so these names must match
 * its module map exactly. The descriptions are ours: they only explain the name to whoever is
 * building or reading a plan.
 */
export const PLAN_MODULES = [
  { key: "Attendance", description: "Daily attendance for students and staff" },
  { key: "Fees", description: "Fee collection, invoices and payment tracking" },
  { key: "Exam", description: "Exam scheduling, grading and report cards" },
  { key: "Online Exam", description: "Online tests with auto-evaluation" },
  { key: "Transport", description: "Bus routes, vehicles and driver tracking" },
  { key: "Hostel", description: "Room allocation and resident management" },
  { key: "Library", description: "Book catalog, issue and return tracking" },
  { key: "Payroll", description: "Staff salary processing and payslips" },
  { key: "Reports", description: "Academic and administrative analytics" },
  { key: "Mobile App", description: "The parent and student mobile app" },
  { key: "AI Features", description: "AI-powered insights and automation" },
];

export const PLAN_MODULE_KEYS = PLAN_MODULES.map((m) => m.key);

export const PLAN_MODULE_DESCRIPTIONS = Object.fromEntries(
  PLAN_MODULES.map((m) => [m.key, m.description]),
);

/** The plan-wide caps. Leaving one empty means the plan does not cap it. */
export const PLAN_LIMITS = [
  { key: "maxStudents", label: "Students" },
  { key: "maxTeachers", label: "Teachers" },
  { key: "maxUsers", label: "Users in total" },
  { key: "maxSchools", label: "Schools" },
  { key: "maxStorage", label: "Storage (MB)" },
  { key: "maxSMS", label: "SMS a month" },
];

/** Common billing periods, offered as one click instead of typing a day count. */
export const DURATION_PRESETS = [
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
  { label: "Half-yearly", days: 180 },
  { label: "Yearly", days: 365 },
];
