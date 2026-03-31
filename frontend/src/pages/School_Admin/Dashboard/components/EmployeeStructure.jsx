import React from "react";
import { Typography } from "antd";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const structureData = [
  { label: "Students", count: 12300, percent: 65, color: "#1677ff" },
  { label: "Teachers",  count: 1280,  percent: 30, color: "#7c3aed" },
  { label: "Staff",     count: 420,   percent: 5,  color: "#0ea472" },
];

const total = structureData.reduce((s, d) => s + d.count, 0);

// SVG donut
const DonutChart = ({ data, isDark }) => {
  const size   = 140;
  const cx     = size / 2;
  const cy     = size / 2;
  const r      = 52;
  const stroke = 16;
  const circ   = 2 * Math.PI * r;

  let offset = 0;
  const segments = data.map((d) => {
    const dash  = (d.percent / 100) * circ;
    const seg   = { ...d, dashArray: `${dash - 2} ${circ - dash + 2}`, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={isDark ? "#1f1f1f" : "#f3f4f6"}
        strokeWidth={stroke}
      />
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={-seg.offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "all 0.6s ease" }}
        />
      ))}
    </svg>
  );
};

const EmployeeStructure = () => {
  const { isDark } = useTheme();

  const cardBg  = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";
  const trackBg = isDark ? "#1f1f1f" : "#f3f4f6";

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
          School Structure
        </Text>
        <Text style={{ fontSize: 12, color: textSec }}>People distribution</Text>
      </div>

      {/* Donut + centre */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginBottom: 20,
      }}>
        <DonutChart data={structureData} isDark={isDark} />
        <div style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 20, fontWeight: 800, color: textPri, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {(total / 1000).toFixed(1)}k
          </Text>
          <Text style={{ fontSize: 10, color: textSec, marginTop: 2 }}>Total Users</Text>
        </div>
      </div>

      {/* Breakdown rows */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        paddingTop: 16,
        borderTop: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
      }}>
        {structureData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <Text style={{ fontSize: 12, color: textSec }}>{item.label}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 11, color: textSec, fontVariantNumeric: "tabular-nums" }}>
                  {item.count.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: 700, color: item.color, minWidth: 30, textAlign: "right" }}>
                  {item.percent}%
                </Text>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: trackBg, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${item.percent}%`,
                background: `linear-gradient(90deg, ${item.color}80, ${item.color})`,
                borderRadius: 99,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeStructure;