import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { currentUser, updateUser } from "../../features/authSlice";
import {
  createTicket,
  fetchTickets,
  resolveTicket,
  updateTicketStatus,
} from "../../features/supportTicketSlice";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PRIORITY_COLOR = { low: "green", medium: "orange", high: "red" };
const STATUS_COLOR = { Open: "orange", "In Progress": "blue", Resolved: "green" };
const TASK_STATUS_COLOR = { pending: "orange", in_progress: "blue", done: "green" };

/* ─────────────────────────────────────────────────────── */
/* Dashboard                                               */
/* ─────────────────────────────────────────────────────── */
export const ITSupportDashboard = () => {
  const dispatch = useDispatch();
  const { tickets, loading } = useSelector((s) => s.supportTickets || { tickets: [], loading: false });

  useEffect(() => { dispatch(fetchTickets()); }, [dispatch]);

  const open     = tickets.filter((t) => t.status === "Open").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const inProg   = tickets.filter((t) => t.status === "In Progress").length;

  const metrics = [
    { title: "Open Tickets",     value: open,     prefix: <WarningOutlined />,      color: "#F59E0B" },
    { title: "In Progress",      value: inProg,   prefix: <ClockCircleOutlined />,  color: "#3B82F6" },
    { title: "Resolved Today",   value: resolved, prefix: <CheckCircleOutlined />,  color: "#10B981" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>IT Support Dashboard</Title>
        <Text type="secondary">System health, tickets, maintenance, and logs in one place.</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {metrics.map((m) => (
          <Col xs={24} md={8} key={m.title}>
            <Card loading={loading}>
              <Statistic
                title={m.title}
                value={m.value}
                prefix={m.prefix}
                valueStyle={{ color: m.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Recent Tickets">
        <Table
          size="small"
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          dataSource={[...tickets].slice(0, 10)}
          columns={[
            { title: "Subject",  dataIndex: "subject",  key: "subject", ellipsis: true },
            { title: "Priority", dataIndex: "priority", key: "priority",
              render: (v) => <Tag color={PRIORITY_COLOR[v?.toLowerCase()] || "default"}>{v}</Tag> },
            { title: "Status",   dataIndex: "status",   key: "status",
              render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{v}</Tag> },
          ]}
        />
      </Card>
    </Space>
  );
};

/* ─────────────────────────────────────────────────────── */
/* System Maintenance                                      */
/* ─────────────────────────────────────────────────────── */
export const SystemMaintenance = () => {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form]                    = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/maintenance-tasks");
      setTasks(res.data.data || []);
    } catch {
      message.error("Failed to load maintenance tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit   = (t) => {
    setEditing(t);
    form.setFieldsValue({ ...t, dueDate: t.dueDate ? dayjs(t.dueDate) : null });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = { ...values, dueDate: values.dueDate ? values.dueDate.toISOString() : null };
    try {
      if (editing) {
        await apiClient.patch(`/maintenance-tasks/${editing._id}`, payload);
        message.success("Task updated");
      } else {
        await apiClient.post("/maintenance-tasks", payload);
        message.success("Task created");
      }
      setModalOpen(false);
      load();
    } catch {
      message.error("Failed to save task");
    }
  };

  const toggleStatus = async (task) => {
    const next = task.status === "done" ? "pending" : task.status === "pending" ? "in_progress" : "done";
    try {
      await apiClient.patch(`/maintenance-tasks/${task._id}`, { status: next });
      load();
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/maintenance-tasks/${id}`);
      message.success("Task deleted");
      load();
    } catch {
      message.error("Failed to delete task");
    }
  };

  return (
    <>
      <Card
        title="System Maintenance Tasks"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Task</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <List
            dataSource={tasks}
            locale={{ emptyText: "No maintenance tasks. Add one to get started." }}
            renderItem={(task) => (
              <List.Item
                actions={[
                  <Tooltip title="Cycle status" key="toggle">
                    <Button size="small" onClick={() => toggleStatus(task)}>
                      <Tag color={TASK_STATUS_COLOR[task.status]}>{task.status.replace("_", " ")}</Tag>
                    </Button>
                  </Tooltip>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(task)} key="edit" />,
                  <Popconfirm title="Delete this task?" onConfirm={() => handleDelete(task._id)} key="del">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Text strong>{task.title}</Text>
                  <Space size={4}>
                    <Tag color={PRIORITY_COLOR[task.priority]}>{task.priority}</Tag>
                    {task.dueDate && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Due: {dayjs(task.dueDate).format("DD MMM YYYY")}
                      </Text>
                    )}
                  </Space>
                  {task.description && <Text type="secondary" style={{ fontSize: 12 }}>{task.description}</Text>}
                </Space>
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      <Modal
        title={editing ? "Edit Task" : "New Maintenance Task"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Backup database" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select options={[
                  { value: "low",    label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high",   label: "High" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editing ? "Update" : "Create"}</Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

/* ─────────────────────────────────────────────────────── */
/* User Support Tickets                                    */
/* ─────────────────────────────────────────────────────── */
export const UserSupportTickets = () => {
  const dispatch                   = useDispatch();
  const { tickets, loading }       = useSelector((s) => s.supportTickets || { tickets: [], loading: false });
  const [form]                     = Form.useForm();
  const [filter, setFilter]        = useState("All");
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote]   = useState("");

  useEffect(() => { dispatch(fetchTickets()); }, [dispatch]);

  const filtered = useMemo(() => {
    if (filter === "All") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const handleCreate = async (values) => {
    await dispatch(createTicket({ subject: values.subject, priority: values.priority, description: values.description || "" }));
    form.resetFields();
    message.success("Ticket submitted");
  };

  const handleStatusChange = (id, status) => {
    dispatch(updateTicketStatus({ id, status }));
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    await dispatch(resolveTicket({ id: resolveModal._id, resolution: resolveNote }));
    setResolveModal(null);
    setResolveNote("");
    message.success("Ticket resolved");
  };

  const columns = [
    { title: "Subject",  dataIndex: "subject",  key: "subject",  ellipsis: true },
    { title: "Priority", dataIndex: "priority", key: "priority",
      render: (v) => <Tag color={PRIORITY_COLOR[v?.toLowerCase()] || "default"}>{v}</Tag> },
    { title: "Status",   dataIndex: "status",   key: "status",
      render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{v}</Tag> },
    {
      title: "Actions", key: "actions",
      render: (_, row) => (
        <Space size="small">
          {row.status !== "In Progress" && row.status !== "Resolved" && (
            <Button size="small" onClick={() => handleStatusChange(row._id, "In Progress")}>
              Start
            </Button>
          )}
          {row.status !== "Resolved" && (
            <Button size="small" type="primary" onClick={() => setResolveModal(row)}>
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="Create Support Ticket">
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                <Input placeholder="Describe the issue" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="description" label="Description">
                <Input placeholder="Details (optional)" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="priority" label="Priority" initialValue="Medium">
                <Select options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={2}>
              <Form.Item label=" ">
                <Button type="primary" htmlType="submit" block>Submit</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title="All Support Tickets"
        extra={
          <Select
            style={{ minWidth: 150 }}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "All",         label: "All" },
              { value: "Open",        label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved",    label: "Resolved" },
            ]}
          />
        }
      >
        <Table
          rowKey={(r) => r._id || r.id}
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="Resolve Ticket"
        open={!!resolveModal}
        onCancel={() => { setResolveModal(null); setResolveNote(""); }}
        onOk={handleResolve}
        okText="Mark Resolved"
      >
        <Text>Subject: <strong>{resolveModal?.subject}</strong></Text>
        <Input.TextArea
          rows={3}
          placeholder="Resolution note (optional)"
          value={resolveNote}
          onChange={(e) => setResolveNote(e.target.value)}
          style={{ marginTop: 12 }}
        />
      </Modal>
    </Space>
  );
};

/* ─────────────────────────────────────────────────────── */
/* Network Status                                          */
/* ─────────────────────────────────────────────────────── */
export const NetworkStatus = () => {
  const [health, setHealth]   = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/health");
      setHealth(res.data.data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isOnline = health?.status === "ok";
  const dbOk     = health?.db === "connected";
  const uptime   = health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : "—";

  const services = [
    { name: "API Server",         ok: isOnline, desc: isOnline ? `Uptime: ${uptime}` : "Not reachable" },
    { name: "Database",           ok: dbOk,     desc: dbOk ? "Connected" : "Disconnected" },
    { name: "Backend Connection", ok: isOnline, desc: health?.timestamp ? `Last checked: ${dayjs(health.timestamp).format("HH:mm:ss")}` : "—" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert
        type={isOnline ? "success" : loading ? "info" : "error"}
        message={loading ? "Checking system status…" : isOnline ? "All critical systems are operational" : "Backend unreachable — check your connection"}
        showIcon
        action={<Button size="small" icon={<ReloadOutlined />} onClick={checkHealth} loading={loading}>Refresh</Button>}
      />

      <Card title={<Space><WifiOutlined /> Service Health</Space>}>
        <Spin spinning={loading}>
          <List
            dataSource={services}
            renderItem={(svc) => (
              <List.Item>
                <Row style={{ width: "100%" }} gutter={16} align="middle">
                  <Col xs={24} md={8}>
                    <Text strong>{svc.name}</Text>
                  </Col>
                  <Col xs={24} md={10}>
                    <Text type="secondary">{svc.desc}</Text>
                  </Col>
                  <Col xs={24} md={6}>
                    <Badge
                      status={svc.ok ? "success" : loading ? "processing" : "error"}
                      text={svc.ok ? "Operational" : loading ? "Checking…" : "Down"}
                    />
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      {health && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Server Uptime"  value={uptime} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Database"       value={health.db || "—"} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="Last Checked"   value={health.timestamp ? dayjs(health.timestamp).format("HH:mm:ss") : "—"} />
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
};

/* ─────────────────────────────────────────────────────── */
/* System Logs                                             */
/* ─────────────────────────────────────────────────────── */
export const SystemLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/activity-logs");
      const raw = res.data.data || [];
      setLogs(raw);
    } catch {
      message.error("Failed to load system logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = useMemo(() => {
    if (!query) return logs;
    const q = query.toLowerCase();
    return logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.user?.name?.toLowerCase().includes(q)
    );
  }, [logs, query]);

  const getLogLevel = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("error") || a.includes("fail") || a.includes("delete")) return { color: "red",    label: "ERROR" };
    if (a.includes("warn")  || a.includes("update"))                         return { color: "orange", label: "WARN"  };
    return { color: "green", label: "INFO" };
  };

  const columns = [
    {
      title: "Level",
      dataIndex: "action",
      key: "level",
      width: 80,
      render: (v) => { const lv = getLogLevel(v); return <Tag color={lv.color}>{lv.label}</Tag>; },
    },
    { title: "Action",      dataIndex: "action",      key: "action",     ellipsis: true },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (u) => u?.name || "—",
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      width: 160,
      render: (v) => dayjs(v).format("DD MMM HH:mm"),
    },
  ];

  return (
    <Card
      title="System Activity Logs"
      extra={
        <Space>
          <Input
            placeholder="Search logs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadLogs} loading={loading} />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 15 }}
        size="small"
        locale={{ emptyText: "No activity logs found" }}
      />
    </Card>
  );
};

/* ─────────────────────────────────────────────────────── */
/* Profile                                                 */
/* ─────────────────────────────────────────────────────── */
export const ITSupportProfile = () => {
  const dispatch      = useDispatch();
  const { user }      = useSelector((state) => state.auth || {});
  const [form]        = Form.useForm();
  const [saving, setSaving]           = useState(false);
  const [uploadingPhoto, setUploading] = useState(false);
  const fileInputRef  = useRef(null);

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);
  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
  }, [user, form]);

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "IT";

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { message.error("Please select an image file"); return; }
    setUploading(true);
    try {
      await dispatch(updateUser({ name: user?.name || "", email: user?.email || "", phone: user?.phone, avatarFile: file })).unwrap();
      message.success("Profile photo updated!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await dispatch(updateUser({ name: values.name, email: values.email, phone: values.phone })).unwrap();
      message.success("Profile updated!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="My Profile" style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div
          style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
          onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }} />
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
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
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
            <Form.Item name="name"  label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" loading={saving}>Save Changes</Button>
      </Form>
    </Card>
  );
};
