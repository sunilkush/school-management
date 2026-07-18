import React from "react";
import { iconWell } from "../../styles/pageStyles";

// Shared by PayrollSummaryCards and MonthlyPayrollReportCards — both used to define this
// same stat-card markup independently, which had drifted slightly (one lacked the `sub`
// line). Single implementation now; either caller can pass `sub` or omit it.
const PayrollStatCard = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: "var(--surface)", borderRadius: 14,
    border: "1px solid var(--border-muted)",
    borderLeft: `4px solid ${color}`,
    padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: "var(--text-primary)",
        lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>
      )}
    </div>
  </div>
);

export default PayrollStatCard;
