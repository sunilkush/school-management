import React, { useState } from "react";
import { Typography } from "antd";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, isDark }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: isDark ? "#1f2937" : "#ffffff",
      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
        <Text style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280", fontWeight: 600 }}>{d.label}</Text>
      </div>
      <Text style={{ fontSize: 18, fontWeight: 800, color: d.color, display: "block" }}>
        ₹{Number(d.value || 0).toLocaleString("en-IN")}
      </Text>
    </div>
  );
};

const renderLegend = ({ payload, isDark }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", marginTop: 8 }}>
    {payload.map((entry) => (
      <div key={entry.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
        <Text style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}>{entry.value}</Text>
      </div>
    ))}
  </div>
);

const IncomeAnalysis = ({ data = [] }) => {
  const { isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(null);

  const DEFAULT_COLORS = ["#1677ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2"];

  const incomeData = (data.length ? data : [
    { label: "Cash", value: 0, color: "#1677ff" },
    { label: "Online", value: 0, color: "#52c41a" },
  ]).map((d, i) => ({
    ...d,
    color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    name: d.label,
  }));

  const total = incomeData.reduce((sum, d) => sum + (d.value || 0), 0);

  const cardBg = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 16px 16px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>Income Analysis</Text>
        <Text style={{ fontSize: 12, color: textSec }}>By payment mode</Text>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 200, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={incomeData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              dataKey="value"
              nameKey="label"
              labelLine={false}
              label={<CustomLabel isDark={isDark} />}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {incomeData.map((entry, i) => (
                <Cell
                  key={entry.label}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                  style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend content={(props) => renderLegend({ ...props, isDark })} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -58%)",
          pointerEvents: "none",
          textAlign: "center",
        }}>
          <Text style={{ fontSize: 16, fontWeight: 800, color: textPri, lineHeight: 1, display: "block" }}>
            ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString("en-IN")}
          </Text>
          <Text style={{ fontSize: 10, color: textSec }}>total</Text>
        </div>
      </div>
    </div>
  );
};

export default IncomeAnalysis;
