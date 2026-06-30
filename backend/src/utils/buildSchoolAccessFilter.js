// Resolves the role name from req.userRole (populated by auth middleware)
const getRoleName = (req) =>
  (req.userRole?.name || req.user?.roleId?.name || req.user?.role?.name || "").toLowerCase().replace(/\s+/g, "_");

export const buildSchoolAccessFilter = (req, query = {}) => {
  const filter = { ...query };
  const role = getRoleName(req);

  // Super Admin → sees everything
  if (role === "super_admin") {
    return filter;
  }

  // School Admin / Accountant / Principal → scoped to their school
  if (["school_admin", "accountant", "principal", "vice_principal"].includes(role)) {
    filter.schoolId = req.user.schoolId;
    return filter;
  }

  // Teacher → scoped to their school (assignment check happens at the domain layer)
  if (role === "teacher") {
    filter.schoolId = req.user.schoolId;
    return filter;
  }

  // Default: scope to the user's school
  filter.schoolId = req.user.schoolId;
  return filter;
};
