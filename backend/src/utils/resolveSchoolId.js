import { ApiError } from "./ApiError.js";

/**
 * Resolves the caller's own schoolId from an authenticated user object. This fallback chain used
 * to be copy-pasted independently across a dozen controllers, each with a slightly different
 * variation — that drift is exactly how a real cross-tenant bug slipped in elsewhere (a query
 * param silently overriding the user's own school in a couple of dashboard/report endpoints).
 * One shared definition means a fix here reaches every caller at once.
 */
export const resolveSchoolId = (user) =>
  user?.schoolId?._id || user?.schoolId || user?.school?._id || null;

/** Same resolution, taking the Express request directly (reads req.user). */
export const resolveSchoolIdFromReq = (req) => resolveSchoolId(req?.user);

/** Same as resolveSchoolId, but throws a 400 if no schoolId can be resolved. */
export const requireSchoolId = (user) => {
  const schoolId = resolveSchoolId(user);
  if (!schoolId) throw new ApiError(400, "School not found for this user");
  return schoolId;
};
