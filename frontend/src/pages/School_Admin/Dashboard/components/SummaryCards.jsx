import React from "react";
import { Row, Col, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserAddOutlined,
  TeamOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../../components/icons/RupeeIcon";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;

const SummaryCards = ({ summary }) => {
  const { isDark } = useTheme();

  const dynamic = summary || {};
  const cardData = [
    {
      title: "New Admissions",
      formatted: Number(dynamic?.newAdmissions?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.newAdmissions?.growth || 0)),
      trend: (dynamic?.newAdmissions?.growth || 0) < 0 ? "decrease" : "increase",
      icon: UserAddOutlined,
      accent: "#1677ff",
      accentBg: "rgba(22,119,255,0.08)",
      desc: "vs last month",
    },
    {
      title: "Total Students",
      formatted: Number(dynamic?.totalStudents?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.totalStudents?.growth || 0)),
      trend: (dynamic?.totalStudents?.growth || 0) < 0 ? "decrease" : "increase",
      icon: TeamOutlined,
      accent: "#0ea472",
      accentBg: "rgba(14,164,114,0.08)",
      desc: "enrolled this year",
    },
    {
      title: "Total Teachers",
      formatted: Number(dynamic?.totalTeachers?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.totalTeachers?.growth || 0)),
      trend: (dynamic?.totalTeachers?.growth || 0) < 0 ? "decrease" : "increase",
      icon: SolutionOutlined,
      accent: "#14B8A6",
      accentBg: "rgba(155,135,184,0.08)",
      desc: "active staff",
    },
    {
      title: "Total Income",
      formatted: `₹${Number(dynamic?.totalIncome?.value || 0).toLocaleString()}`,
      percentage: Math.abs(Math.round(dynamic?.totalIncome?.growth || 0)),
      trend: (dynamic?.totalIncome?.growth || 0) < 0 ? "decrease" : "increase",
      icon: RupeeIcon,
      accent: "#EF4444",
      accentBg: "rgba(217,107,122,0.08)",
      desc: "revenue this month",
    },
  ];

  const cardBg = isDark ? "#141414" : "#ffffff";
  const border = isDark ? "#1f1f1f" : "#f0f0f0";
  const textPri = isDark ? "#e8e8e8" : "#111827";
  const textSec = isDark ? "#6b7280" : "#9ca3af";

  return (
    <>
      <Row gutter={[16, 16]}>
        {cardData.map((item, i) => {
          const isDown = item.trend === "decrease";
          const Icon = item.icon;
          const trendColor = isDown ? "#EF4444" : "#0ea472";
          const trendBg = isDown ? "rgba(217,107,122,0.08)" : "rgba(14,164,114,0.08)";

          return (
            <Col xs={24} sm={12} lg={6} key={i}>
              <div className="kpi-card" style={{ borderRadius: 14, padding: 20, background: cardBg, border: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <Text style={{ fontSize: 12, color: textSec, fontWeight: 500 }}>{item.title}</Text>
                    <div style={{ fontSize: 26, fontWeight: 700, color: textPri, marginTop: 4 }}>{item.formatted}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: item.accentBg }}>
                    <Icon style={{ color: item.accent }} />
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: isDark ? "#2a2a2a" : "#f3f4f6", marginTop: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(item.percentage, 100)}%`, borderRadius: 99, background: `linear-gradient(90deg, ${item.accent}88, ${item.accent})` }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600, padding: "2px 7px", borderRadius: 99, color: trendColor, background: trendBg }}>
                    {isDown ? <ArrowDownOutlined style={{ fontSize: 10 }} /> : <ArrowUpOutlined style={{ fontSize: 10 }} />}
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
