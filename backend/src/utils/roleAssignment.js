/**
 * Who may hand out which role.
 *
 * Every platform-level check in this codebase asks "is this user's role called Super Admin?" —
 * some by exact string, some lowercased and underscored (buildSchoolAccessFilter). So the role
 * NAME is the real privilege boundary, and anything that lets a school user attach that name to
 * an account is a way to become platform admin. Three endpoints hand out roles: registerUser
 * (primary role at creation), assignAdditionalRoles, and createRole (invents the name); all three
 * go through here.
 *
 * Note on `type`: almost every role in this product is stored as type "system" (Teacher, Student,
 * Parent — all of them), so "system" cannot be used to mean "privileged". Only the name can.
 */

/** True for the platform role however it is cased, spaced, hyphenated or underscored. */
export const isPlatformRoleName = (name) =>
  String(name || "").trim().toLowerCase().replace(/[\s_-]+/g, " ") === "super admin";

/**
 * The first role in `roles` that this caller must not hand out, or null when all are fine.
 * Super Admin may assign anything; everyone else is blocked from the platform role and from
 * roles that belong to a different school.
 */
export const findForbiddenRole = (roles = [], { isSuperAdmin = false, callerSchoolId = null } = {}) => {
  if (isSuperAdmin) return null;
  return (
    roles.find(
      (role) =>
        isPlatformRoleName(role?.name) ||
        (role?.schoolId && String(role.schoolId) !== String(callerSchoolId || ""))
    ) || null
  );
};
