// Route gates (requireRoles) let a user in if their primary OR any ADDITIONAL role is allowed.
// Handlers then branched on the primary role alone — `req.userRole.name === "Parent"` — so a user
// who got past the gate on an additional role never hit that branch. School Admin > Teachers >
// "Additional roles" offers every role, so "a Teacher who is also a Parent" is two clicks away.
// That Teacher passed Parent-only routes as a Parent and then fell into the handler's staff branch:
// every PTM booking in the school, every payment, any student's profile.
//
// These helpers answer "in which capacity is this user acting here" from EVERY role they hold.
// They decide which branch runs, not which schools a user may reach: cross-school checks keep
// using the primary role (`req.userRole.name !== "Super Admin"`), as they always have.

const normalize = (name) => (typeof name === "string" ? name.toLowerCase().trim() : "");

/** Every role name the user holds, primary first, lower-cased. */
const heldRoleNames = (user) =>
  [user?.roleId?.name, ...(user?.additionalRoles || []).map((r) => r?.name)]
    .map(normalize)
    .filter(Boolean);

/** True if the user holds `name` as their primary or an additional role. */
export const holdsRole = (user, name) => heldRoleNames(user).includes(normalize(name));

/**
 * The one role a handler with per-role branches should branch on: the first of `roles` the user
 * holds, primary or additional. List roles broadest first — someone granted "Accountant" on top of
 * "Parent" is acting as an Accountant, exactly as a primary Accountant would. Nobody gets more than
 * a primary holder of one of the roles they were actually given.
 *
 * Returns null when the user holds none of them; a caller must then deny rather than fall through
 * to a default branch.
 */
export const actingRoleName = (user, roles) => {
  const held = heldRoleNames(user);
  return roles.find((role) => held.includes(normalize(role))) || null;
};
