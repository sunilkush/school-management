import React from "react";
import { sectionPanel, statGrid, iconWell } from "../../styles/pageStyles";

/**
 * StatCardsRow — the KPI-cards row used at the top of most list/report pages
 * (total/active/inactive-style counters). Generalises the local `StatCard`
 * pattern hand-copied across pages like UserRoleList.jsx and FeeReports.jsx.
 *
 * Props:
 *  items      Array<{ key?, icon, label, value, color }> — one card per entry (required)
 *  minColPx   number   — passed straight through to statGrid's responsive column width
 *  style      object   — merged onto the outer grid container
 */
const StatCardsRow = ({ items = [], minColPx = 150, style }) => (
  <div style={{ ...statGrid(minColPx), marginTop: 20, ...style }}>
    {items.map(({ key, icon, label, value, color }) => (
      <div
        key={key ?? label}
        style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}
      >
        <div style={iconWell(color, 42)}>{icon}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
        </div>
      </div>
    ))}
  </div>
);

export default StatCardsRow;
