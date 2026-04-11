import React from "react";
import { Typography } from "antd";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: isDark ? "#1f1f1f" : "#ffffff", border: `1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"}`, borderRadius: 10, padding: "8px 12px" }}>
      <Text style={{ fontSize: 11, color: isDark ? "#6b7280" : "#9ca3af" }}>{d.label}</Text>
      <div style={{ fontSize: 16, fontWeight: 700, color: d.fill, marginTop: 1 }}>{d.value}%</div>
    </div>
  );
};

const IncomeAnalysis = ({ data = [] }) => {
  const { isDark } = useTheme();
  const incomeData = data.length ? data : [{ label: "CASH", value: 0, color: "#1677ff" }];
  const total = incomeData.reduce((sum, d) => sum + d.value, 0);

  const cardBg = isDark ? "#141414" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 20px 16px", height: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: textPri, display: "block" }}>Income Analysis</Text>
        <Text style={{ fontSize: 12, color: textSec }}>By payment mode</Text>
      </div>
      <div style={{ position: "relative", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="45%" outerRadius="90%" data={incomeData.map((d) => ({ ...d, fill: d.color }))} startAngle={90} endAngle={-270} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: isDark ? "#1f1f1f" : "#f3f4f6" }} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Text style={{ fontSize: 22, fontWeight: 800, color: textPri, lineHeight: 1 }}>{total}%</Text>
          <Text style={{ fontSize: 11, color: textSec, marginTop: 2 }}>total</Text>
        </div>
      </div>
    </div>
  );
};

export default IncomeAnalysis;
