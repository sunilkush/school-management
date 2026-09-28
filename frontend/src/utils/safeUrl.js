/**
 * Links that come from data (a teacher's study-material link, a school's website, an attachment,
 * a candidate's CV link) are rendered into href / window.open. React escapes text but not URLs:
 * a stored "javascript:..." link runs as script, in the app's own origin and the clicker's session,
 * the moment someone clicks it. Only these schemes are let through; anything else is dropped.
 */
const ALLOWED = new Set(["http:", "https:", "mailto:", "tel:"]);

export const safeHref = (value) => {
  if (value === null || value === undefined) return undefined;
  const url = String(value).trim();
  if (!url) return undefined;
  // A path inside the app ("/uploads/...", "/dashboard/...") — but not "//host", which leaves it.
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    // Parsed against a base so bare relative paths work; browsers ignore tabs/newlines inside a
    // scheme ("java\tscript:"), and URL() normalises them the same way before we read .protocol.
    const parsed = new URL(url, window.location.origin);
    return ALLOWED.has(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};
