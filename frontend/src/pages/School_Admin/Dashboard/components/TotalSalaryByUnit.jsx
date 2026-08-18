import React, { useState } from "react";
import { Typography } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const CustomTooltip = ({ active, payload, label, color }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</Text>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginTop: 2 }}>₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}</div>
    </div>
  );
};

const TotalSalaryByUnit = ({ data }) => {
  const { isDark } = useTheme();
  const units = data?.units?.length
    ? data.units
    : [
        { key: "Teaching", color: "var(--primary)", label: "Teaching" },
        { key: "Administration", color: "var(--accent)", label: "Administration" },
      ];
  const chartData = data?.chartData?.length ? data.chartData : [{ month: "Jan", [units[0].key]: 0, [units[1].key]: 0 }];

  const [selected, setSelected] = useState(units[0].key);
  const unit = units.find((u) => u.key === selected) || units[0];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "block" }}>Salary by Unit</Text>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {units.map((u) => (
            <button key={u.key} onClick={() => setSelected(u.key)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12.5, border: `1px solid ${selected === u.key ? u.color : "var(--border)"}`, color: selected === u.key ? u.color : "var(--text-muted)", background: "transparent" }}>
              {u.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barSize={22} margin={{ left: -10, right: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border-muted)" strokeDasharray="0" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
          <Tooltip cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }} content={<CustomTooltip color={unit.color} />} />
          <Bar dataKey={unit.key} radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={unit.color} opacity={0.55 + ((entry[unit.key] || 0) / Math.max(...chartData.map((c) => c[unit.key] || 1), 1)) * 0.45} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalSalaryByUnit;
