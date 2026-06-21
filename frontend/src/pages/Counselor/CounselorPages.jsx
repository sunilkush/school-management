import React, { useEffect, useState } from "react";
import {
  Card, Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, Statistic, Spin, App, Progress,
} from "antd";
import {
  TeamOutlined, CalendarOutlined, FileTextOutlined,
  PlusOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCounselingSessions, fetchCounselingStats,
  createCounselingSession, updateCounselingSession, deleteCounselingSession,
} from "../../features/counselingSessionSlice";

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
   COUNSELOR DASHBOARD
══════════════════════════════════════════ */
export const CounselorDashboard = () => {
  const dispatch = useDispatch();
  const { sessions, stats, loading } = useSelector((s) => s.counselingSessions);

  useEffect(() => {
    dispatch(fetchCounselingSessions({}));
    dispatch(fetchCounselingStats());
  }, [dispatch]);

  const scheduled = sessions.filter((s) => s.status === "Scheduled").length;
  const completed = sessions.filter((s) => s.status === "Completed").length;
  const appointments = sessions.filter((s) => s.type === "Appointment" && s.status === "Scheduled").length;
  const uniqueStudents = new Set(sessions.map((s) => s.studentId || s.studentName).filter(Boolean)).size;

  const statCards = [
    { title: "Students in Counseling", value: uniqueStudents, color: "#7C3AED", icon: <TeamOutlined /> },
    { title: "Sessions Today",          value: scheduled,     color: "#2563EB", icon: <CalendarOutlined /> },
    { title: "Pending Appointments",    value: appointments,  color: "#F59E0B", icon: <ClockCircleOutlined /> },
    { title: "Completed Sessions",      value: completed,     color: "#10B981", icon: <CheckCircleOutlined /> },
  ];

  const upcoming = sessions.filter((s) => s.status === "Scheduled").slice(0, 5);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Counselor Dashboard</Title>
        <Text type="secondary">Student wellbeing overview — sessions, appointments, and resolved cases.</Text>
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
      <Card title="Upcoming Sessions">
        <Table size="small" pagination={false} dataSource={upcoming} rowKey="_id" columns={[
          { title: "Student", dataIndex: "studentName", render: (v) => v || "—" },
          { title: "Class",   dataIndex: "studentClass", render: (v) => v || "—" },
          { title: "Date",    dataIndex: "sessionDate", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
          { title: "Issue",   dataIndex: "issue", render: (v) => <Tag color="blue">{v}</Tag> },
          { title: "Type",    dataIndex: "type",  render: (v) => <Tag>{v}</Tag> },
        ]} />
      </Card>
    </Space>
  );
};

