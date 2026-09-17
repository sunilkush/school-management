import { School } from "../models/school.model.js";
import { SchoolSubscription } from "../models/schoolSubscription.model.js";

/**
 * Whether a school's users may use the platform right now — the one place that decides it.
 *
 * Login used to check only a switched-off school and an expired subscription, and checked nothing
 * after that: a suspended or cancelled subscription blocked no one, and anyone already signed in
 * kept going on refreshed tokens for days after their school was switched off. Login, token
 * refresh and every authenticated request now ask here.
 *
 * Answers are remembered for a minute per school so the check costs nothing on most requests;
 * the places that change a school or its subscription forget the school straight away, so a
 * change made here takes effect at once (another server process catches up within the minute).
 */

const REMEMBER_MS = 60_000;
const remembered = new Map(); // schoolId -> { at, problem }

const day = (d) => new Date(d).toLocaleDateString("en-IN");

const DEACTIVATED = { code: "SCHOOL_DEACTIVATED", message: "Your school is deactivated. Contact administrator." };

/** Why this school's users are locked out, as `{ code, message }`, or null when they are not. */
export async function findSchoolAccessProblem(schoolId, { fresh = false } = {}) {
  if (!schoolId) return DEACTIVATED;
  const key = String(schoolId?._id || schoolId);

  const hit = remembered.get(key);
  if (!fresh && hit && Date.now() - hit.at < REMEMBER_MS) return hit.problem;

  const [school, subscription] = await Promise.all([
    School.findById(key).select("isActive").lean(),
    SchoolSubscription.findOne({ schoolId: key }).select("status endDate").lean(),
  ]);

  let problem = null;
  if (!school || school.isActive === false) {
    problem = DEACTIVATED;
  } else if (subscription?.status === "suspended") {
    problem = { code: "SUBSCRIPTION_SUSPENDED", message: "Your school's subscription is suspended. Please contact the administrator." };
  } else if (subscription?.status === "cancelled") {
    problem = { code: "SUBSCRIPTION_CANCELLED", message: "Your school's subscription has been cancelled. Please contact the administrator." };
  } else if (subscription && (subscription.status === "expired" || new Date(subscription.endDate) <= new Date())) {
    problem = {
      code: "SUBSCRIPTION_EXPIRED",
      message: `Your school's subscription has expired on ${day(subscription.endDate)}. Please contact the administrator to renew.`,
    };
  }
  // A school with no subscription at all is let in, as before.

  remembered.set(key, { at: Date.now(), problem });
  return problem;
}

/** Forget what was decided for a school (or for every school), after changing it. */
export function forgetSchoolAccess(schoolId) {
  if (schoolId) remembered.delete(String(schoolId?._id || schoolId));
  else remembered.clear();
}

export const isSuperAdminUser = (user) =>
  String(user?.roleId?.name || user?.role?.name || "").toLowerCase().trim() === "super admin";

/**
 * Billing-only access. Once a plan had expired its School Admin could not sign in — so could not
 * pay the renewal invoice that would open the school again, and had to ask the platform team to
 * record the payment. A School Admin of a school whose only problem is an expired plan may now
 * sign in to the billing pages and nothing else. A switched-off, suspended or cancelled school
 * stays fully closed: that was the Super Admin's decision, not a lapse.
 */
// The primary role only: sign-in does not load additional roles, and the same user must get the
// same answer at sign-in and on every request.
export const canUseBillingOnly = (problem, user) =>
  problem?.code === "SUBSCRIPTION_EXPIRED"
  && String(user?.roleId?.name || user?.role?.name || "").toLowerCase().trim() === "school admin";

/** What a billing-only session may reach: its own billing, and who it is. */
const BILLING_ONLY_PATHS = [
  /\/school-billing(\/|\?|$)/,
  /\/user\/(me|my-permissions|logout)(\?|$)/,
];
export const isBillingOnlyPath = (url = "") => BILLING_ONLY_PATHS.some((re) => re.test(String(url).split("#")[0]));

/** Told to a billing-only session that asks for anything else. 402 so the browser opens the billing page. */
export const BILLING_ONLY_STATUS = 402;
export const billingOnlyMessage = (problem) =>
  `${problem.message.replace(/ Please contact the administrator to renew\.$/, "")} Only Billing → My Subscription is open until the renewal invoice is paid.`;
