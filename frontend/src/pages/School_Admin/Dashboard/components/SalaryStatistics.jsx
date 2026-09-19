import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

const SalaryStatistics = ({ stats = [] }) => {
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
          {/* A "Last month / This month" picker used to sit here. It set state nothing read, so the
              numbers never changed — removed rather than left looking like a working filter. */}
          <Text style={{ fontSize: 12, color: textSec }}>Paid salaries, by department</Text>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 12, marginBottom: 16 }}>
        {dynamicStats.map((item) => {
          const pct = Math.round((item.value / maxValue) * 100);
          return (
            <div key={item.title} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: item.color }}>₹{Math.round(item.value).toLocaleString("en-IN")}</Text>
              {/* The bar sits on a baseline instead of filling a grey track: a half-filled track
                  read as if the grey part were a second, larger value. */}
              <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end", borderBottom: `1px solid ${trackBg}` }}>
                <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, background: item.color, borderRadius: "8px 8px 0 0" }} />
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
