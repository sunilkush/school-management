export const buildSchoolAccessFilter = (req, query = {}) => {
  const filter = { ...query };
  const roleName = req.userRole || req.user?.role;
  const userSchoolId = req.user?.schoolId;

  // Super Admin → no restriction
  if (roleName === "Super Admin") {
    return filter;
  }

  // All non-super-admin users are bound to their own school
  if (userSchoolId) {
    filter.schoolId = userSchoolId;
  }

  // Teacher → only own attendance records
  if (roleName === "Teacher") {
    filter.markedBy = req.user._id;
  }

  return filter;
};
