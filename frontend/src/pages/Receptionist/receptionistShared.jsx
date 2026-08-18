import React from "react";
import { Button } from "antd";
import { RefreshCw } from "lucide-react";
import { statCard, statLabel, statValue } from "../../styles/pageStyles";
import { categoricalColorFor } from "../../utils/colorPalette";

// Shared across ReceptionistDashboard/VisitorManagement (visitor entry-time formatting) and
// CallLog/Broadcasts (full date+time formatting).
export const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
export const fmtFull = (d) => d ? new Date(d).toLocaleString() : "—";

// Shared by ReceptionistDashboard, VisitorManagement, Enquiries, CallLog (avatar initials bubble).
export function Avatar({ name = "?", color = "var(--purple)" }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: `color-mix(in srgb, ${color} 9%, transparent)`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 13,
    }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}

// Shared by all 5 Receptionist pages (KPI card).
export function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div style={statCard({ color, bg: "var(--surface)", accentBar: color })}>
      <div>
        <div style={statLabel(color)}>{label}</div>
        <div style={statValue(color)}>{loading ? "…" : (value ?? 0)}</div>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {Icon && <Icon size={20} color={color} strokeWidth={1.8} />}
      </div>
    </div>
  );
}

// Shared by all 5 Receptionist pages (header refresh action).
export function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9,
      border: "1px solid var(--border-muted)",
      background: "var(--surface)", color: "var(--text-muted)",
      cursor: "pointer", fontSize: 13, fontWeight: 500,
    }}>
      <RefreshCw size={14} strokeWidth={2} /> Refresh
    </button>
  );
}

// Shared by VisitorManagement, Enquiries, CallLog, Broadcasts (header primary CTA button).
export function PrimaryBtn({ icon: Icon, onClick, loading, children }) {
  return (
    <Button
      type="primary"
      icon={Icon ? <Icon size={14} strokeWidth={2.2} /> : undefined}
      onClick={onClick}
      loading={loading}
      style={{ borderRadius: 9, fontWeight: 600 }}
    >
      {children}
    </Button>
  );
}

// Shared by ReceptionistDashboard and VisitorManagement (visitor-type badge colors).
export const VISITOR_COLORS = {
  Visitor: categoricalColorFor("Visitor"),
  Parent: categoricalColorFor("Parent"),
  Vendor: categoricalColorFor("Vendor"),
  Contractor: categoricalColorFor("Contractor"),
  Other: categoricalColorFor("Other"),
};
