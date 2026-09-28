/**
 * Links users type in (a study-material link, a homework attachment, a CV link) are later opened by
 * someone else — often someone with more access (a student's attachment, opened by the teacher).
 * A "javascript:" link runs as script in the app when clicked, so only http(s) links are stored.
 * Mirrors frontend/src/utils/safeUrl.js, which also guards links already in the database.
 */
export const isHttpUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/** Mongoose validator for an optional link field: empty is fine, anything else must be http(s). */
export const optionalHttpUrlValidator = {
  validator: (value) => value === undefined || value === null || value === "" || isHttpUrl(value),
  message: (props) => `${props.path} must be an http:// or https:// link`,
};
