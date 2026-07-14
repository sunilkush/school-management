import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Spin, App, Empty,
} from "antd";
import {
  SafetyOutlined, AuditOutlined, AlertOutlined, PlusOutlined,
  EyeOutlined, CheckCircleOutlined, TeamOutlined, ReloadOutlined,
  LoginOutlined, LogoutOutlined, ThunderboltOutlined, FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchGateEntries, fetchGateStats, createGateEntry, markGateExit, deleteGateEntry,
} from "../../features/gateEntrySlice";
import {
  fetchEmergencyAlerts, raiseEmergencyAlert, resolveEmergencyAlert,
} from "../../features/emergencyAlertSlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, sectionPanel, iconWell, tableHeadCss, pill, avatarStyle, modalTitle,
} from "../../styles/pageStyles";

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

const severityColor = (s) => (s === "High" ? "#DC2626" : s === "Medium" ? "#D97706" : "#16A34A");

/* ══════════════════════════════════════════
   SECURITY DASHBOARD
══════════════════════════════════════════ */
export const SecurityDashboard = () => {
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
          icon={<TeamOutlined />} color="#16A34A" sub="On campus right now"
        />
        <KpiCard
          label="Today's Entries" value={stats.todayEntries ?? 0}
          icon={<LoginOutlined />} color="#2563EB"
          onClick={() => navigate("/dashboard/security/entry-register")}
        />
        <KpiCard
          label="Today's Exits" value={stats.todayExits ?? 0}
          icon={<LogoutOutlined />} color="#7C3AED"
          onClick={() => navigate("/dashboard/security/gate-logs")}
        />
        <KpiCard
          label="Active Alerts" value={activeAlerts.length}
          icon={<AlertOutlined />} color="#DC2626"
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
          <div style={iconWell("#7C3AED", 28)}><ThunderboltOutlined style={{ fontSize: 12 }} /></div>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Quick Actions
          </Text>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-muted)", flexShrink: 0 }} />
        <ActionPill icon={<PlusOutlined />}     label="Log New Entry"    path="/dashboard/security/entry-register"   color="#2563EB" navigate={navigate} />
        <ActionPill icon={<AuditOutlined />}    label="Gate Logs"        path="/dashboard/security/gate-logs"        color="#7C3AED" navigate={navigate} />
        <ActionPill icon={<AlertOutlined />}    label="Emergency Alerts" path="/dashboard/security/alerts"           color="#DC2626" navigate={navigate} />
        <ActionPill icon={<FileTextOutlined />} label="Shift Attendance" path="/dashboard/security/shift-attendance" color="#14B8A6" navigate={navigate} />
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Recent Gate Activity ────────────────────────────────── */}
        <Col xs={24} lg={14}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={iconWell("#2563EB", 32)}><AuditOutlined style={{ fontSize: 14 }} /></div>
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
                <div style={iconWell("#DC2626", 32)}><AlertOutlined style={{ fontSize: 14 }} /></div>
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

/* ══════════════════════════════════════════
   ENTRY REGISTER
══════════════════════════════════════════ */
const ENTRY_STATUS_COLORS = {
  Inside: { color: "#16A34A", bg: "rgba(220,252,231,0.5)" },
  Exited: { color: "#64748B", bg: "var(--surface-soft)" },
};

