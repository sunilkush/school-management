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
  padding: "24px",
};

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

/* ── KPI stat card ───────────────────────────────────────────────── */
export const statCard = ({ color, bg }) => ({
  padding: "16px 20px",
  background: bg || `${color}12`,
  borderRadius: 14,
  border: `1px solid ${color}22`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const statLabel = (color) => ({
  fontSize: 11,
  fontWeight: 700,
  color,
  opacity: 0.8,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
});

export const statValue = (color) => ({
  fontSize: 26,
  fontWeight: 800,
  color,
  lineHeight: 1,
});

/* ── Avatar initials ─────────────────────────────────────────────── */
const PALETTE = [
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#d1fae5", color: "#059669" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#e0f2fe", color: "#0284c7" },
  { bg: "#fef9ec", color: "#f97316" },
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
    flexShrink: 0, border: `2px solid ${color}30`,
  };
};

/* ── Status dot + text ───────────────────────────────────────────── */
export const STATUS = {
  active:    { dot: "#22c55e", text: "#15803d", bg: "#f0fdf4" },
  inactive:  { dot: "#94a3b8", text: "#64748b", bg: "#f8fafc" },
  pending:   { dot: "#f59e0b", text: "#92400e", bg: "#fffbeb" },
  overdue:   { dot: "#ef4444", text: "#991b1b", bg: "#fff1f2" },
  suspended: { dot: "#6b7280", text: "#374151", bg: "#f9fafb" },
};

export const statusDot = (key = "active") => {
  const s = STATUS[key] || STATUS.active;
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
  };
};

/* ── Pill tag ────────────────────────────────────────────────────── */
export const pill = (color, bg) => ({
  display: "inline-block",
  padding: "2px 10px",
  background: bg || `${color}15`,
  color,
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 600,
  border: `1px solid ${color}25`,
});

/* ── Empty state ─────────────────────────────────────────────────── */
export const emptyState = {
  textAlign: "center",
  padding: "56px 24px",
  border: "1.5px dashed var(--border-color)",
  borderRadius: 16,
  background: "var(--surface-soft)",
};

/* ── Icon well ───────────────────────────────────────────────────── */
export const iconWell = (color = "var(--primary)", size = 36) => ({
  width: size, height: size, borderRadius: 10,
  background: `${color}15`,
  color,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: size * 0.44, flexShrink: 0,
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
