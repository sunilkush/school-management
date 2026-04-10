import React, { useMemo, useState } from "react";
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
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";

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
  const [form] = Form.useForm();

  const saveProfile = (values) => {
    message.success(`Profile updated for ${values.name}`);
  };

  return (
    <Card title="IT Support Profile">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: "IT Helpdesk Team",
          email: "it-support@school.com",
          phone: "+1 555 123 4567",
          escalation: "Level 2",
        }}
        onFinish={saveProfile}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="escalation" label="Escalation Level" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "Level 1", label: "Level 1" },
                  { value: "Level 2", label: "Level 2" },
                  { value: "Level 3", label: "Level 3" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" htmlType="submit">
          Save Changes
        </Button>
      </Form>
    </Card>
  );
};
