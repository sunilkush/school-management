import React, { useEffect, useState } from "react";
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Statistic, Spin, App, Popconfirm,
} from "antd";
import {
  UserAddOutlined, PhoneOutlined, BellOutlined, TeamOutlined,
  PlusOutlined, EyeOutlined, EditOutlined, QuestionCircleOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchGateEntries, fetchGateStats, createGateEntry, markGateExit } from "../../features/gateEntrySlice";
import { fetchCallLogs, createCallLog, deleteCallLog } from "../../features/callLogSlice";
import { fetchInquiries, createInquiry, updateInquiry } from "../../features/admissionInquirySlice";
import { fetchNotifications, createNotification } from "../../features/notificationSlice";

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
   RECEPTIONIST DASHBOARD
══════════════════════════════════════════ */
export const ReceptionistDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading: gLoading } = useSelector((s) => s.gateEntries);
  const { inquiries } = useSelector((s) => s.admissionInquiry);
  const { logs }      = useSelector((s) => s.callLogs);

  useEffect(() => {
    dispatch(fetchGateStats());
    dispatch(fetchInquiries({}));
    dispatch(fetchCallLogs({}));
  }, [dispatch]);

  const pending = inquiries.filter((i) => i.status === "pending" || i.status === "New").length;

  const statCards = [
    { title: "Today's Visitors",   value: stats.todayEntries ?? 0, color: "#7C3AED", icon: <TeamOutlined /> },
    { title: "Pending Enquiries",  value: pending,                  color: "#2563EB", icon: <QuestionCircleOutlined /> },
    { title: "Calls Logged Today", value: logs.length,             color: "#10B981", icon: <PhoneOutlined /> },
    { title: "Currently Inside",   value: stats.inside ?? 0,       color: "#F59E0B", icon: <NotificationOutlined /> },
  ];

  const recentEntries = useSelector((s) => s.gateEntries.entries).slice(0, 5);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Receptionist Dashboard</Title>
        <Text type="secondary">Front desk overview — visitors, enquiries, calls, and announcements.</Text>
      </Card>
      <Spin spinning={gLoading}>
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
      <Card title="Recent Entries">
        <Table size="small" pagination={false} dataSource={recentEntries} rowKey="_id" columns={[
          { title: "Name",   dataIndex: "name" },
          { title: "Type",   dataIndex: "type",   render: (v) => <Tag>{v}</Tag> },
          { title: "Time",   dataIndex: "entryTime", render: (v) => v ? new Date(v).toLocaleTimeString() : "—" },
          { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "Inside" ? "green" : "default"}>{v}</Tag> },
        ]} />
      </Card>
    </Space>
  );
};

