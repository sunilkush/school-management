// Escapes regex metacharacters in raw user search input before it's used to build a RegExp —
// without this, a search term containing `(`, `.`, `+`, `*`, etc. either throws (invalid regex,
// e.g. an unbalanced paren) or matches unintended patterns, and a crafted term can cause
// catastrophic backtracking (ReDoS) that hangs the single Node.js event loop for every request.
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
