import React from "react";
import { pill } from "../../styles/pageStyles";

// Shared by EntryRegister.jsx and GateLogs.jsx (both render the same "Inside/Exited" gate-entry
// status badge and visitor-initials avatar).
export const ENTRY_STATUS_COLORS = {
  Inside: { color: "var(--success)", bg: "rgba(var(--success-rgb), 0.5)" },
  Exited: { color: "var(--text-secondary)", bg: "var(--surface-soft)" },
};

export const EntryStatusBadge = ({ status }) => {
  const s = ENTRY_STATUS_COLORS[status] || ENTRY_STATUS_COLORS.Exited;
  return <span style={pill(s.color, s.bg)}>{status}</span>;
};

export const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

// Shared by SecurityDashboard.jsx (active-alerts list) and EmergencyAlerts.jsx (SeverityBadge).
export const severityColor = (s) => (s === "High" ? "var(--danger-hover)" : s === "Medium" ? "var(--warning-hover)" : "var(--success)");
