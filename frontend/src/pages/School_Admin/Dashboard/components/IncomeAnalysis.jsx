import React, { useState } from "react";
import { Typography } from "antd";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CATEGORICAL_COLORS } from "../../../../utils/colorPalette";

const { Text } = Typography;

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{d.label}</Text>
      </div>
      <Text style={{ fontSize: 18, fontWeight: 800, color: d.color, display: "block" }}>
        ₹{Number(d.value || 0).toLocaleString("en-IN")}
      </Text>
    </div>
  );
};

const renderLegend = ({ payload }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", marginTop: 8 }}>
    {payload.map((entry) => (
      <div key={entry.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
        <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>{entry.value}</Text>
      </div>
    ))}
  </div>
);

const IncomeAnalysis = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const incomeData = (data.length ? data : [
    { label: "Cash", value: 0, color: "var(--primary)" },
    { label: "Online", value: 0, color: "var(--success)" },
  ]).map((d, i) => ({
    ...d,
    color: d.color || CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
    name: d.label,
  }));

  const total = incomeData.reduce((sum, d) => sum + (d.value || 0), 0);

  const cardBg = "var(--surface)";
  const border  = "var(--border)";
  const textPri = "var(--text)";
  const textSec = "var(--text-muted)";

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
              label={<CustomLabel />}
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
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
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
