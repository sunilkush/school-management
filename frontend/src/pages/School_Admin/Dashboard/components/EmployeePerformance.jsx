import React, { useState } from "react";
import { Select, Typography, Avatar, Grid } from "antd";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const performanceConfig = {
  EXCELLENT: { color: "#0ea472", bg: "rgba(14,164,114,0.08)", border: "rgba(14,164,114,0.2)", dot: "#0ea472" },
  GOOD:      { color: "#1677ff", bg: "rgba(22,119,255,0.08)", border: "rgba(22,119,255,0.2)", dot: "#1677ff" },
  AVERAGE:   { color: "#ea580c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.2)",  dot: "#ea580c" },
  POOR:      { color: "#EF4444", bg: "rgba(217,107,122,0.08)",border: "rgba(217,107,122,0.2)",dot: "#EF4444" },
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
  const { isDark } = useTheme();
  const screens    = useBreakpoint();
  const isMobile   = !screens.md;

  const [period, setPeriod] = useState("lastMonth");

  const list = employees.length
    ? employees
    : [{ name: "No records", email: "-", designation: "-", performance: "AVERAGE", dept: "-", avatar: null }];

  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const cardBg  = isDark ? "#141414" : "#ffffff";
  const rowSep  = isDark ? "#1a1a1a" : "#f5f5f5";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#8c8c8c" : "#6b7280";

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
              background: isDark ? "#1a1a2e" : "#f9fafb",
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: "12px 14px",
            }}>
              {/* Row 1: Avatar + Name + Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Avatar src={emp.avatar} size={38}
                  style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", flexShrink: 0 }}>
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
                  background: isDark ? "#1f2937" : "#eef2ff",
                  border: `1px solid ${isDark ? "#2a3550" : "#e0e7ff"}`,
                  borderRadius: 6, padding: "2px 8px",
                }}>
                  {emp.dept}
                </span>
                <span style={{
                  fontSize: 11, color: textSec,
                  background: isDark ? "#1f2937" : "#f0fdf4",
                  border: `1px solid ${isDark ? "#2a3550" : "#bbf7d0"}`,
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
