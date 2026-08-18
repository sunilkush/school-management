import React, { useEffect } from "react";
import { Table, Button, Tag, Space, Typography, Row, Col, Spin, Empty } from "antd";
import {
  SafetyOutlined, AuditOutlined, AlertOutlined, PlusOutlined,
  TeamOutlined, ReloadOutlined,
  LoginOutlined, LogoutOutlined, ThunderboltOutlined, FileTextOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchGateEntries, fetchGateStats } from "../../features/gateEntrySlice";
import { fetchEmergencyAlerts } from "../../features/emergencyAlertSlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, sectionPanel, iconWell, tableHeadCss,
} from "../../styles/pageStyles";
import { severityColor } from "./securityShared";

const { Text } = Typography;

/* ── KPI card ─────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, color, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--surface)",
      borderRadius: 14,
      border: "1px solid var(--border-muted)",
      borderLeft: `4px solid ${color}`,
      padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.18s ease, transform 0.18s ease",
    }}
    onMouseEnter={(e) => {
      if (!onClick) return;
      e.currentTarget.style.boxShadow = `0 4px 18px ${color}20`;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Quick action pill ────────────────────────────────────────────── */
const ActionPill = ({ icon, label, path, color, navigate }) => (
  <div
    onClick={() => navigate(path)}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 16px", borderRadius: 10, cursor: "pointer",
      border: `1px solid var(--border-muted)`,
      background: "var(--surface)",
      transition: "all 0.18s ease",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background = `${color}0E`;
      e.currentTarget.style.boxShadow = `0 2px 10px ${color}18`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-muted)";
      e.currentTarget.style.background = "var(--surface)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div style={iconWell(color, 28, { flexShrink: 0 })}>{icon}</div>
    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
  </div>
);

const SecurityDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, entries, loading } = useSelector((s) => s.gateEntries);
  const { alerts, loading: alertsLoading } = useSelector((s) => s.emergencyAlerts);

  useEffect(() => {
    dispatch(fetchGateStats());
    dispatch(fetchGateEntries({}));
    dispatch(fetchEmergencyAlerts({ isResolved: false }));
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchGateStats());
    dispatch(fetchGateEntries({}));
    dispatch(fetchEmergencyAlerts({ isResolved: false }));
  };

  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const recentEntries = entries.slice(0, 6);

  const entryCols = [
    { title: "Name", dataIndex: "name" },
    { title: "Type", dataIndex: "type", render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag> },
    { title: "Gate", dataIndex: "gate" },
    {
      title: "Entry", dataIndex: "entryTime",
      render: (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    {
      title: "Status", dataIndex: "status",
      render: (v) => <Tag color={v === "Inside" ? "green" : "default"} style={{ borderRadius: 6 }}>{v}</Tag>,
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("sec-tbl")}</style>

      <PageHeader
        title="Security Dashboard"
        subtitle="Campus gate activity and emergency alerts at a glance"
        icon={<SafetyOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        }
      />

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div style={{ ...statGrid(180), marginBottom: 16 }}>
        <KpiCard
          label="Currently Inside" value={stats.inside ?? 0}
          icon={<TeamOutlined />} color="var(--success)" sub="On campus right now"
        />
        <KpiCard
          label="Today's Entries" value={stats.todayEntries ?? 0}
          icon={<LoginOutlined />} color="var(--primary)"
          onClick={() => navigate("/dashboard/security/entry-register")}
        />
        <KpiCard
          label="Today's Exits" value={stats.todayExits ?? 0}
          icon={<LogoutOutlined />} color="var(--purple)"
          onClick={() => navigate("/dashboard/security/gate-logs")}
        />
        <KpiCard
          label="Active Alerts" value={activeAlerts.length}
          icon={<AlertOutlined />} color="var(--danger-hover)"
          sub={activeAlerts.length ? "Needs attention" : "All clear"}
          onClick={() => navigate("/dashboard/security/alerts")}
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <div style={{
        ...sectionPanel, marginBottom: 20, padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 6, flexShrink: 0 }}>
          <div style={iconWell("var(--purple)", 28)}><ThunderboltOutlined style={{ fontSize: 12 }} /></div>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Quick Actions
          </Text>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-muted)", flexShrink: 0 }} />
        <ActionPill icon={<PlusOutlined />}     label="Log New Entry"    path="/dashboard/security/entry-register"   color="var(--primary)" navigate={navigate} />
        <ActionPill icon={<AuditOutlined />}    label="Gate Logs"        path="/dashboard/security/gate-logs"        color="var(--purple)" navigate={navigate} />
        <ActionPill icon={<AlertOutlined />}    label="Emergency Alerts" path="/dashboard/security/alerts"           color="var(--danger-hover)" navigate={navigate} />
        <ActionPill icon={<FileTextOutlined />} label="Shift Attendance" path="/dashboard/security/shift-attendance" color="var(--accent)" navigate={navigate} />
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Recent Gate Activity ────────────────────────────────── */}
        <Col xs={24} lg={14}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={iconWell("var(--primary)", 32)}><AuditOutlined style={{ fontSize: 14 }} /></div>
                <div>
                  <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                    Recent Gate Activity
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Latest entries at all gates</Text>
                </div>
              </div>
              <Button type="link" size="small" onClick={() => navigate("/dashboard/security/gate-logs")}>
                View all
              </Button>
            </div>
            <Table
              className="sec-tbl"
              rowKey="_id"
              columns={entryCols}
              dataSource={recentEntries}
              pagination={false}
              loading={loading}
              size="small"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No gate activity yet" /> }}
            />
          </div>
        </Col>

        {/* ── Active Alerts ────────────────────────────────────────── */}
        <Col xs={24} lg={10}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={iconWell("var(--danger-hover)", 32)}><AlertOutlined style={{ fontSize: 14 }} /></div>
                <div>
                  <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                    Active Alerts
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Unresolved emergencies</Text>
                </div>
              </div>
              <Button type="link" size="small" onClick={() => navigate("/dashboard/security/alerts")}>
                View all
              </Button>
            </div>

            {alertsLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}><Spin /></div>
            ) : activeAlerts.length === 0 ? (
              <div style={{ padding: "24px 0" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active alerts" />
              </div>
            ) : (
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {activeAlerts.slice(0, 6).map((a) => (
                  <div key={a._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    background: `${severityColor(a.severity)}0E`,
                    border: `1px solid ${severityColor(a.severity)}30`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: severityColor(a.severity), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 12, color: "var(--text-primary)", display: "block" }}>
                        {a.type}
                      </Text>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {a.location || "Location not set"}
                        {a.raisedAt ? ` · ${new Date(a.raisedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </Text>
                    </div>
                    <Tag
                      color={a.severity === "High" ? "red" : a.severity === "Medium" ? "orange" : "green"}
                      style={{ margin: 0, borderRadius: 6 }}
                    >
                      {a.severity}
                    </Tag>
                  </div>
                ))}
              </Space>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SecurityDashboard;
