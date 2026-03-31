import React, { useState } from "react";
import { Select, Typography } from "antd";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;

const stats = [
  { title: "Developer", value: 6000, color: "#1677ff" },
  { title: "Marketing", value: 3000, color: "#7c3aed" },
  { title: "Sales",     value: 2000, color: "#0ea472" },
];

const maxValue = Math.max(...stats.map((s) => s.value));

const SalaryStatistics = () => {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("lastMonth");

  const cardBg  = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";
  const trackBg = isDark ? "#1f1f1f" : "#f3f4f6";

  const barHeightMax = 120;

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "20px 20px 16px",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>
            Salary Statistics
          </Text>
          <Text style={{ fontSize: 12, color: textSec }}>By department</Text>
        </div>
        <Select
          value={period}
          onChange={setPeriod}
          size="small"
          style={{ width: 120 }}
          bordered={false}
          styles={{ popup: { root: { borderRadius: 10 } } }}
        >
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
          <Option value="lastWeek">Last Week</Option>
        </Select>
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 12, marginBottom: 16 }}>
        {stats.map((item) => {
          const pct    = Math.round((item.value / maxValue) * 100);
          const barH   = Math.round((pct / 100) * barHeightMax);

          return (
            <div
              key={item.title}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              {/* Value label */}
              <Text style={{ fontSize: 13, fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                {(item.value / 1000).toFixed(0)}k
              </Text>

              {/* Bar */}
              <div style={{
                width: "100%",
                height: barHeightMax,
                background: trackBg,
                borderRadius: 8,
                display: "flex",
                alignItems: "flex-end",
                overflow: "hidden",
                position: "relative",
              }}>
                {/* Subtle grid lines */}
                {[25, 50, 75].map((tick) => (
                  <div key={tick} style={{
                    position: "absolute",
                    bottom: `${tick}%`,
                    left: 0, right: 0,
                    height: 1,
                    background: isDark ? "#2a2a2a" : "#e5e7eb",
                  }} />
                ))}
                <div style={{
                  width: "100%",
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${item.color}cc 0%, ${item.color} 100%)`,
                  borderRadius: "6px 6px 0 0",
                  transition: "height 1s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative",
                  zIndex: 1,
                }} />
              </div>

              {/* Label */}
              <Text style={{ fontSize: 11.5, color: textSec, fontWeight: 500 }}>{item.title}</Text>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        paddingTop: 12,
        borderTop: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
      }}>
        {stats.map((item) => (
          <div key={item.title} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
            <Text style={{ fontSize: 11, color: textSec }}>{item.title}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalaryStatistics;