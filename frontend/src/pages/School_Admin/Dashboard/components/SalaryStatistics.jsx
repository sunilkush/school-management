import React, { useState } from "react";
import { Select, Typography } from "antd";

const { Text } = Typography;
const { Option } = Select;

const SalaryStatistics = ({ stats = [] }) => {
  const [period, setPeriod] = useState("lastMonth");

  const dynamicStats = stats.length
    ? stats
    : [
        { title: "Teaching", value: 0, color: "var(--primary)" },
        { title: "Administration", value: 0, color: "var(--accent)" },
      ];

  const maxValue = Math.max(...dynamicStats.map((s) => s.value), 1);
  const cardBg = "var(--surface)";
  const border = "var(--border)";
  const textPri = "var(--text)";
  const textSec = "var(--text-muted)";
  const trackBg = "var(--border-muted)";

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
              <Text style={{ fontSize: 13, fontWeight: 700, color: item.color }}>₹{Math.round(item.value).toLocaleString("en-IN")}</Text>
              <div style={{ width: "100%", height: 120, background: trackBg, borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                <div style={{ width: "100%", height: `${pct}%`, background: item.color }} />
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
