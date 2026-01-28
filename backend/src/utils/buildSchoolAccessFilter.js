export const buildSchoolAccessFilter = (req, query = {}) => {
  const filter = { ...query };

  // Super Admin → no restriction
  if (req.user.role === "SUPER_ADMIN") {
    return filter;
  }

  // School Admin
  if (req.user.role === "SCHOOL_ADMIN") {
    filter.schoolId = req.user.schoolId;
    return filter;
  }

  // Teacher → assigned schools only
  if (req.user.role === "TEACHER") {
    const assignedSchools = req.user.schoolByAssignedTeachers?.map(
      (s) => s.schoolId
    );

    filter.schoolId = { $in: assignedSchools };
    filter.markedBy = req.user._id;
    return filter;
  }

  return filter;
};
