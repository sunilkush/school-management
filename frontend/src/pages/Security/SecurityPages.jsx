import React, { useEffect, useState } from "react";
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Statistic, Spin, App,
} from "antd";
import {
  SafetyOutlined, AuditOutlined, AlertOutlined, PlusOutlined,
  EyeOutlined, CheckCircleOutlined, TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGateEntries, fetchGateStats, createGateEntry, markGateExit, deleteGateEntry,
} from "../../features/gateEntrySlice";
import {
  fetchEmergencyAlerts, raiseEmergencyAlert, resolveEmergencyAlert,
} from "../../features/emergencyAlertSlice";

const { Title, Text } = Typography;

const PageWrap = ({ title, icon, children }) => (
  <div style={{ padding: 24 }}>
    <Title level={3} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {title}
    </Title>
    {children}
  </div>
);

/* ══════════════════════════════════════════
   SECURITY DASHBOARD
══════════════════════════════════════════ */
export const SecurityDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.gateEntries);
  const { alerts } = useSelector((s) => s.emergencyAlerts);

  useEffect(() => {
    dispatch(fetchGateStats());
    dispatch(fetchEmergencyAlerts({ isResolved: false }));
  }, [dispatch]);

  const activeAlerts = alerts.filter((a) => !a.isResolved).length;
  const statCards = [
    { title: "Currently Inside", value: stats.inside ?? 0,        color: "#10B981", icon: <TeamOutlined /> },
    { title: "Today's Entries",  value: stats.todayEntries ?? 0,  color: "#2563EB", icon: <AuditOutlined /> },
    { title: "Today's Exits",    value: stats.todayExits ?? 0,    color: "#7C3AED", icon: <SafetyOutlined /> },
    { title: "Active Alerts",    value: activeAlerts,             color: "#EF4444", icon: <AlertOutlined /> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Security Dashboard</Title>
        <Text type="secondary">Campus security overview — entries, exits, and alerts.</Text>
      </Card>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map((s) => (
            <Col xs={24} sm={12} md={6} key={s.title}>
              <Card style={{ borderTop: `4px solid ${s.color}` }}>
                <Statistic title={s.title} value={s.value} prefix={s.icon} valueStyle={{ color: s.color }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </Space>
  );
};

/* ══════════════════════════════════════════
   ENTRY REGISTER
══════════════════════════════════════════ */
export const EntryRegister = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchGateEntries({})); }, [dispatch]);

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

  const cols = [
    { title: "Name",       dataIndex: "name" },
    { title: "Type",       dataIndex: "type",      render: (v) => <Tag>{v}</Tag> },
    { title: "Vehicle No", dataIndex: "vehicleNo",  render: (v) => v || "—" },
    { title: "Gate",       dataIndex: "gate" },
    { title: "Entry Time", dataIndex: "entryTime",  render: (v) => v ? new Date(v).toLocaleTimeString() : "—" },
    { title: "Exit Time",  dataIndex: "exitTime",   render: (v) => v ? new Date(v).toLocaleTimeString() : "—" },
    { title: "Status",     dataIndex: "status",     render: (v) => <Tag color={v === "Inside" ? "green" : "default"}>{v}</Tag> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "Inside"
          ? <Button size="small" type="primary" onClick={() => handleExit(r._id)}>Mark Exit</Button>
          : <Button size="small" type="link" icon={<EyeOutlined />}>View</Button>,
    },
  ];

  return (
    <PageWrap title="Entry Register" icon={<AuditOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Entry</Button>
        </Space>
        <Table dataSource={entries} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Log Entry" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Type" name="type" initialValue="Visitor">
            <Select options={["Visitor","Parent","Vendor","Contractor","Staff","Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Phone" name="phone"><Input /></Form.Item>
          <Form.Item label="Purpose" name="purpose"><Input /></Form.Item>
          <Form.Item label="Vehicle No" name="vehicleNo"><Input /></Form.Item>
          <Form.Item label="Gate" name="gate" initialValue="Main">
            <Select options={["Main","Side","Back","Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save Entry</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   GATE LOGS
══════════════════════════════════════════ */
export const GateLogs = () => {
  const dispatch = useDispatch();
  const { entries, loading, stats } = useSelector((s) => s.gateEntries);

  useEffect(() => {
    dispatch(fetchGateEntries({}));
    dispatch(fetchGateStats());
  }, [dispatch]);

  const cols = [
    { title: "Name",       dataIndex: "name" },
    { title: "Type",       dataIndex: "type",     render: (v) => <Tag>{v}</Tag> },
    { title: "Gate",       dataIndex: "gate" },
    { title: "Entry Time", dataIndex: "entryTime", render: (v) => v ? new Date(v).toLocaleString() : "—" },
    { title: "Exit Time",  dataIndex: "exitTime",  render: (v) => v ? new Date(v).toLocaleString() : "—" },
    { title: "Status",     dataIndex: "status",    render: (v) => <Tag color={v === "Inside" ? "green" : "default"}>{v}</Tag> },
  ];

  return (
    <PageWrap title="Gate Logs" icon={<SafetyOutlined />}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: "Currently Inside", value: stats.inside ?? 0,       color: "#10B981" },
          { label: "Today's Entries",  value: stats.todayEntries ?? 0, color: "#2563EB" },
          { label: "Today's Exits",    value: stats.todayExits ?? 0,   color: "#7C3AED" },
        ].map((s) => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: "#6B7280", fontSize: 13 }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="All Gate Activity">
        <Table dataSource={entries} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   EMERGENCY ALERTS
══════════════════════════════════════════ */
export const EmergencyAlerts = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { alerts, loading, saving } = useSelector((s) => s.emergencyAlerts);
  const [open, setOpen] = useState(false);
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

  const cols = [
    { title: "Type",     dataIndex: "type" },
    { title: "Severity", dataIndex: "severity", render: (v) => <Tag color={v === "High" ? "red" : v === "Medium" ? "orange" : "green"}>{v}</Tag> },
    { title: "Location", dataIndex: "location", render: (v) => v || "—" },
    { title: "Raised At",dataIndex: "raisedAt", render: (v) => v ? new Date(v).toLocaleString() : "—" },
    { title: "Status",   dataIndex: "isResolved", render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Resolved" : "Open"}</Tag> },
    {
      title: "Action",
      render: (_, r) =>
        !r.isResolved
          ? <Button size="small" type="primary" onClick={() => handleResolve(r._id)}>Mark Resolved</Button>
          : <Button size="small" type="link" icon={<CheckCircleOutlined />}>Done</Button>,
    },
  ];

  return (
    <PageWrap title="Emergency Alerts" icon={<AlertOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" danger icon={<AlertOutlined />} onClick={() => setOpen(true)}>Raise Alert</Button>
        </Space>
        <Table dataSource={alerts} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Raise Emergency Alert" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleRaise}>
          <Form.Item label="Alert Type" name="type" rules={[{ required: true }]}>
            <Select options={["Fire","Medical Emergency","Security Breach","Natural Disaster","Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Severity" name="severity" rules={[{ required: true }]} initialValue="High">
            <Select options={["Low","Medium","High"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Location" name="location"><Input /></Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item>
            <Button type="primary" danger htmlType="submit" loading={saving}>Send Alert</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};
