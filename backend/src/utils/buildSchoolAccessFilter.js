import { ApiError } from "./ApiError.js";

export const buildSchoolAccessFilter = (req, query = {}) => {
  const filter = { ...query };
  const roleName = req.userRole || req.user?.role;
  const userSchoolId = req.user?.schoolId?.toString?.() || req.user?.schoolId;
  const requestedSchoolId = query.schoolId?.toString?.() || query.schoolId;

  // Super Admin can query any school (or all schools if schoolId not passed)
  if (roleName === "Super Admin") {
    return filter;
  }

  if (!userSchoolId) {
    throw new ApiError(403, "School scope missing for current user");
  }

  // Anti-spoofing: non-super-admin cannot query another school explicitly
  if (requestedSchoolId && requestedSchoolId !== userSchoolId) {
    throw new ApiError(403, "Cross-school access is not allowed");
  }

  // Force tenant scope
  filter.schoolId = userSchoolId;

  // Teacher → only own attendance records
  if (roleName === "Teacher") {
    filter.markedBy = req.user._id;
  }

  return filter;
};
