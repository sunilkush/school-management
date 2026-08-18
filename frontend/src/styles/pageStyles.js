import React from "react";

/**
 * Shared style patterns for all pages.
 * All colours come from CSS variables defined in index.css so dark-mode
 * works automatically.  Do NOT use raw hex values here.
 */

/* ── Page shell ──────────────────────────────────────────────────── */
export const pageWrapper = {
  minHeight: "100vh",
  background: "var(--surface-page)",
  padding: "clamp(12px, 3vw, 24px)",
};

/* ── Responsive stat-card grid ───────────────────────────────────── */
/**
 * statGrid(minColPx?) — returns an inline style for a responsive grid.
 * Pair with className="stat-grid" to also get the CSS media-query fallback.
 * minColPx defaults to 150 → collapses to 2 cols at ~360px, 4+ on desktop.
 */
export const statGrid = (minColPx = 150) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColPx}px, 1fr))`,
  gap: 14,
  marginBottom: 20,
});

/* ── Main content card ───────────────────────────────────────────── */
export const pageCard = {
  background: "var(--surface)",
  borderRadius: 18,
  border: "1px solid var(--border-muted)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

/* ── Section panel inside a page ────────────────────────────────── */
export const sectionPanel = {
  background: "var(--surface)",
  border: "1px solid var(--border-muted)",
  borderRadius: 14,
  padding: 20,
  marginBottom: 20,
};

/* ── Toolbar row (search + filters + action buttons) ────────────── */
export const toolbarRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
  flexWrap: "wrap",
};

/* ── Table container ─────────────────────────────────────────────── */
export const tableContainer = {
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--border-muted)",
};

/* ── Table header CSS (inject via <style>) ───────────────────────── */
export const tableHeadCss = (cls) => `
  .${cls} .ant-table { background: transparent !important; }
  .${cls} .ant-table-thead > tr > th {
    background: var(--surface-soft) !important;
    color: var(--text-muted) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    border-bottom: 1px solid var(--border-muted) !important;
    padding: 12px 16px !important;
  }
  .${cls} .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--border-muted) !important;
    padding: 13px 16px !important;
    color: var(--text-primary) !important;
  }
  .${cls} .ant-table-tbody > tr:hover > td {
    background: var(--surface-soft) !important;
  }
  .${cls} .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .${cls} .ant-pagination-item-active { border-color: var(--primary) !important; }
  .${cls} .ant-pagination-item-active a { color: var(--primary) !important; }
`;

/* ── KPI stat card (pastel design) ──────────────────────────────── */
export const statCard = ({ color, bg, accentBar }) => ({
  padding: "18px 20px",
  background: bg || "var(--surface)",
  borderRadius: 16,
  border: "1px solid var(--border)",
  borderLeft: `4px solid ${accentBar || color}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
});

export const statLabel = () => ({
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 4,
});

export const statValue = () => ({
  fontSize: 26,
  fontWeight: 800,
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
    fontWeight: 700, fontSize: Math.round(size * 0.35),
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
  display: "inline-flex", alignItems: "center", gap: 6,
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
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 600,
  border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
});

/* ── Empty state ─────────────────────────────────────────────────── */
export const emptyState = {
  textAlign: "center",
  padding: "56px 24px",
  border: "1.5px dashed var(--border-color)",
  borderRadius: 16,
  background: "var(--surface-soft)",
};

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
    { style: { display: "flex", alignItems: "center", gap: 12 } },
    React.createElement("div", { style: iconWell("var(--primary)", 36) }, icon),
    React.createElement(
      "div",
      null,
      React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--text-primary)" } }, title),
      subtitle
        ? React.createElement("div", { style: { fontSize: 12, color: "var(--text-muted)", fontWeight: 400 } }, subtitle)
        : null
    )
  );
