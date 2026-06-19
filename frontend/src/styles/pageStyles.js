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
  background: bg || "#ffffff",
  borderRadius: 16,
  border: "1px solid var(--border)",
  borderLeft: `4px solid ${accentBar || color}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
});

export const statLabel = (color) => ({
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 4,
});

export const statValue = (color) => ({
  fontSize: 26,
  fontWeight: 800,
  color: "var(--text)",
  lineHeight: 1.1,
});

/* ── Avatar initials palette ────────────────────────────────────── */
const PALETTE = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#CCFBF1", color: "#0D9488" },
  { bg: "#DCFCE7", color: "#15803D" },
  { bg: "#FEE2E2", color: "#DC2626" },
  { bg: "#FEF3C7", color: "#B45309" },
  { bg: "#EDE9FE", color: "#6D28D9" },
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
  active:    { dot: "#22C55E", text: "#15803D", bg: "rgba(220,252,231,0.5)",  border: "rgba(34,197,94,0.3)"  },
  inactive:  { dot: "#94A3B8", text: "#64748B", bg: "rgba(241,245,249,0.6)",  border: "rgba(148,163,184,0.4)" },
  pending:   { dot: "#F59E0B", text: "#B45309", bg: "rgba(254,243,199,0.5)",  border: "rgba(245,158,11,0.3)" },
  overdue:   { dot: "#EF4444", text: "#DC2626", bg: "rgba(254,226,226,0.5)",  border: "rgba(239,68,68,0.3)"  },
  suspended: { dot: "#8B5CF6", text: "#6D28D9", bg: "rgba(237,233,254,0.5)",  border: "rgba(139,92,246,0.3)" },
  paid:      { dot: "#22C55E", text: "#15803D", bg: "rgba(220,252,231,0.5)",  border: "rgba(34,197,94,0.3)"  },
  unpaid:    { dot: "#EF4444", text: "#DC2626", bg: "rgba(254,226,226,0.5)",  border: "rgba(239,68,68,0.3)"  },
  partial:   { dot: "#F59E0B", text: "#B45309", bg: "rgba(254,243,199,0.5)",  border: "rgba(245,158,11,0.3)" },
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

/* ── Icon well (pastel-aware) ────────────────────────────────────── */
export const iconWell = (color = "var(--primary)", size = 36, extraStyle = {}) => ({
  width: size, height: size, borderRadius: Math.round(size * 0.28),
  background: `${color}22`,
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
