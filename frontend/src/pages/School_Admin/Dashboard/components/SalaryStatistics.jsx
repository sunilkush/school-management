import React, { useState } from "react";
import { Select, Typography } from "antd";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { Option } = Select;

const SalaryStatistics = ({ stats = [] }) => {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("lastMonth");

  const dynamicStats = stats.length
    ? stats
    : [
        { title: "Teaching", value: 0, color: "#1677ff" },
        { title: "Administration", value: 0, color: "#9B87B8" },
      ];

  const maxValue = Math.max(...dynamicStats.map((s) => s.value), 1);
  const cardBg = isDark ? "#141414" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";
  const trackBg = isDark ? "#1f1f1f" : "#f3f4f6";

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 20px 16px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>Salary Statistics</Text>
          <Text style={{ fontSize: 12, color: textSec }}>By department</Text>
        </div>
        <Select value={period} onChange={setPeriod} size="small" style={{ width: 120 }} bordered={false}>
          <Option value="lastMonth">Last Month</Option>
          <Option value="thisMonth">This Month</Option>
        </Select>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 12, marginBottom: 16 }}>
        {dynamicStats.map((item) => {
          const pct = Math.round((item.value / maxValue) * 100);
          return (
            <div key={item.title} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: item.color }}>${Math.round(item.value).toLocaleString()}</Text>
              <div style={{ width: "100%", height: 120, background: trackBg, borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                <div style={{ width: "100%", height: `${pct}%`, background: `linear-gradient(180deg, ${item.color}cc 0%, ${item.color} 100%)` }} />
              </div>
              <Text style={{ fontSize: 11.5, color: textSec, fontWeight: 500 }}>{item.title}</Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalaryStatistics;
