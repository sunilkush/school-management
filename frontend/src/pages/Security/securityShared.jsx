import React from "react";
import { pill } from "../../styles/pageStyles";

// Shared by EntryRegister.jsx and GateLogs.jsx (both render the same "Inside/Exited" gate-entry
// status badge and visitor-initials avatar).
export const ENTRY_STATUS_COLORS = {
  Inside: { color: "#16A34A", bg: "rgba(220,252,231,0.5)" },
  Exited: { color: "#64748B", bg: "var(--surface-soft)" },
};

export const EntryStatusBadge = ({ status }) => {
  const s = ENTRY_STATUS_COLORS[status] || ENTRY_STATUS_COLORS.Exited;
  return <span style={pill(s.color, s.bg)}>{status}</span>;
};

export const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

// Shared by SecurityDashboard.jsx (active-alerts list) and EmergencyAlerts.jsx (SeverityBadge).
export const severityColor = (s) => (s === "High" ? "#DC2626" : s === "Medium" ? "#D97706" : "#16A34A");
