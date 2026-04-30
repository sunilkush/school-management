import React, { useState } from "react";
import { Select, Typography, Avatar } from "antd";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;

const performanceConfig = {
  EXCELLENT: { color: "#0ea472", bg: "rgba(14,164,114,0.08)", border: "rgba(14,164,114,0.2)", dot: "#0ea472" },
  GOOD: { color: "#1677ff", bg: "rgba(22,119,255,0.08)", border: "rgba(22,119,255,0.2)", dot: "#1677ff" },
  AVERAGE: { color: "#ea580c", bg: "rgba(234,88,12,0.08)", border: "rgba(234,88,12,0.2)", dot: "#ea580c" },
  POOR: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", dot: "#dc2626" },
};

const EmployeePerformance = ({ employees = [] }) => {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("lastMonth");
  const list = employees.length
    ? employees
    : [{ name: "No records", email: "-", designation: "-", performance: "AVERAGE", dept: "-", avatar: null }];

  return (
    <div style={{ background: isDark ? "#141414" : "#ffffff", border: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`, borderRadius: 14, padding: "20px 20px 8px", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#e8e8e8" : "#111827", display: "block" }}>Teacher Performance</Text>
        </div>
        <Select value={period} onChange={setPeriod} size="small" style={{ width: 120 }} bordered={false}>
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
        </Select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Employee", "Department", "Designation", "Performance"].map((h) => <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map((emp) => {
              const perf = performanceConfig[emp.performance] ?? performanceConfig.AVERAGE;
              return (
                <tr key={emp.email} style={{ borderBottom: `1px solid ${isDark ? "#1a1a1a" : "#f5f5f5"}` }}>
                  <td style={{ padding: "12px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar src={emp.avatar} size={34}>{emp?.name?.[0] || "E"}</Avatar><div><Text style={{ fontSize: 13 }}>{emp.name}</Text><br /><Text style={{ fontSize: 11 }}>{emp.email}</Text></div></div></td>
                  <td style={{ padding: "12px",width:"200px" }}><Text style={{ fontSize: 12 }}>{emp.dept}</Text></td>
                  <td style={{ padding: "12px" }}><Text style={{ fontSize: 12.5 }}>{emp.designation}</Text></td>
                  <td style={{ padding: "12px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: perf.color, background: perf.bg, border: `1px solid ${perf.border}`, padding: "3px 9px", borderRadius: 99 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: perf.dot }} />{emp.performance}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePerformance;
