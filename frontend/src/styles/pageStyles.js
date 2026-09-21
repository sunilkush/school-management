import React from "react";

/**
 * Shared style patterns for all pages.
 * All colours come from CSS variables defined in styles/main.scss so dark-mode
 * works automatically.  Do NOT use raw hex values here.
 */

/* ── Responsive stat-card grid ───────────────────────────────────── */
/**
 * statGrid(minColPx?) — returns an inline style for a responsive grid.
 * Pair with className="stat-grid" to also get the CSS media-query fallback.
 * minColPx defaults to 150 → collapses to 2 cols at ~360px, 4+ on desktop.
 */
export const statGrid = (minColPx = 150) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColPx}px, 1fr))`,
  gap: "var(--space-3)",
  marginBottom: "var(--space-5)",
});

/* ── KPI stat card (pastel design) ──────────────────────────────── */
export const statCard = ({ color, bg, accentBar }) => ({
  padding: "var(--space-4) var(--space-5)",
  background: bg || "var(--surface)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-muted)",
  borderLeft: `3px solid ${accentBar || color}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "var(--shadow-soft)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
});

export const statLabel = () => ({
  fontSize: "var(--font-xs)",
  fontWeight: "var(--weight-bold)",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "var(--space-1)",
});

export const statValue = () => ({
  fontSize: "var(--font-2xl)",
  fontWeight: "var(--weight-bold)",
  color: "var(--text)",
  lineHeight: 1.1,
});

/* ── Avatar initials palette ────────────────────────────────────── */
const PALETTE = [
  { bg: "var(--primary-light)", color: "var(--primary-hover)" },
  { bg: "var(--accent-light)", color: "var(--accent-hover)" },
  { bg: "var(--success-light)", color: "var(--success-hover)" },
  { bg: "var(--danger-light)", color: "var(--danger-hover)" },
  { bg: "var(--warning-light)", color: "var(--warning-hover)" },
  { bg: "rgba(var(--purple-rgb), 0.15)", color: "var(--purple-hover)" },
];

export const avatarColor = (name = "") => {
  const idx = (name.charCodeAt(0) || 65) % PALETTE.length;
  return PALETTE[idx];
};

export const avatarStyle = (name = "", size = 38) => {
  const { bg, color } = avatarColor(name);
  return {
    width: size, height: size, borderRadius: "50%",
    background: bg, color,
    fontWeight: "var(--weight-bold)", fontSize: Math.round(size * 0.35),
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, border: `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
  };
};

/* ── Status dot + text ───────────────────────────────────────────── */
export const STATUS = {
  active:    { dot: "var(--success)", text: "var(--success-hover)", bg: "var(--success-light)", border: "rgba(var(--success-rgb), 0.3)" },
  inactive:  { dot: "var(--text-muted)", text: "var(--text-secondary)", bg: "var(--surface-soft)", border: "var(--border)" },
  pending:   { dot: "var(--warning)", text: "var(--warning-hover)", bg: "var(--warning-light)", border: "rgba(var(--warning-rgb), 0.3)" },
  overdue:   { dot: "var(--danger)", text: "var(--danger-hover)", bg: "var(--danger-light)", border: "rgba(var(--danger-rgb), 0.3)" },
  suspended: { dot: "var(--purple)", text: "var(--purple-hover)", bg: "rgba(var(--purple-rgb), 0.12)", border: "rgba(var(--purple-rgb), 0.3)" },
  paid:      { dot: "var(--success)", text: "var(--success-hover)", bg: "var(--success-light)", border: "rgba(var(--success-rgb), 0.3)" },
  unpaid:    { dot: "var(--danger)", text: "var(--danger-hover)", bg: "var(--danger-light)", border: "rgba(var(--danger-rgb), 0.3)" },
  partial:   { dot: "var(--warning)", text: "var(--warning-hover)", bg: "var(--warning-light)", border: "rgba(var(--warning-rgb), 0.3)" },
};

export const statusDot = () => ({
  display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
});

/* ── Pill tag ────────────────────────────────────────────────────── */
// color-mix() (not hex-string concatenation like `${color}15`) so this works whether `color` is
// a literal hex or a `var(--token)` reference — string-concatenating a CSS var reference with hex
// alpha digits produces invalid CSS that the browser silently drops.
export const pill = (color, bg) => ({
  display: "inline-block",
  padding: "2px 10px",
  background: bg || `color-mix(in srgb, ${color} 15%, transparent)`,
  color,
  borderRadius: "var(--radius-pill)",
  fontSize: "var(--font-sm)",
  fontWeight: "var(--weight-semibold)",
  border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
});

/* ── Icon well (pastel-aware) ────────────────────────────────────── */
// color-mix() here too, same reason as pill() above — works with both hex and var() inputs.
export const iconWell = (color = "var(--primary)", size = 36, extraStyle = {}) => ({
  width: size, height: size, borderRadius: Math.round(size * 0.28),
  background: `color-mix(in srgb, ${color} 22%, transparent)`,
  color,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: size * 0.44, flexShrink: 0,
  ...extraStyle,
});

/* ── Modal title ─────────────────────────────────────────────────── */
export const modalTitle = (icon, title, subtitle) =>
  React.createElement(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "var(--space-3)" } },
    React.createElement("div", { style: iconWell("var(--primary)", 36) }, icon),
    React.createElement(
      "div",
      null,
      React.createElement("div", { style: { fontWeight: "var(--weight-bold)", fontSize: "var(--font-lg)", color: "var(--text-primary)" } }, title),
      subtitle
        ? React.createElement("div", { style: { fontSize: "var(--font-sm)", color: "var(--text-muted)", fontWeight: 400 } }, subtitle)
        : null
    )
  );