/* ══════════════════════════════════════════
   COUNSELOR STUDENTS
══════════════════════════════════════════ */
export const CounselorStudents = () => {
  const dispatch = useDispatch();
  const { sessions, loading } = useSelector((s) => s.counselingSessions);

  useEffect(() => { dispatch(fetchCounselingSessions({})); }, [dispatch]);

  const studentMap = {};
  sessions.forEach((s) => {
    const key = s.studentId || s.studentName || "Unknown";
    if (!studentMap[key]) {
      studentMap[key] = { key, name: s.studentName || "—", class: s.studentClass || "—", sessions: 0, lastSeen: s.sessionDate, issue: s.issue };
    }
    studentMap[key].sessions += 1;
    if (new Date(s.sessionDate) > new Date(studentMap[key].lastSeen)) studentMap[key].lastSeen = s.sessionDate;
  });
  const students = Object.values(studentMap);

  const cols = [
    { title: "Name",     dataIndex: "name" },
    { title: "Class",    dataIndex: "class" },
    { title: "Issue",    dataIndex: "issue", render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Sessions", dataIndex: "sessions" },
    { title: "Last Seen",dataIndex: "lastSeen", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  return (
    <PageWrap title="Students Under Counseling" icon={<TeamOutlined />}>
      <Card>
        <Table dataSource={students} rowKey="key" columns={cols} loading={loading} size="middle"
          locale={{ emptyText: "No counseling sessions found. Add sessions to see students here." }} />
      </Card>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   COUNSELING SESSIONS
══════════════════════════════════════════ */
export const CounselingSessions = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { sessions, loading, saving } = useSelector((s) => s.counselingSessions);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchCounselingSessions({ type: "Session" })); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createCounselingSession({ ...values, type: "Session" }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Session logged");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await dispatch(updateCounselingSession({ id, data: { status } }));
    if (res.meta.requestStatus === "fulfilled") message.success("Status updated");
    else message.error(res.payload || "Failed");
  };

  const cols = [
    { title: "Student", dataIndex: "studentName", render: (v) => v || "—" },
    { title: "Class",   dataIndex: "studentClass", render: (v) => v || "—" },
    { title: "Issue",   dataIndex: "issue", render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Date",    dataIndex: "sessionDate", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Duration",dataIndex: "duration",    render: (v) => `${v || 30} min` },
    { title: "Status",  dataIndex: "status",      render: (v) => <Tag color={v === "Completed" ? "green" : v === "Cancelled" ? "red" : "blue"}>{v}</Tag> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "Scheduled" ? (
          <Space>
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(r._id, "Completed")}>Complete</Button>
            <Button size="small" danger onClick={() => handleUpdateStatus(r._id, "Cancelled")}>Cancel</Button>
          </Space>
        ) : <Button size="small" type="link" icon={<EyeOutlined />}>View</Button>,
    },
  ];

  return (
    <PageWrap title="Counseling Sessions" icon={<CalendarOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Session</Button>
        </Space>
        <Table dataSource={sessions} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Log Counseling Session" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Student Name" name="studentName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Class" name="studentClass"><Input /></Form.Item>
          <Form.Item label="Issue / Concern" name="issue" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Session Date" name="sessionDate" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item label="Duration (minutes)" name="duration" initialValue={30}>
            <Input type="number" min={5} max={120} />
          </Form.Item>
          <Form.Item label="Mood" name="mood">
            <Select options={["Happy","Neutral","Anxious","Sad","Angry"].map((v) => ({ value: v, label: v }))} allowClear />
          </Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Save Session</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════════ */
export const Appointments = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { sessions, loading, saving } = useSelector((s) => s.counselingSessions);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchCounselingSessions({ type: "Appointment" })); }, [dispatch]);

  const appointments = sessions.filter((s) => s.type === "Appointment");

  const handleCreate = async (values) => {
    const res = await dispatch(createCounselingSession({ ...values, type: "Appointment" }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Appointment scheduled");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleAction = async (id, status) => {
    const res = await dispatch(updateCounselingSession({ id, data: { status } }));
    if (res.meta.requestStatus === "fulfilled") message.success("Updated");
    else message.error(res.payload || "Failed");
  };

  const cols = [
    { title: "Student", dataIndex: "studentName", render: (v) => v || "—" },
    { title: "Class",   dataIndex: "studentClass", render: (v) => v || "—" },
    { title: "Purpose", dataIndex: "issue" },
    { title: "Date",    dataIndex: "sessionDate", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    { title: "Status",  dataIndex: "status",      render: (v) => <Tag color={v === "Scheduled" ? "blue" : v === "Completed" ? "green" : "red"}>{v}</Tag> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "Scheduled" ? (
          <Space>
            <Button size="small" type="primary" onClick={() => handleAction(r._id, "Completed")}>Confirm</Button>
            <Button size="small" danger onClick={() => handleAction(r._id, "Cancelled")}>Decline</Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <PageWrap title="Appointments" icon={<CalendarOutlined />}>
      <Card>
        <Space style={{ marginBottom: 16, justifyContent: "flex-end", display: "flex" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>New Appointment</Button>
        </Space>
        <Table dataSource={appointments} rowKey="_id" columns={cols} loading={loading} size="middle" />
      </Card>

      <Modal title="Schedule Appointment" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Student Name" name="studentName" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Class" name="studentClass"><Input /></Form.Item>
          <Form.Item label="Purpose" name="issue" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Appointment Date" name="sessionDate" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Schedule</Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageWrap>
  );
};

/* ══════════════════════════════════════════
   COUNSELOR REPORTS
══════════════════════════════════════════ */
export const CounselorReports = () => {
  const dispatch = useDispatch();
  const { sessions, stats, loading } = useSelector((s) => s.counselingSessions);

  useEffect(() => {
    dispatch(fetchCounselingSessions({}));
    dispatch(fetchCounselingStats());
  }, [dispatch]);

  const byStatus = stats.byStatus || {};
  const topIssues = stats.topIssues || [];
  const total = sessions.length;

  return (
    <PageWrap title="Counselor Reports" icon={<FileTextOutlined />}>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { label: "Total Sessions",  value: total,                     color: "#7C3AED" },
            { label: "Completed",       value: byStatus.Completed ?? 0,   color: "#10B981" },
            { label: "Scheduled",       value: byStatus.Scheduled ?? 0,   color: "#2563EB" },
            { label: "Cancelled/No Show",value: (byStatus.Cancelled ?? 0) + (byStatus["No Show"] ?? 0), color: "#EF4444" },
          ].map((s) => (
            <Col xs={24} sm={12} md={6} key={s.label}>
              <Card style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card title="Top Issues Reported">
          <Space direction="vertical" style={{ width: "100%" }}>
            {topIssues.map((issue, i) => (
              <div key={i}>
                <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>{issue._id}</span>
                  <span style={{ color: "#6B7280" }}>{issue.count} sessions</span>
                </div>
                <Progress percent={total ? Math.round((issue.count / total) * 100) : 0} size="small"
                  strokeColor="#7C3AED" showInfo={false} />
              </div>
            ))}
            {topIssues.length === 0 && (
              <Text type="secondary">No session data yet.</Text>
            )}
          </Space>
        </Card>
      </Spin>
    </PageWrap>
  );
};
