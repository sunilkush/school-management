export const mergeSchoolWiseAssignments = (existing = [], newTeachers = [], schoolId) => {
  const filtered = existing.filter(
    (t) => t.schoolId.toString() !== schoolId.toString()
  );

  const mappedNew = newTeachers.map((teacherId) => ({
    schoolId,
    teacherId,
  }));

  return [...filtered, ...mappedNew];
};
