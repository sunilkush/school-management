/**
 * Shared categorical palette for avatars, chart series and other "many distinct items in one
 * view" contexts, where a single semantic token (primary/success/etc.) wouldn't differentiate
 * enough items. Ten pages previously each hardcoded their own near-identical copy of this array;
 * import from here instead so every avatar/chart across the app draws from the same sequence.
 */
export const CATEGORICAL_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--purple)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--pink)",
  "var(--cyan)",
  "var(--info)",
  "var(--orange)",
];

/** Deterministic color for a given key (e.g. a user id or name) — same input always maps to the
 * same palette entry, so a given person/item keeps a stable color across renders and pages. */
export function categoricalColorFor(key) {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return CATEGORICAL_COLORS[hash % CATEGORICAL_COLORS.length];
}
