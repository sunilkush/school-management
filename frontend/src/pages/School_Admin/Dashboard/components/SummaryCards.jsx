import React from "react";
import { Row, Col, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserAddOutlined,
  TeamOutlined,
  SolutionOutlined,
  RightOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../../components/icons/RupeeIcon";

const { Text } = Typography;

/**
 * The four headline numbers.
 *
 * Each card is a door, not a poster: clicking it opens the screen the number comes from, so the
 * dashboard answers "what now?" as well as "how are we doing?". `links` maps the card key to a
 * route for the current role (Principal and Vice Principal have different pages), and a card with
 * no route for that role simply stays unclickable.
 *
 * There used to be a progress bar under every number, filled to the growth percentage — a 22%
 * rise drew a bar 22% full, which reads as "22% of a target" and means nothing here. Gone.
 */
const SummaryCards = ({ summary, links = {} }) => {
  const navigate = useNavigate();
  const dynamic = summary || {};

  const cardData = [
    {
      key: "newAdmissions",
      title: "New Admissions",
      formatted: Number(dynamic?.newAdmissions?.value || 0).toLocaleString("en-IN"),
      growth: Math.round(dynamic?.newAdmissions?.growth || 0),
      icon: UserAddOutlined,
      accent: "var(--primary)",
      accentBg: "rgba(var(--primary-rgb), 0.08)",
      desc: "vs last month",
    },
    {
      key: "totalStudents",
      title: "Total Students",
      formatted: Number(dynamic?.totalStudents?.value || 0).toLocaleString("en-IN"),
      growth: Math.round(dynamic?.totalStudents?.growth || 0),
      icon: TeamOutlined,
      accent: "var(--success)",
      accentBg: "rgba(var(--success-rgb), 0.08)",
      desc: "enrolled this year",
    },
    {
      key: "totalTeachers",
      title: "Total Teachers",
      formatted: Number(dynamic?.totalTeachers?.value || 0).toLocaleString("en-IN"),
      growth: Math.round(dynamic?.totalTeachers?.growth || 0),
      icon: SolutionOutlined,
      accent: "var(--accent)",
      accentBg: "rgba(var(--accent-rgb), 0.08)",
      desc: "active staff",
    },
    {
      key: "totalIncome",
      title: "Fees Collected",
      formatted: `₹${Number(dynamic?.totalIncome?.value || 0).toLocaleString("en-IN")}`,
      growth: Math.round(dynamic?.totalIncome?.growth || 0),
      icon: RupeeIcon,
      accent: "var(--warning-hover)",
      accentBg: "rgba(var(--warning-rgb), 0.10)",
      desc: "this month",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cardData.map((item) => {
        const Icon = item.icon;
        const isDown = item.growth < 0;
        const trendColor = isDown ? "var(--danger)" : "var(--success)";
        const trendBg = isDown ? "rgba(var(--danger-rgb), 0.08)" : "rgba(var(--success-rgb), 0.08)";
        const to = links[item.key];

        const open = () => to && navigate(`/dashboard/${to}`);

        return (
          <Col xs={12} lg={6} key={item.key}>
            <div
              className={`kpi-card${to ? " kpi-card-link" : ""}`}
              role={to ? "link" : undefined}
              tabIndex={to ? 0 : undefined}
              onClick={open}
              onKeyDown={(e) => {
                if (to && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); }
              }}
              style={{
                borderRadius: 14,
                padding: 18,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                height: "100%",
                cursor: to ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <Text style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{item.title}</Text>
                  <div style={{ fontSize: "clamp(20px, 4.5vw, 26px)", fontWeight: 700, color: "var(--text)", marginTop: 4, lineHeight: 1.15 }}>
                    {item.formatted}
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: item.accentBg, flexShrink: 0 }}>
                  <Icon style={{ color: item.accent }} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600, padding: "2px 7px", borderRadius: 99, color: trendColor, background: trendBg }}>
                  {isDown ? <ArrowDownOutlined style={{ fontSize: 10 }} /> : <ArrowUpOutlined style={{ fontSize: 10 }} />}
                  {Math.abs(item.growth)}%
                </span>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.desc}</Text>
                {to && (
                  <span className="kpi-card-cue" style={{ marginLeft: "auto", fontSize: 11, color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                    Open <RightOutlined style={{ fontSize: 9 }} />
                  </span>
                )}
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export default SummaryCards;
