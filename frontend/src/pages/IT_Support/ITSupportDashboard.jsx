import React, { useEffect } from "react";
import { Table, Tag } from "antd";
import { useTheme } from "../../context/ThemeContext";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets } from "../../features/supportTicketSlice";
import PageHeader from "../../components/layout/PageHeader";

const PRIORITY_COLOR = { low: "green", medium: "orange", high: "red" };
const STATUS_COLOR = { Open: "orange", "In Progress": "blue", Resolved: "green" };

const ITSupportDashboard = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { tickets, loading } = useSelector((s) => s.supportTickets || { tickets: [], loading: false });

  useEffect(() => { dispatch(fetchTickets()); }, [dispatch]);

  const open     = tickets.filter((t) => t.status === "Open").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const inProg   = tickets.filter((t) => t.status === "In Progress").length;

  const card       = isDark ? "#141C2E" : "#FFFFFF";
  const cardBorder = isDark ? "#1E2A3B" : "#E2E8F0";
  const textPri    = isDark ? "#E8EDF7" : "#0F172A";
  const textSec    = isDark ? "#64748B" : "#64748B";
  const shadow     = isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(37,99,235,0.07)";
  const rowHover   = isDark ? "#1E2A3B" : "#F4F7FF";

  const kpis = [
    { label: "Open Tickets",  value: open,            color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: <WarningOutlined />     },
    { label: "In Progress",   value: inProg,          color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  icon: <ClockCircleOutlined /> },
    { label: "Resolved",      value: resolved,        color: "#10B981", bg: "rgba(16,185,129,0.12)",  icon: <CheckCircleOutlined /> },
    { label: "Total Tickets", value: tickets.length,  color: "#6366F1", bg: "rgba(99,102,241,0.12)",  icon: <ToolOutlined />        },
  ];

  return (
    <>
      <PageHeader
        title="IT Support Dashboard"
        subtitle="System health, tickets, maintenance, and logs in one place"
        icon={<ToolOutlined />}
      />
      <div style={{ padding: "clamp(12px,3vw,24px)", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* KPI row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {kpis.map((k) => (
            <div key={k.label} style={{
              background: card, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${k.color}`,
              borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center",
              gap: 14, boxShadow: shadow, flex: 1, minWidth: 140,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: k.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: k.color,
              }}>
                {k.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: textPri, lineHeight: 1.2 }}>
                  {loading ? "—" : k.value}
                </div>
                <div style={{ fontSize: 12, color: textSec, marginTop: 2 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tickets */}
        <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 20, boxShadow: shadow }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPri, marginBottom: 16 }}>Recent Tickets</div>
          <Table
            size="small"
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 6 }}
            dataSource={[...tickets].slice(0, 10)}
            columns={[
              {
                title: "Title", dataIndex: "title", key: "title", ellipsis: true,
                render: (v) => <span style={{ fontSize: 13, color: textPri }}>{v || "—"}</span>,
              },
              {
                title: "Priority", dataIndex: "priority", key: "priority", width: 100,
                render: (v) => <Tag color={PRIORITY_COLOR[v?.toLowerCase()] || "default"}>{v}</Tag>,
              },
              {
                title: "Status", dataIndex: "status", key: "status", width: 120,
                render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{v}</Tag>,
              },
            ]}
            onRow={() => ({
              onMouseEnter: (e) => { e.currentTarget.style.background = rowHover; },
              onMouseLeave: (e) => { e.currentTarget.style.background = "transparent"; },
            })}
            style={{ background: "transparent" }}
          />
        </div>

      </div>
    </>
  );
};

export default ITSupportDashboard;
