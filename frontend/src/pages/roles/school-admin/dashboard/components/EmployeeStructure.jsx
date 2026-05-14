import React from "react";
import { Typography } from "antd";
import { useTheme } from "../../../../../context/ThemeContext";

const { Text } = Typography;

const DonutChart = ({ data, isDark }) => {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const stroke = 16;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = data.map((d) => {
    const dash = ((d.percent || 0) / 100) * circ;
    const seg = { ...d, dashArray: `${dash - 2} ${circ - dash + 2}`, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? "#1f1f1f" : "#f3f4f6"} strokeWidth={stroke} />
      {segments.map((seg) => (
        <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={stroke} strokeDasharray={seg.dashArray} strokeDashoffset={-seg.offset} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
    </svg>
  );
};

const EmployeeStructure = ({ data = [] }) => {
  const { isDark } = useTheme();
  const structureData = data.length ? data : [{ label: "Students", count: 0, color: "#1677ff" }];
  const total = structureData.reduce((s, d) => s + d.count, 0);
  const withPercent = structureData.map((d) => ({ ...d, percent: total ? Math.round((d.count / total) * 100) : 0 }));

  return (
    <div style={{ background: isDark ? "#141414" : "#ffffff", border: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`, borderRadius: 14, padding: "20px 20px 16px", height: "100%" }}>
      <Text style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#e8e8e8" : "#111827", display: "block" }}>School Structure</Text>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", margin: "20px 0" }}>
        <DonutChart data={withPercent} isDark={isDark} />
        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: 800, color: isDark ? "#e8e8e8" : "#111827" }}>{total.toLocaleString()}</Text>
          <Text style={{ fontSize: 10, color: isDark ? "#6b7280" : "#9ca3af" }}>Total Users</Text>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStructure;
