import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CameraOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { currentUser, updateUser } from "../../features/authSlice";

const { Title, Text } = Typography;

const statusColors = {
  Open: "orange",
  "In Progress": "blue",
  Resolved: "green",
};

export const ITSupportDashboard = () => {
  const metrics = [
    { title: "Open Tickets", value: 9, prefix: <WarningOutlined /> },
    { title: "Resolved Today", value: 17, prefix: <CheckCircleOutlined /> },
    { title: "Pending Tasks", value: 4, prefix: <ClockCircleOutlined /> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>
          IT Support Dashboard
        </Title>
        <Text type="secondary">System health, tickets, maintenance, and logs in one place.</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} md={8} key={metric.title}>
            <Card>
              <Statistic title={metric.title} value={metric.value} prefix={metric.prefix} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="System Uptime">
        <Progress percent={99.4} status="active" />
      </Card>
    </Space>
  );
};

export const SystemMaintenance = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Backup database", done: false },
    { id: 2, title: "Patch server security updates", done: true },
    { id: 3, title: "Clean temp storage", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  return (
    <Card title="System Maintenance">
      <List
        dataSource={tasks}
        renderItem={(task) => (
          <List.Item
            actions={[
              <Switch key="toggle" checked={task.done} onChange={() => toggleTask(task.id)} checkedChildren="Done" unCheckedChildren="Pending" />,
            ]}
          >
            <Space>
              <Text strong>{task.title}</Text>
              <Tag color={task.done ? "green" : "orange"}>{task.done ? "Completed" : "Pending"}</Tag>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};

export const UserSupportTickets = () => {
  const [form] = Form.useForm();
  const [tickets, setTickets] = useState([
    { id: "T-1001", subject: "Fee payment page not loading", priority: "High", status: "Open" },
    { id: "T-1002", subject: "Password reset request", priority: "Low", status: "Resolved" },
    { id: "T-1003", subject: "Unable to print report card", priority: "Medium", status: "In Progress" },
  ]);

  const [filter, setFilter] = useState("All");

  const filteredTickets = useMemo(() => {
    if (filter === "All") return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  }, [tickets, filter]);

  const addTicket = (values) => {
    const newTicket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: values.subject,
      priority: values.priority,
      status: "Open",
    };
    setTickets((prev) => [newTicket, ...prev]);
    form.resetFields();
    message.success("Ticket created successfully");
  };

  const columns = [
    { title: "Ticket ID", dataIndex: "id", key: "id" },
    { title: "Subject", dataIndex: "subject", key: "subject" },
    { title: "Priority", dataIndex: "priority", key: "priority" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="Create Support Ticket">
        <Form form={form} layout="vertical" onFinish={addTicket}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Please enter a subject" }]}>
                <Input placeholder="Describe the issue" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true, message: "Select priority" }]}>
                <Select
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label=" ">
                <Button type="primary" htmlType="submit" block>
                  Submit
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title="User Support Tickets"
        extra={
          <Select
            style={{ minWidth: 150 }}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "All", label: "All" },
              { value: "Open", label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved", label: "Resolved" },
            ]}
          />
        }
      >
        <Table rowKey="id" columns={columns} dataSource={filteredTickets} pagination={{ pageSize: 5 }} />
      </Card>
    </Space>
  );
};

export const NetworkStatus = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const services = [
    { name: "API Gateway", uptime: 99.9, status: "Operational" },
    { name: "Database Cluster", uptime: 99.5, status: "Operational" },
    { name: "Notification Service", uptime: 97.8, status: "Degraded" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert
        type={maintenanceMode ? "warning" : "success"}
        message={maintenanceMode ? "Maintenance Mode Enabled" : "All critical systems are stable"}
        showIcon
      />
      <Card
        title="Network Controls"
        extra={<Switch checked={maintenanceMode} onChange={setMaintenanceMode} checkedChildren="ON" unCheckedChildren="OFF" />}
      >
        <Text type="secondary">Toggle platform maintenance mode for controlled downtime.</Text>
      </Card>

      <Card title="Service Health">
        <List
          dataSource={services}
          renderItem={(service) => (
            <List.Item>
              <Row style={{ width: "100%" }} gutter={16} align="middle">
                <Col xs={24} md={8}>
                  <Text strong>{service.name}</Text>
                </Col>
                <Col xs={24} md={10}>
                  <Progress percent={service.uptime} size="small" />
                </Col>
                <Col xs={24} md={6}>
                  <Tag color={service.status === "Operational" ? "green" : "orange"}>{service.status}</Tag>
                </Col>
              </Row>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export const SystemLogs = () => {
  const [query, setQuery] = useState("");
  const logs = [
    "[INFO] 08:12 Backup completed successfully",
    "[WARN] 09:03 Notification queue delay detected",
    "[INFO] 09:47 User role sync job completed",
    "[ERROR] 10:18 SMTP connection timeout",
  ];

  const filteredLogs = logs.filter((log) => log.toLowerCase().includes(query.toLowerCase()));

  return (
    <Card title="System Logs" extra={<Input placeholder="Search logs" value={query} onChange={(e) => setQuery(e.target.value)} />}>
      <List
        dataSource={filteredLogs}
        locale={{ emptyText: "No log entries found" }}
        renderItem={(item) => (
          <List.Item>
            <Text code>{item}</Text>
          </List.Item>
        )}
      />
    </Card>
  );
};

export const ITSupportProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({
      name:  user.name  || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user, form]);

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "IT";

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { message.error("Please select an image file"); return; }
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || "", email: user?.email || "", phone: user?.phone, avatarFile: file })).unwrap();
      message.success("Profile photo updated!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await dispatch(updateUser({ name: values.name, email: values.email, phone: values.phone })).unwrap();
      message.success("Profile updated successfully!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="My Profile" style={{ maxWidth: 700 }}>
      {/* Avatar section */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div
          style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
          onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
          title="Click to change photo"
        >
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb", display: "block" }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
              {initials}
            </div>
          )}
          {uploadingPhoto ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spin size="small" />
            </div>
          ) : (
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
              <CameraOutlined style={{ color: "#fff", fontSize: 11 }} />
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name || "IT Support"}</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>{user?.role?.name || "IT Support"}</div>
          {user?.school?.name && <div style={{ color: "#6b7280", fontSize: 12 }}>{user.school.name}</div>}
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Name is required" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
};
