import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Space, Typography, Modal, Form, Select,
  Input, Row, Col, App, Empty,
} from "antd";
import {
  AlertOutlined, CheckCircleOutlined, ThunderboltOutlined, FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmergencyAlerts, raiseEmergencyAlert, resolveEmergencyAlert,
} from "../../features/emergencyAlertSlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, sectionPanel, iconWell, tableHeadCss, pill, modalTitle,
} from "../../styles/pageStyles";
import { severityColor } from "./securityShared";

const { Text } = Typography;

const ALERT_TYPE_OPTIONS = ["Fire", "Medical Emergency", "Security Breach", "Natural Disaster", "Other"];

const SeverityBadge = ({ severity }) => {
  const color = severityColor(severity);
  return <span style={pill(color, `${color}14`)}>{severity}</span>;
};

const AlertStatusBadge = ({ isResolved }) =>
  isResolved
    ? <span style={pill("#16A34A", "rgba(220,252,231,0.5)")}>Resolved</span>
    : <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>Open</span>;

const EmergencyAlerts = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { alerts, loading, saving } = useSelector((s) => s.emergencyAlerts);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchEmergencyAlerts({ limit: 500 })); }, [dispatch]);

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

export default EmergencyAlerts;
