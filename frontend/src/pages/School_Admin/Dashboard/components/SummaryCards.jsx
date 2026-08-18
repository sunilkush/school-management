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

const { Text } = Typography;

const SummaryCards = ({ summary }) => {
  const dynamic = summary || {};
  const cardData = [
    {
      title: "New Admissions",
      formatted: Number(dynamic?.newAdmissions?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.newAdmissions?.growth || 0)),
      trend: (dynamic?.newAdmissions?.growth || 0) < 0 ? "decrease" : "increase",
      icon: UserAddOutlined,
      accent: "var(--primary)",
      accentBg: "rgba(var(--primary-rgb), 0.08)",
      desc: "vs last month",
    },
    {
      title: "Total Students",
      formatted: Number(dynamic?.totalStudents?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.totalStudents?.growth || 0)),
      trend: (dynamic?.totalStudents?.growth || 0) < 0 ? "decrease" : "increase",
      icon: TeamOutlined,
      accent: "var(--success)",
      accentBg: "rgba(var(--success-rgb), 0.08)",
      desc: "enrolled this year",
    },
    {
      title: "Total Teachers",
      formatted: Number(dynamic?.totalTeachers?.value || 0).toLocaleString(),
      percentage: Math.abs(Math.round(dynamic?.totalTeachers?.growth || 0)),
      trend: (dynamic?.totalTeachers?.growth || 0) < 0 ? "decrease" : "increase",
      icon: SolutionOutlined,
      accent: "var(--accent)",
      accentBg: "rgba(var(--accent-rgb), 0.08)",
      desc: "active staff",
    },
    {
      title: "Total Income",
      formatted: `₹${Number(dynamic?.totalIncome?.value || 0).toLocaleString()}`,
      percentage: Math.abs(Math.round(dynamic?.totalIncome?.growth || 0)),
      trend: (dynamic?.totalIncome?.growth || 0) < 0 ? "decrease" : "increase",
      icon: RupeeIcon,
      accent: "var(--danger)",
      accentBg: "rgba(var(--danger-rgb), 0.08)",
      desc: "revenue this month",
    },
  ];

  const cardBg = "var(--surface)";
  const border = "var(--border)";
  const textPri = "var(--text)";
  const textSec = "var(--text-muted)";

  return (
    <>
      <Row gutter={[16, 16]}>
        {cardData.map((item, i) => {
          const isDown = item.trend === "decrease";
          const Icon = item.icon;
          const trendColor = isDown ? "var(--danger)" : "var(--success)";
          const trendBg = isDown ? "rgba(var(--danger-rgb), 0.08)" : "rgba(var(--success-rgb), 0.08)";

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
                <div style={{ height: 4, borderRadius: 99, background: "var(--border-muted)", marginTop: 16, overflow: "hidden" }}>
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
