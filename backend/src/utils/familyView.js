// Pattern E in docs/bug-audit.md: a Student or Parent is shown other people by name (and role), not
// by email or phone. The same rule the message screens already follow (message.controllers.js).
// Decided on the caller's primary role, as there: a teacher who is also a parent keeps staff view.

const FAMILY_ROLES = ["Student", "Parent"];
const CONTACT_FIELDS = ["email", "phone", "mobile"];

export const isFamilyViewer = (req) => FAMILY_ROLES.includes(req?.userRole?.name || req?.user?.roleId?.name || "");

/** A populate/select field list with the contact fields removed when the viewer is family. */
export const personFields = (req, fields = "name email") => {
  if (!isFamilyViewer(req)) return fields;
  const kept = fields.split(/\s+/).filter((field) => field && !CONTACT_FIELDS.includes(field));
  return kept.length ? kept.join(" ") : "name";
};
