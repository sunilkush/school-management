import React from "react";
import { Typography } from "antd";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from "recharts";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const incomeData = [
  { label: "Design",      value: 55, color: "#1677ff" },
  { label: "Development", value: 25, color: "#0891b2" },
  { label: "SEO",         value: 20, color: "#0ea472" },
];

const total = incomeData.reduce((sum, d) => sum + d.value, 0);

const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: isDark ? "#1f1f1f" : "#ffffff",
      border: `1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"}`,
      borderRadius: 10,
      padding: "8px 12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <Text style={{ fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>{d.label}</Text>
      <div style={{ fontSize: 16, fontWeight: 700, color: d.fill, marginTop: 1 }}>{d.value}%</div>
    </div>
  );
};

const IncomeAnalysis = () => {
  const { isDark } = useTheme();

  const cardBg  = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";

  // Build cumulative arcs for the donut
  let cumulative = 0;
  const arcs = incomeData.map((d) => {
    const start = cumulative;
    cumulative += d.value;
    return { ...d, start, end: cumulative };
  });

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 20px 16px",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>
          Income Analysis
        </Text>
        <Text style={{ fontSize: 12, color: textSec }}>By service category</Text>
      </div>

      {/* Radial chart */}
      <div style={{ position: "relative", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="45%"
            outerRadius="90%"
            data={arcs.map((d) => ({ ...d, fill: d.color, uv: d.value }))}
            startAngle={90}
            endAngle={-270}
            barSize={14}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: isDark ? "#1f1f1f" : "#f3f4f6" }}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <Text style={{ fontSize: 22, fontWeight: 800, color: textPri, lineHeight: 1 }}>
            {total}%
          </Text>
          <Text style={{ fontSize: 11, color: textSec, marginTop: 2 }}>total</Text>
        </div>
      </div>

      {/* Legend rows */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 16,
        paddingTop: 16,
        borderTop: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
      }}>
        {incomeData.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Swatch */}
            <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
            <Text style={{ fontSize: 12, color: textSec, flex: 1 }}>{item.label}</Text>
            {/* Mini bar */}
            <div style={{ flex: 2, height: 4, borderRadius: 99, background: isDark ? "#1f1f1f" : "#f3f4f6", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${item.value}%`,
                background: item.color,
                borderRadius: 99,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: item.color, minWidth: 30, textAlign: "right" }}>
              {item.value}%
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeAnalysis;