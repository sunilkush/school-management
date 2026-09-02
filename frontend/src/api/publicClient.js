/**
 * Bare fetch client for the unauthenticated public endpoints (admission portal, verify pages).
 *
 * Deliberately NOT api/httpClient.js: that one attaches a bearer token, and on any 401 tries a
 * refresh and then redirects the browser to /login. A prospective parent has no account, so a
 * single hiccup there would bounce them out of the application form. Nothing here sends
 * credentials or reacts to 401.
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Resolves to `{ data, status, message }` rather than bare data: the admission API distinguishes
 * "created" (201) from "you already applied, here's the original" (200) by status code alone,
 * and the caller needs to tell those apart to show the right confirmation.
 */
const parse = async (res) => {
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (proxy error page, etc.) — fall through to the status-based message.
  }

  if (!res.ok) {
    const error = new Error(body?.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return { data: body?.data, status: res.status, message: body?.message };
};

const withQuery = (path, params) => {
  if (!params) return `${API_BASE}${path}`;
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
};

export const publicGet = (path, params) => fetch(withQuery(path, params)).then(parse);

export const publicPost = (path, body) =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(parse);

/** Multipart POST — do NOT set Content-Type, the browser adds the multipart boundary itself. */
export const publicUpload = (path, formData) =>
  fetch(`${API_BASE}${path}`, { method: "POST", body: formData }).then(parse);
