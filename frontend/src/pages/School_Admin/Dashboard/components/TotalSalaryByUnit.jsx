import React, { useState } from "react";
import { Typography, Space } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const chartData = [
  { month: "Jan", Sales: 60,  Marketing: 60  },
  { month: "Feb", Sales: 50,  Marketing: 40  },
  { month: "Mar", Sales: 60,  Marketing: 50  },
  { month: "Apr", Sales: 70,  Marketing: 30  },
  { month: "May", Sales: 60,  Marketing: 50  },
  { month: "Jun", Sales: 80,  Marketing: 45  },
  { month: "Jul", Sales: 60,  Marketing: 35  },
  { month: "Aug", Sales: 70,  Marketing: 55  },
  { month: "Sep", Sales: 80,  Marketing: 50  },
  { month: "Oct", Sales: 60,  Marketing: 40  },
  { month: "Nov", Sales: 75,  Marketing: 45  },
];

const UNITS = [
  { key: "Sales",     color: "#1677ff", label: "Sales" },
  { key: "Marketing", color: "#7c3aed", label: "Marketing" },
];

const CustomTooltip = ({ active, payload, label, isDark, color }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? "#1f1f1f" : "#ffffff",
      border: `1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <Text style={{ fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>{label}</Text>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
        {payload[0]?.value}k
      </div>
    </div>
  );
};

const TotalSalaryByUnit = () => {
  const { isDark } = useTheme();
  const [selected, setSelected] = useState("Sales");

  const unit = UNITS.find((u) => u.key === selected);
  const cardBg  = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const gridCol = isDark ? "#1f1f1f" : "#f3f4f6";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";
  const axisCol = isDark ? "#4b5563" : "#d1d5db";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 20px 16px",
    }}>
      <style>{`
        .unit-tab {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          border: 1px solid transparent;
          background: transparent;
        }
        .unit-tab:hover { opacity: 0.8; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>
            Salary by Unit
          </Text>
          <Text style={{ fontSize: 12, color: textSec }}>Monthly distribution</Text>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {UNITS.map((u) => {
            const active = selected === u.key;
            return (
              <button
                key={u.key}
                className="unit-tab"
                onClick={() => setSelected(u.key)}
                style={{
                  color:      active ? u.color : textSec,
                  background: active ? (isDark ? `${u.color}15` : `${u.color}10`) : "transparent",
                  border:     `1px solid ${active ? `${u.color}40` : (isDark ? "#2a2a2a" : "#e5e7eb")}`,
                }}
              >
                {u.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barSize={22} margin={{ left: -10, right: 4 }}>
          <CartesianGrid vertical={false} stroke={gridCol} strokeDasharray="0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: axisCol }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: axisCol }}
            tickFormatter={(v) => `${v}k`}
          />
          <Tooltip
            cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }}
            content={<CustomTooltip isDark={isDark} color={unit.color} />}
          />
          <Bar dataKey={unit.key} radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={unit.color}
                opacity={0.55 + (entry[unit.key] / 100) * 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: unit.color }} />
        <Text style={{ fontSize: 11, color: textSec }}>{unit.label} salary · 2024</Text>
      </div>
    </div>
  );
};

export default TotalSalaryByUnit;