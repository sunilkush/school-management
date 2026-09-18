/**
 * Which sidebar pages belong to which plan module, so a page the school did not buy can be shown
 * with a lock instead of being hidden.
 *
 * Nothing here blocks anything: the lock is a label plus a nudge to the subscription page. The
 * modules themselves come from the API (`user.planModules`, set in getCurrentUser), and `null`
 * there means "no limits" — Super Admin, a school with no subscription, or a plan we could not
 * read. Treat null as everything unlocked.
 */

/* Matched against a menu item's `path` (e.g. "schooladmin/transport/routes"). First match wins, so
   the more specific "never lock" list is checked before the module patterns. */
const MODULE_PATTERNS = [
  ["Transport", /(^|\/)transport(\/|$)/],
  ["Hostel", /(^|\/)(hostel|hostelwarden)(\/|$)/],
  ["Library", /(^|\/)(library|book-catalog|issue-return)(\/|$)/],
  ["Payroll", /(^|\/)(payroll|salary)(\/|$)/],
  ["Fees", /(^|\/)(fees|income|expenses|finance)(\/|$)/],
  ["Exam", /(^|\/)(exams|exam|report-cards)(\/|$)/],
  ["Attendance", /(^|\/)attendance(\/|$)/],
];

/* A person's own pages are never locked: their own attendance, their own payslip, their own fees
   or report card. Those are about the user, not about a module the school buys. Staff pages are
   named "My …" throughout this app ("My Payroll" is one payslip, "Payroll" is the whole run), and
   a student's or parent's whole menu is their own. */
const NEVER_LOCK_PATH = [
  /(^|\/)(my|self)(\/|$)/,
  /^(student|parent)\//,
  /(^|\/)profile(\/|$)/,
  /(^|\/)billing(\/|$)/,
];
const NEVER_LOCK_TITLE = /^my\b/i;

/** The plan module a menu entry belongs to, or null when it belongs to none. */
export const moduleForPath = (path, title = "") => {
  if (!path) return null;
  const clean = String(path).replace(/^\/+/, "");
  if (NEVER_LOCK_TITLE.test(String(title).trim())) return null;
  if (NEVER_LOCK_PATH.some((re) => re.test(clean))) return null;
  const hit = MODULE_PATTERNS.find(([, re]) => re.test(clean));
  return hit ? hit[0] : null;
};

/**
 * The module a menu entry needs when the school's plan does not include it — null when the page is
 * fine to open. `planModules` is the list from the API; null/undefined means no limits.
 */
export const lockedModuleFor = (item, planModules) => {
  if (!Array.isArray(planModules)) return null;
  const { path, title } = typeof item === "string" ? { path: item, title: "" } : (item || {});
  const needed = moduleForPath(path, title);
  if (!needed) return null;
  return planModules.includes(needed) ? null : needed;
};

/** Where "Upgrade karein" goes. Only a School Admin can actually buy; everyone else is told to ask. */
export const UPGRADE_PATH = "/dashboard/schooladmin/billing/subscription";

export const canUpgrade = (roleName) =>
  String(roleName || "").toLowerCase() === "school admin";

export const lockMessage = (moduleName, roleName) =>
  canUpgrade(roleName)
    ? `${moduleName} is not in your school's plan. Open My Subscription to upgrade.`
    : `${moduleName} is not in your school's plan. Ask your school admin to upgrade.`;
