import React from "react";
import { Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const colorMap = {
  blue:   { accent: "#2563EB", bg: "rgba(219,234,254,0.20)", glow: "rgba(219,234,254,0.25)", bar: "#DBEAFE" },
  purple: { accent: "#14B8A6", bg: "rgba(20,184,166,0.20)", glow: "rgba(20,184,166,0.25)", bar: "rgba(20,184,166,0.15)" },
  green:  { accent: "#22C55E", bg: "rgba(220,252,231,0.22)", glow: "rgba(220,252,231,0.28)", bar: "#DCFCE7" },
  orange: { accent: "#F59E0B", bg: "rgba(254,243,199,0.30)", glow: "rgba(254,243,199,0.38)", bar: "#FEF3C7" },
  teal:   { accent: "#22C55E", bg: "rgba(220,252,231,0.22)", glow: "rgba(220,252,231,0.28)", bar: "#DCFCE7" },
  pink:   { accent: "#EF4444", bg: "rgba(254,226,226,0.22)", glow: "rgba(254,226,226,0.28)", bar: "#FEE2E2" },
};

const SummaryCard = ({
  title,
  value,
  percentage = 0,
  trend = "",
  color = "blue",
  label = "",
}) => {
  const { isDark } = useTheme();
  const c = colorMap[color] ?? colorMap.blue;
  const isDecrease = trend.toLowerCase().includes("decrease");

  const cardBg  = isDark ? "#1A2235" : "#ffffff";
  const border  = isDark ? "#2A3550" : "#E2E8F0";
  const textPri = isDark ? "#E8EDF7" : "#0F172A";
  const textSec = isDark ? "#64748B" : "#94A3B8";
  const trackBg = isDark ? "#243047" : "#F1F5F9";

  const trendColor = isDecrease ? "#EF4444" : "#22C55E";
  const trendBg    = isDecrease ? "rgba(254,226,226,0.20)" : "rgba(220,252,231,0.22)";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderLeft: `4px solid ${c.bar || c.accent}`,
      borderRadius: 16,
      padding: 20,
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.22s ease, box-shadow 0.22s ease",
      boxShadow: isDark
        ? "0 2px 8px rgba(0,0,0,0.3)"
        : "0 2px 8px rgba(37,99,235,0.07), 0 4px 20px rgba(37,99,235,0.04)",
      cursor: "default",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = isDark
          ? `0 12px 32px rgba(0,0,0,0.4)`
          : `0 8px 28px rgba(37,99,235,0.14)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 2px 8px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(37,99,235,0.07), 0 4px 20px rgba(37,99,235,0.04)";
      }}
    >
      {/* Decorative glow orb */}
      <div style={{
        position: "absolute", top: -32, right: -32,
        width: 100, height: 100, borderRadius: "50%",
        background: c.accent, opacity: 0.07,
        pointerEvents: "none",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 12, color: textSec, fontWeight: 500, letterSpacing: "0.03em" }}>
            {title}
          </Text>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: textPri,
            marginTop: 4,
            lineHeight: 1.2,
            fontVariantNumeric: "tabular-nums",
          }}>
            {value}
          </div>
        </div>

        {/* Circular ring indicator */}
        <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" stroke={isDark ? "#2a2a2a" : "#f3f4f6"} strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22"
              stroke={c.accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 138} 138`}
              transform="rotate(-90 26 26)"
              style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: c.accent,
          }}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* Slim progress bar */}
      <div style={{ height: 3, borderRadius: 99, background: trackBg, marginTop: 16, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${percentage}%`,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${c.accent}80, ${c.accent})`,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 11.5, fontWeight: 600,
          color: trendColor, background: trendBg,
          padding: "2px 7px", borderRadius: 99,
        }}>
          {isDecrease
            ? <ArrowDownOutlined style={{ fontSize: 9 }} />
            : <ArrowUpOutlined  style={{ fontSize: 9 }} />}
          {trend}
        </span>
        {label && (
          <Text style={{ fontSize: 11, color: textSec }}>{label}</Text>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;