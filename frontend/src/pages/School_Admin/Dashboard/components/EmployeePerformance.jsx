import React, { useState } from "react";
import { Select, Typography, Avatar, Grid } from "antd";

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const performanceConfig = {
  EXCELLENT: { color: "var(--success)", bg: "rgba(var(--success-rgb), 0.08)", border: "rgba(var(--success-rgb), 0.2)", dot: "var(--success)" },
  GOOD:      { color: "var(--primary)", bg: "rgba(var(--primary-rgb), 0.08)", border: "rgba(var(--primary-rgb), 0.2)", dot: "var(--primary)" },
  // no --orange-rgb token exists in index.css; decimal rgba kept for the bg/border tint
  AVERAGE:   { color: "var(--orange)", bg: "rgba(234, 88, 12, 0.08)",  border: "rgba(234, 88, 12, 0.2)",  dot: "var(--orange)" },
  POOR:      { color: "var(--danger)", bg: "rgba(var(--danger-rgb), 0.08)",border: "rgba(var(--danger-rgb), 0.2)",dot: "var(--danger)" },
};

const PerfBadge = ({ value }) => {
  const perf = performanceConfig[value] ?? performanceConfig.AVERAGE;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600,
      color: perf.color, background: perf.bg,
      border: `1px solid ${perf.border}`,
      padding: "3px 9px", borderRadius: 99,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: perf.dot }} />
      {value}
    </span>
  );
};

const EmployeePerformance = ({ employees = [] }) => {
  const screens    = useBreakpoint();
  const isMobile   = !screens.md;

  const [period, setPeriod] = useState("lastMonth");

  const list = employees.length
    ? employees
    : [{ name: "No records", email: "-", designation: "-", performance: "AVERAGE", dept: "-", avatar: null }];

  const border  = "var(--border)";
  const cardBg  = "var(--surface)";
  const rowSep  = "var(--border-muted)";
  const textPri = "var(--text)";
  const textSec = "var(--text-secondary)";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 20px 8px",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: textPri }}>
          Teacher Performance
        </Text>
        <Select value={period} onChange={setPeriod} size="small" style={{ width: 120 }} bordered={false}>
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
        </Select>
      </div>

      {/* ── MOBILE: Card list ── */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((emp) => (
            <div key={emp.email} style={{
              background: "var(--surface-soft)",
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: "12px 14px",
            }}>
              {/* Row 1: Avatar + Name + Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Avatar src={emp.avatar} size={38}
                  style={{ background: "linear-gradient(135deg, var(--purple), var(--cyan))", flexShrink: 0 }}>
                  {emp?.name?.[0] || "E"}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: textPri,
                    display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {emp.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: textSec,
                    display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {emp.email}
                  </Text>
                </div>
                <PerfBadge value={emp.performance} />
              </div>

              {/* Row 2: Dept + Designation chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 11, color: textSec,
                  background: "var(--primary-light)",
                  border: "1px solid rgba(var(--primary-rgb), 0.3)",
                  borderRadius: 6, padding: "2px 8px",
                }}>
                  {emp.dept}
                </span>
                <span style={{
                  fontSize: 11, color: textSec,
                  background: "var(--success-light)",
                  border: "1px solid rgba(var(--success-rgb), 0.3)",
                  borderRadius: 6, padding: "2px 8px",
                }}>
                  {emp.designation}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── DESKTOP: Table ── */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Employee", "Department", "Designation", "Performance"].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, color: textSec, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((emp) => (
                <tr key={emp.email} style={{ borderBottom: `1px solid ${rowSep}` }}>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={emp.avatar} size={34}>{emp?.name?.[0] || "E"}</Avatar>
                      <div>
                        <Text style={{ fontSize: 13, color: textPri }}>{emp.name}</Text>
                        <br />
                        <Text style={{ fontSize: 11, color: textSec }}>{emp.email}</Text>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px", width: 160 }}>
                    <Text style={{ fontSize: 12, color: textSec }}>{emp.dept}</Text>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Text style={{ fontSize: 12.5, color: textSec }}>{emp.designation}</Text>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <PerfBadge value={emp.performance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformance;