const EntryStatusBadge = ({ status }) => {
  const s = ENTRY_STATUS_COLORS[status] || ENTRY_STATUS_COLORS.Exited;
  return <span style={pill(s.color, s.bg)}>{status}</span>;
};

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export const EntryRegister = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, stats, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchGateEntries({}));
    dispatch(fetchGateStats());
  }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createGateEntry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Entry logged");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleExit = async (id) => {
    const res = await dispatch(markGateExit(id));
    if (res.meta.requestStatus === "fulfilled") message.success("Exit marked");
    else message.error(res.payload || "Failed");
  };

  const filteredEntries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.vehicleNo?.toLowerCase().includes(q) ||
        e.gate?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [entries, searchText, typeFilter]);

  const cols = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={avatarStyle(r.name, 34)}>{getInitials(r.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {r.type}{r.purpose ? ` · ${r.purpose}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    { title: "Vehicle No", dataIndex: "vehicleNo", render: (v) => v || "—" },
    { title: "Gate", dataIndex: "gate", render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag> },
    {
      title: "Entry Time", dataIndex: "entryTime",
      render: (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    {
      title: "Exit Time", dataIndex: "exitTime",
      render: (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    { title: "Status", dataIndex: "status", render: (v) => <EntryStatusBadge status={v} /> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "Inside" ? (
          <Button size="small" type="primary" ghost icon={<LogoutOutlined />} onClick={() => handleExit(r._id)}>
            Mark Exit
          </Button>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("entry-tbl")}</style>

      <PageHeader
        title="Entry Register"
        subtitle="Log and track visitor, vendor & staff gate entries"
        icon={<AuditOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ borderRadius: 8 }}>
            New Entry
          </Button>
        }
      />

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        {[
          { label: "Currently Inside", value: stats.inside ?? 0,       icon: <TeamOutlined />,   color: "#16A34A" },
          { label: "Today's Entries",  value: stats.todayEntries ?? 0, icon: <LoginOutlined />,  color: "#2563EB" },
          { label: "Today's Exits",    value: stats.todayExits ?? 0,   icon: <LogoutOutlined />, color: "#7C3AED" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Records table ─────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Gate Entries</Text>
          <Space wrap>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 140 }}
              options={["All", "Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"].map((v) => ({ value: v, label: v }))}
            />
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search name, vehicle, gate..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
              allowClear
            />
          </Space>
        </div>
        <Table
          className="entry-tbl"
          dataSource={filteredEntries}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "25", "50"] }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No gate entries yet" /> }}
        />
      </div>

      <Modal
        title={modalTitle(<AuditOutlined />, "Log Gate Entry", "Record a new visitor, vendor, or staff entry")}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" initialValue="Visitor">
                <Select options={["Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Contact number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vehicle No" name="vehicleNo">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Gate" name="gate" initialValue="Main">
                <Select options={["Main", "Side", "Back", "Other"].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Purpose" name="purpose">
                <Input placeholder="Reason for visit" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit" loading={saving} block icon={<PlusOutlined />}>
              Save Entry
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ══════════════════════════════════════════
   GATE LOGS
══════════════════════════════════════════ */
const GATE_OPTIONS = ["All", "Main", "Side", "Back", "Other"];
const TYPE_OPTIONS = ["All", "Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"];

const fmtLogTime = (v) =>
  v ? new Date(v).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const GateLogs = () => {
  const dispatch = useDispatch();
  const { entries, loading, stats } = useSelector((s) => s.gateEntries);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gateFilter, setGateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchGateEntries({}));
    dispatch(fetchGateStats());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchGateEntries({}));
    dispatch(fetchGateStats());
  };

  const filteredEntries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesGate = gateFilter === "All" || e.gate === gateFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      const matchesSearch =
        !q || e.name?.toLowerCase().includes(q) || e.vehicleNo?.toLowerCase().includes(q);
      return matchesType && matchesGate && matchesStatus && matchesSearch;
    });
  }, [entries, searchText, typeFilter, gateFilter, statusFilter]);

  const cols = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={avatarStyle(r.name, 34)}>{getInitials(r.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.type}</div>
          </div>
        </div>
      ),
    },
    { title: "Vehicle No", dataIndex: "vehicleNo", render: (v) => v || "—" },
    { title: "Gate", dataIndex: "gate", render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag> },
    { title: "Entry Time", dataIndex: "entryTime", render: fmtLogTime },
    { title: "Exit Time", dataIndex: "exitTime", render: fmtLogTime },
    { title: "Status", dataIndex: "status", render: (v) => <EntryStatusBadge status={v} /> },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("gatelog-tbl")}</style>

      <PageHeader
        title="Gate Logs"
        subtitle="Complete history of visitor, vendor & staff gate activity"
        icon={<SafetyOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        }
      />

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        {[
          { label: "Currently Inside", value: stats.inside ?? 0,       icon: <TeamOutlined />,   color: "#16A34A" },
          { label: "Today's Entries",  value: stats.todayEntries ?? 0, icon: <LoginOutlined />,  color: "#2563EB" },
          { label: "Today's Exits",    value: stats.todayExits ?? 0,   icon: <LogoutOutlined />, color: "#7C3AED" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Activity table ────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>All Gate Activity</Text>
          <Space wrap>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
              options={["All", "Inside", "Exited"].map((v) => ({ value: v, label: v }))} />
            <Select value={gateFilter} onChange={setGateFilter} style={{ width: 120 }}
              options={GATE_OPTIONS.map((v) => ({ value: v, label: v }))} />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}
              options={TYPE_OPTIONS.map((v) => ({ value: v, label: v }))} />
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search name, vehicle..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
          </Space>
        </div>
        <Table
          className="gatelog-tbl"
          dataSource={filteredEntries}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ["15", "25", "50", "100"] }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No gate activity found" /> }}
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   EMERGENCY ALERTS
══════════════════════════════════════════ */
const ALERT_TYPE_OPTIONS = ["Fire", "Medical Emergency", "Security Breach", "Natural Disaster", "Other"];

const SeverityBadge = ({ severity }) => {
  const color = severityColor(severity);
  return <span style={pill(color, `${color}14`)}>{severity}</span>;
};

const AlertStatusBadge = ({ isResolved }) =>
  isResolved
    ? <span style={pill("#16A34A", "rgba(220,252,231,0.5)")}>Resolved</span>
    : <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>Open</span>;

export const EmergencyAlerts = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { alerts, loading, saving } = useSelector((s) => s.emergencyAlerts);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchEmergencyAlerts({})); }, [dispatch]);

  const handleRaise = async (values) => {
    const res = await dispatch(raiseEmergencyAlert(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Alert raised");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleResolve = async (id) => {
    const res = await dispatch(resolveEmergencyAlert({ id, resolution: "Resolved by security" }));
    if (res.meta.requestStatus === "fulfilled") message.success("Alert resolved");
    else message.error(res.payload || "Failed");
  };

  const summary = useMemo(() => ({
    total:    alerts.length,
    open:     alerts.filter((a) => !a.isResolved).length,
    resolved: alerts.filter((a) => a.isResolved).length,
    highOpen: alerts.filter((a) => !a.isResolved && a.severity === "High").length,
  }), [alerts]);

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return alerts.filter((a) => {
      const matchesSeverity = severityFilter === "All" || a.severity === severityFilter;
      const matchesStatus =
        statusFilter === "All" || (statusFilter === "Open" ? !a.isResolved : a.isResolved);
      const matchesSearch =
        !q || a.type?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [alerts, searchText, severityFilter, statusFilter]);

  const cols = [
    { title: "Type", dataIndex: "type", render: (v) => <Text strong style={{ fontSize: 13 }}>{v}</Text> },
    { title: "Severity", dataIndex: "severity", render: (v) => <SeverityBadge severity={v} /> },
    { title: "Location", dataIndex: "location", render: (v) => v || "—" },
    {
      title: "Raised At", dataIndex: "raisedAt",
      render: (v) => (v ? new Date(v).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    { title: "Status", dataIndex: "isResolved", render: (v) => <AlertStatusBadge isResolved={v} /> },
    {
      title: "Action",
      render: (_, r) =>
        !r.isResolved ? (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleResolve(r._id)}>
            Mark Resolved
          </Button>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("alert-tbl")}</style>

      <PageHeader
        title="Emergency Alerts"
        subtitle="Raise, track, and resolve campus emergencies"
        icon={<AlertOutlined />}
        extra={
          <Button type="primary" danger icon={<AlertOutlined />} onClick={() => setOpen(true)} style={{ borderRadius: 8 }}>
            Raise Alert
          </Button>
        }
      />

      {/* ── Critical banner ───────────────────────────────────────── */}
      {summary.highOpen > 0 && (
        <div style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FFF1F2 100%)",
          border: "1px solid #FECDD3",
          borderLeft: "5px solid #DC2626",
          padding: "16px 22px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "#DC262622", color: "#DC2626",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            <AlertOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: "#DC2626", display: "block" }}>
              {summary.highOpen} high-severity {summary.highOpen === 1 ? "alert needs" : "alerts need"} immediate attention
            </Text>
            <Text style={{ fontSize: 12, color: "#9F1239" }}>Review and resolve open high-severity alerts below</Text>
          </div>
        </div>
      )}

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        {[
          { label: "Total Alerts",   value: summary.total,    icon: <FileTextOutlined />,   color: "#0891b2" },
          { label: "Open",           value: summary.open,     icon: <AlertOutlined />,       color: "#DC2626" },
          { label: "Resolved",       value: summary.resolved, icon: <CheckCircleOutlined />, color: "#16A34A" },
          { label: "High Severity",  value: summary.highOpen, icon: <ThunderboltOutlined />, color: "#D97706" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alerts table ──────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>All Alerts</Text>
          <Space wrap>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}
              options={["All", "Open", "Resolved"].map((v) => ({ value: v, label: v }))} />
            <Select value={severityFilter} onChange={setSeverityFilter} style={{ width: 130 }}
              options={["All", "Low", "Medium", "High"].map((v) => ({ value: v, label: v }))} />
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search type, location..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />
          </Space>
        </div>
        <Table
          className="alert-tbl"
          dataSource={filteredAlerts}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ["15", "25", "50"] }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No alerts found" /> }}
        />
      </div>

      <Modal
        title={modalTitle(<AlertOutlined />, "Raise Emergency Alert", "Notify security & staff of a campus emergency")}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleRaise}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Alert Type" name="type" rules={[{ required: true, message: "Select an alert type" }]}>
                <Select options={ALERT_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Severity" name="severity" rules={[{ required: true }]} initialValue="High">
                <Select options={["Low", "Medium", "High"].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Location" name="location">
            <Input placeholder="e.g. Main Building, Block C" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Additional details (optional)" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" danger htmlType="submit" loading={saving} block icon={<AlertOutlined />}>
              Send Alert
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
