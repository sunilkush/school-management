import React from "react";
import { Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useTheme } from "../../../../../context/ThemeContext";

const { Text } = Typography;

const colorMap = {
  blue:   { accent: "#1677ff", bg: "rgba(22,119,255,0.08)",   glow: "rgba(22,119,255,0.12)"   },
  purple: { accent: "#7c3aed", bg: "rgba(124,58,237,0.08)",   glow: "rgba(124,58,237,0.12)"   },
  green:  { accent: "#0ea472", bg: "rgba(14,164,114,0.08)",   glow: "rgba(14,164,114,0.12)"   },
  orange: { accent: "#ea580c", bg: "rgba(234,88,12,0.08)",    glow: "rgba(234,88,12,0.12)"    },
  teal:   { accent: "#0891b2", bg: "rgba(8,145,178,0.08)",    glow: "rgba(8,145,178,0.12)"    },
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

  const cardBg  = isDark ? "#141414" : "#ffffff";
  const border  = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";
  const trackBg = isDark ? "#2a2a2a" : "#f3f4f6";

  const trendColor = isDecrease ? "#dc2626" : "#0ea472";
  const trendBg    = isDecrease ? "rgba(220,38,38,0.08)" : "rgba(14,164,114,0.08)";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: 20,
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.22s ease, box-shadow 0.22s ease",
      cursor: "default",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,${isDark ? 0.4 : 0.1})`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
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