/* ══════════════════════════════════════════
   VISITOR MANAGEMENT
══════════════════════════════════════════ */
export const VisitorManagement = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchGateEntries({})); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createGateEntry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Visitor entry logged");
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
    { title: "Phone",      dataIndex: "phone",      render: (v) => v || "—" },
    { title: "Purpose",    dataIndex: "purpose",    render: (v) => v || "—" },
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
    <PageWrap title="Visitor Management" icon={<UserAddOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Check In Visitor</Button>
        </Space>
        <Table dataSource={entries} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Visitor Check-In" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Visitor Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Type" name="type" initialValue="Visitor">
            <Select options={["Visitor","Parent","Vendor","Contractor","Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Phone" name="phone"><Input /></Form.Item>
          <Form.Item label="Purpose" name="purpose"><Input /></Form.Item>
          <Form.Item label="Vehicle No" name="vehicleNo"><Input /></Form.Item>
          <Form.Item label="Gate" name="gate" initialValue="Main">
            <Select options={["Main","Side","Back"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   ENQUIRIES (Admission Inquiries)
══════════════════════════════════════════ */
export const Enquiries = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { inquiries, loading, saving } = useSelector((s) => s.admissionInquiry);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchInquiries({})); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createInquiry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Enquiry recorded");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleStatus = async (id, status) => {
    const res = await dispatch(updateInquiry({ id, data: { status } }));
    if (res.meta.requestStatus === "fulfilled") message.success("Status updated");
    else message.error(res.payload || "Failed");
  };

  const cols = [
    { title: "Student",  dataIndex: "studentName" },
    { title: "Parent",   dataIndex: "parentName" },
    { title: "Phone",    dataIndex: "parentPhone" },
    { title: "Class",    dataIndex: "applyingClass" },
    { title: "Source",   dataIndex: "source",  render: (v) => <Tag>{v}</Tag> },
    { title: "Status",   dataIndex: "status",  render: (v) => <Tag color={v === "Enrolled" ? "green" : v === "Pending" ? "orange" : "default"}>{v}</Tag> },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" onClick={() => handleStatus(r._id, "Enrolled")}>Enroll</Button>
          <Button size="small" type="link" icon={<EyeOutlined />}>View</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageWrap title="Admission Enquiries" icon={<QuestionCircleOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Enquiry</Button>
        </Space>
        <Table dataSource={inquiries} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="New Admission Enquiry" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Student Name"   name="studentName"   rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Parent Name"    name="parentName"    rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Parent Phone"   name="parentPhone"   rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Parent Email"   name="parentEmail"><Input type="email" /></Form.Item>
          <Form.Item label="Applying Class" name="applyingClass" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Source" name="source" initialValue="walk-in">
            <Select options={["walk-in","phone","website","referral","other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   CALL LOG
══════════════════════════════════════════ */
export const CallLog = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { logs, loading, saving } = useSelector((s) => s.callLogs);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchCallLogs({})); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createCallLog(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Call logged");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const cols = [
    { title: "Caller",   dataIndex: "callerName" },
    { title: "Phone",    dataIndex: "phone",    render: (v) => v || "—" },
    { title: "Type",     dataIndex: "type",     render: (v) => <Tag color={v === "Incoming" ? "green" : v === "Missed" ? "red" : "blue"}>{v}</Tag> },
    { title: "Purpose",  dataIndex: "purpose",  render: (v) => v || "—" },
    { title: "Duration", dataIndex: "duration", render: (v) => v ? `${v} min` : "—" },
    { title: "Time",     dataIndex: "callTime", render: (v) => v ? new Date(v).toLocaleString() : "—" },
    {
      title: "Action",
      render: (_, r) => (
        <Popconfirm
          title="Delete this call log?"
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onConfirm={() => dispatch(deleteCallLog(r._id))}
        >
          <Button size="small" type="link" danger>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageWrap title="Call Log" icon={<PhoneOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Log Call</Button>
        </Space>
        <Table dataSource={logs} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Log Call" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Caller Name" name="callerName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Phone" name="phone"><Input /></Form.Item>
          <Form.Item label="Call Type" name="type" initialValue="Incoming">
            <Select options={["Incoming","Outgoing","Missed"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Purpose" name="purpose"><Input /></Form.Item>
          <Form.Item label="Duration (min)" name="duration"><Input type="number" min={0} /></Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   BROADCASTS
══════════════════════════════════════════ */
export const Broadcasts = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { items: notifications, loading, creating } = useSelector((s) => s.notification);

  useEffect(() => {
    dispatch(fetchNotifications({ status: "sent" }));
  }, [dispatch]);

  const AUDIENCE_MAP = {
    All: { level: "all", targetRoles: [] },
    Students: { level: "role", targetRoles: ["Student"] },
    Parents: { level: "role", targetRoles: ["Parent"] },
    Teachers: { level: "role", targetRoles: ["Teacher"] },
    Staff: { level: "role", targetRoles: ["Staff", "Support Staff"] },
  };

  const CHANNEL_MAP = {
    App:          { inApp: true,  sms: false, email: false },
    SMS:          { inApp: false, sms: true,  email: false },
    Email:        { inApp: false, sms: false, email: true  },
    "SMS+App":    { inApp: true,  sms: true,  email: false },
    "All Channels": { inApp: true, sms: true, email: true  },
  };

  const getChannelLabel = (channels = {}) => {
    const active = [];
    if (channels.inApp) active.push("App");
    if (channels.sms)   active.push("SMS");
    if (channels.email) active.push("Email");
    return active.join("+") || "App";
  };

  const getAudienceLabel = (n) => {
    if (n.level === "all") return "All";
    if (n.level === "role" && n.targetRoles?.length) return n.targetRoles.join(", ");
    return "All";
  };

  const handleSend = async (values) => {
    const audience = AUDIENCE_MAP[values.audience] || AUDIENCE_MAP.All;
    const channels = CHANNEL_MAP[values.channel] || CHANNEL_MAP.App;
    const res = await dispatch(createNotification({
      title: values.title,
      message: values.notifMessage,
      level: audience.level,
      targetRoles: audience.targetRoles,
      channels,
      status: "sent",
    }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success(`Broadcast "${values.title}" sent successfully`);
      form.resetFields();
      setOpen(false);
      dispatch(fetchNotifications({ status: "sent" }));
    } else {
      message.error(res.payload || "Failed to send broadcast");
    }
  };

  const cols = [
    { title: "Title",    dataIndex: "title", render: (v) => <strong>{v}</strong> },
    { title: "Audience", render: (_, r) => <Tag color="purple">{getAudienceLabel(r)}</Tag> },
    { title: "Channel",  render: (_, r) => <Tag>{getChannelLabel(r.channels)}</Tag> },
    { title: "Sent By",  dataIndex: "createdBy", render: (v) => v || "—" },
    {
      title: "Status",   dataIndex: "status",
      render: (v) => <Tag color={v === "sent" ? "green" : v === "scheduled" ? "blue" : "default"}>{v}</Tag>,
    },
    { title: "Sent At",  dataIndex: "createdAt", render: (v) => v ? new Date(v).toLocaleString() : "—" },
  ];

  return (
    <PageWrap title="Broadcasts" icon={<BellOutlined />}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderTop: "4px solid #7C3AED", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#7C3AED" }}>{notifications.length}</div>
            <div style={{ color: "#6B7280" }}>Total Broadcasts</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderTop: "4px solid #10B981", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>
              {notifications.filter((n) => n.status === "sent").length}
            </div>
            <div style={{ color: "#6B7280" }}>Sent</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderTop: "4px solid #2563EB", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2563EB" }}>
              {notifications.filter((n) => n.status === "scheduled").length}
            </div>
            <div style={{ color: "#6B7280" }}>Scheduled</div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<NotificationOutlined />} onClick={() => setOpen(true)}>New Broadcast</Button>
        </Space>
        <Table dataSource={notifications} rowKey="_id" columns={cols} loading={loading} size="middle"
          locale={{ emptyText: "No broadcasts sent yet." }} />
      </Card>

      <Modal title="Send Broadcast" open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSend}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Enter a title" }]}>
            <Input placeholder="e.g. School Closed Tomorrow" />
          </Form.Item>
          <Form.Item label="Message" name="notifMessage" rules={[{ required: true, message: "Enter a message" }]}>
            <Input.TextArea rows={4} placeholder="Write your announcement here..." />
          </Form.Item>
          <Form.Item label="Audience" name="audience" initialValue="All">
            <Select options={["All","Students","Parents","Teachers","Staff"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Channel" name="channel" initialValue="App">
            <Select options={["App","SMS","Email","SMS+App","All Channels"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={creating}>Send Now</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};
