import React from "react";
import { Row, Col, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserAddOutlined,
  TeamOutlined,
  SolutionOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const cardData = [
  {
    title: "New Admissions",
    value: 1203,
    formatted: "1,203",
    percentage: 10,
    trend: "increase",
    icon: UserAddOutlined,
    accent: "#1677ff",
    accentBg: "rgba(22,119,255,0.08)",
    accentGlow: "rgba(22,119,255,0.15)",
    desc: "vs last month",
  },
  {
    title: "Total Students",
    value: 12300,
    formatted: "12,300",
    percentage: 20,
    trend: "increase",
    icon: TeamOutlined,
    accent: "#0ea472",
    accentBg: "rgba(14,164,114,0.08)",
    accentGlow: "rgba(14,164,114,0.15)",
    desc: "enrolled this year",
  },
  {
    title: "Total Teachers",
    value: 1280,
    formatted: "1,280",
    percentage: 20,
    trend: "increase",
    icon: SolutionOutlined,
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.08)",
    accentGlow: "rgba(124,58,237,0.15)",
    desc: "active staff",
  },
  {
    title: "Total Income",
    value: 65865,
    formatted: "$65,865",
    percentage: 20,
    trend: "decrease",
    icon: DollarOutlined,
    accent: "#dc2626",
    accentBg: "rgba(220,38,38,0.08)",
    accentGlow: "rgba(220,38,38,0.15)",
    desc: "revenue this month",
  },
];

const SummaryCards = () => {
  const { isDark } = useTheme();

  const cardBg   = isDark ? "#141414" : "#ffffff";
  const border   = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri  = isDark ? "#e8e8e8" : "#111827";
  const textSec  = isDark ? "#6b7280" : "#9ca3af";

  return (
    <>
      <style>{`
        .kpi-card {
          border-radius: 14px;
          padding: 20px;
          background: ${cardBg};
          border: 1px solid ${border};
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          position: relative;
          overflow: hidden;
          cursor: default;
        }
        .kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,${isDark ? "0.4" : "0.1"});
        }
        .kpi-card::before {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          opacity: 0.07;
          transition: opacity 0.22s ease;
        }
        .kpi-card:hover::before { opacity: 0.12; }

        .kpi-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }

        .kpi-bar-track {
          height: 4px;
          border-radius: 99px;
          background: ${isDark ? "#2a2a2a" : "#f3f4f6"};
          margin-top: 16px;
          overflow: hidden;
        }
        .kpi-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s cubic-bezier(0.4,0,0.2,1);
        }

        .kpi-trend {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 99px;
        }
      `}</style>

      <Row gutter={[16, 16]}>
        {cardData.map((item, i) => {
          const isDown = item.trend === "decrease";
          const Icon = item.icon;
          const trendColor = isDown ? "#dc2626" : "#0ea472";
          const trendBg    = isDown ? "rgba(220,38,38,0.08)" : "rgba(14,164,114,0.08)";

          return (
            <Col xs={24} sm={12} lg={6} key={i}>
              <div
                className="kpi-card"
                style={{ "--accent": item.accent }}
              >
                {/* Decorative circle */}
                <div style={{
                  position: "absolute", top: -40, right: -40,
                  width: 120, height: 120, borderRadius: "50%",
                  background: item.accent, opacity: 0.07,
                  pointerEvents: "none",
                }} />

                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <Text style={{ fontSize: 12, color: textSec, fontWeight: 500, letterSpacing: "0.03em" }}>
                      {item.title}
                    </Text>
                    <div style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: textPri,
                      lineHeight: 1.2,
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {item.formatted}
                    </div>
                  </div>

                  <div
                    className="kpi-icon-wrap"
                    style={{ background: item.accentBg }}
                  >
                    <Icon style={{ color: item.accent }} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="kpi-bar-track">
                  <div
                    className="kpi-bar-fill"
                    style={{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, ${item.accent}88, ${item.accent})`,
                    }}
                  />
                </div>

                {/* Footer */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}>
                  <span className="kpi-trend" style={{ color: trendColor, background: trendBg }}>
                    {isDown
                      ? <ArrowDownOutlined style={{ fontSize: 10 }} />
                      : <ArrowUpOutlined  style={{ fontSize: 10 }} />
                    }
                    {item.percentage}%
                  </span>
                  <Text style={{ fontSize: 11, color: textSec }}>{item.desc}</Text>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </>
  );
};

export default SummaryCards;