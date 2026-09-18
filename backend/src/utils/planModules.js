import { SchoolSubscription } from "../models/schoolSubscription.model.js";

/**
 * The modules a subscription plan can switch on. These names are the contract between the plan
 * editor (frontend constants/planModules.js), the plan documents in Mongo, and the sidebar's lock.
 * A name that is not on this list is not a module — some old plans stored limit names like
 * "Students" here, which is exactly what resolvePlanModules() has to survive.
 */
export const PLAN_MODULE_NAMES = [
  "Attendance",
  "Fees",
  "Exam",
  "Online Exam",
  "Transport",
  "Hostel",
  "Library",
  "Payroll",
  "Reports",
  "AI Features",
  "Mobile App",
];

const KNOWN = new Set(PLAN_MODULE_NAMES);

/**
 * The modules a school may use, or `null` for "no limits".
 *
 * null is deliberate in three cases, and every caller must treat it as "show everything":
 *   • Super Admin (no school of their own),
 *   • a school with no subscription at all — the same rule schoolAccess.js uses for login,
 *   • a subscription whose snapshot lists nothing we recognise as a module. Locking the whole
 *     product because a plan was saved wrong is far worse than locking nothing, so bad data
 *     opens up rather than shuts down.
 */
export const resolvePlanModules = async (schoolId) => {
  if (!schoolId) return null;

  const subscription = await SchoolSubscription.findOne({ schoolId })
    .select("snapshot.features")
    .lean();
  if (!subscription) return null;

  const features = subscription.snapshot?.features || [];
  const allowed = features
    .filter((f) => f?.module && KNOWN.has(f.module) && f.allowed !== false)
    .map((f) => f.module);

  const recognised = features.some((f) => f?.module && KNOWN.has(f.module));
  return recognised ? [...new Set(allowed)] : null;
};
