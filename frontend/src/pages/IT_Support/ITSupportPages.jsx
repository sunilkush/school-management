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
import { useTheme } from "../../context/ThemeContext";
import {
  CameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  WarningOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { currentUser, updateUser, changePassword as changePasswordAction } from "../../features/authSlice";
import {
  createTicket,
  fetchTickets,
  resolveTicket,
  updateTicketStatus,
} from "../../features/supportTicketSlice";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";
import { avatarStyle as _avatarStyle, pageCard as _pageCard, pageWrapper as _pageWrapper } from "../../styles/pageStyles";
import {
  Camera as _Camera, Save as _Save, Loader2 as _Loader2,
  Mail as _Mail, Phone as _Phone, Building2 as _Building2, Shield as _Shield,
  User as _User, Lock as _Lock, Eye as _Eye, EyeOff as _EyeOff, CheckCircle as _CheckCircle,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";

const { Title, Text } = Typography;

const PRIORITY_COLOR = { low: "green", medium: "orange", high: "red" };
const STATUS_COLOR = { Open: "orange", "In Progress": "blue", Resolved: "green" };
const TASK_STATUS_COLOR = { pending: "orange", in_progress: "blue", done: "green" };

/* ─────────────────────────────────────────────────────── */
/* Dashboard                                               */
/* ─────────────────────────────────────────────────────── */
export const ITSupportDashboard = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { tickets, loading } = useSelector((s) => s.supportTickets || { tickets: [], loading: false });

  useEffect(() => { dispatch(fetchTickets()); }, [dispatch]);

  const open     = tickets.filter((t) => t.status === "Open").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const inProg   = tickets.filter((t) => t.status === "In Progress").length;
  const closed   = tickets.filter((t) => t.status === "Closed").length;

  const card       = isDark ? "#141C2E" : "#FFFFFF";
  const cardBorder = isDark ? "#1E2A3B" : "#E2E8F0";
  const textPri    = isDark ? "#E8EDF7" : "#0F172A";
  const textSec    = isDark ? "#64748B" : "#64748B";
  const shadow     = isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(37,99,235,0.07)";
  const divider    = isDark ? "#1E2A3B" : "#E2E8F0";
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
            onRow={(r) => ({
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
    await dispatch(createTicket({ title: values.title, priority: values.priority, description: values.description || "" }));
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
    { title: "Title",    dataIndex: "title",    key: "title",    ellipsis: true },
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
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="Brief summary of the issue" />
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
        <Text>Title: <strong>{resolveModal?.title}</strong></Text>
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
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pwdLoading,     setPwdLoading]     = useState(false);
  const [saveMsg,        setSaveMsg]        = useState({ text: "", error: false });
  const [pwdMsg,         setPwdMsg]         = useState({ text: "", error: false });
  const [profileForm,    setProfileForm]    = useState({ name: "", email: "", phone: "" });
  const [pwdForm,        setPwdForm]        = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd,        setShowPwd]        = useState({ current: false, newPwd: false, confirm: false });

  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);
  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
  }, [user]);

  const roleName = user?.role?.name || "IT Support";
  const initials = (profileForm.name || "IT").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || "", email: user?.email || "", phone: user?.phone, avatarFile: file })).unwrap();
      setSaveMsg({ text: "Profile photo updated!", error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === "string" ? err : "Failed to update photo", error: true });
    } finally { setUploadingPhoto(false); e.target.value = ""; }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) { setSaveMsg({ text: "Name and email are required", error: true }); return; }
    setSaving(true); setSaveMsg({ text: "", error: false });
    try {
      await dispatch(updateUser({ name: profileForm.name, email: profileForm.email, phone: profileForm.phone })).unwrap();
      setSaveMsg({ text: "Profile updated successfully!", error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === "string" ? err : "Update failed", error: true });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { setPwdMsg({ text: "All fields are required", error: true }); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdMsg({ text: "Passwords do not match", error: true }); return; }
    if (pwdForm.newPwd.length < 6) { setPwdMsg({ text: "At least 6 characters required", error: true }); return; }
    setPwdLoading(true); setPwdMsg({ text: "", error: false });
    try {
      await dispatch(changePasswordAction({ oldPassword: pwdForm.current, newPassword: pwdForm.newPwd })).unwrap();
      setPwdMsg({ text: "Password changed successfully!", error: false });
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      setPwdMsg({ text: typeof err === "string" ? err : "Failed to change password", error: true });
    } finally { setPwdLoading(false); }
  };

  const _fieldStyle = { display: "flex", alignItems: "center", border: "1px solid var(--border-muted)", borderRadius: 8, padding: "8px 12px", gap: 8, background: "var(--surface)" };

  const _InputField = ({ icon, label, name, value, onChange, type = "text", required = false }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <div style={_fieldStyle}>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
        <input type={type} name={name} value={value || ""} onChange={onChange} required={required}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
      </div>
    </label>
  );

  return (
    <div style={_pageWrapper}>
      <PageHeader title="My Profile" subtitle="View and update your personal information" icon={<UserOutlined />} />

      {/* Hero Card */}
      <div style={{ ..._pageCard, marginTop: 16, padding: "20px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0, cursor: "pointer" }} onClick={() => !uploadingPhoto && fileInputRef.current?.click()} title="Click to change photo">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-muted)", display: "block" }} />
                : <div style={_avatarStyle(profileForm.name || "IT", 56)}>{initials}</div>
              }
              {uploadingPhoto
                ? <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="small" /></div>
                : <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--primary, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                    <_Camera style={{ width: 10, height: 10, color: "#fff" }} />
                  </div>
              }
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{profileForm.name || roleName}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{profileForm.email || "No email"}</div>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, background: "rgba(220,252,231,0.2)", color: "#22C55E", padding: "2px 10px", borderRadius: 99, fontWeight: 600 }}>
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, flex: "1 1 340px", maxWidth: 480 }}>
            {[
              { icon: <_Shield style={{ width: 14, height: 14 }} />, label: "Role", value: roleName },
              { icon: <_Building2 style={{ width: 14, height: 14 }} />, label: "School", value: user?.school?.name || "—" },
              { icon: <_Phone style={{ width: 14, height: 14 }} />, label: "Phone", value: profileForm.phone || "Not set" },
            ].map((b) => (
              <div key={b.label} style={{ borderRadius: 10, border: "1px solid var(--border-muted)", background: "var(--surface-soft)", padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{b.icon}{b.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
        <div style={{ ..._pageCard, padding: "20px 24px", gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Basic Profile</div>
            <button type="submit" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--primary, #7c3aed)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, opacity: saving ? 0.6 : 1 }}>
              {saving ? <_Loader2 style={{ width: 14, height: 14 }} /> : <_Save style={{ width: 14, height: 14 }} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Account Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
            <_InputField icon={<_User style={{ width: 14, height: 14 }} />} label="Full Name" name="name" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} required />
            <_InputField icon={<_Mail style={{ width: 14, height: 14 }} />} label="Email" name="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} required />
            <_InputField icon={<_Phone style={{ width: 14, height: 14 }} />} label="Phone" name="phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          {saveMsg.text && <p style={{ fontSize: 13, color: saveMsg.error ? "#EF4444" : "#22C55E", margin: "8px 0 0" }}>{saveMsg.text}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ..._pageCard, padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><_Building2 style={{ width: 14, height: 14 }} /> School</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{user?.school?.name || "—"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{roleName}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, background: "rgba(220,252,231,0.4)", color: "#15803D", padding: "3px 10px", borderRadius: 99, fontWeight: 600, width: "fit-content", marginTop: 4 }}>
                <_CheckCircle style={{ width: 11, height: 11 }} /> {user?.isActive ? "Active Member" : "Inactive"}
              </span>
            </div>
          </div>
          <div style={{ ..._pageCard, padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><_Mail style={{ width: 14, height: 14 }} /> Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Email</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-all" }}>{profileForm.email || "—"}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Phone</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{profileForm.phone || "Not set"}</div></div>
            </div>
          </div>
        </div>
      </form>

      {/* Password Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
        <form onSubmit={handleChangePassword} style={{ ..._pageCard, padding: "20px 24px", gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>Change Password</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Update your account password</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Password</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
            {[
              { key: "current", label: "Current Password", placeholder: "Enter current password" },
              { key: "newPwd",  label: "New Password",     placeholder: "Min 6 characters" },
              { key: "confirm", label: "Confirm Password", placeholder: "Repeat new password" },
            ].map(({ key, label, placeholder }) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
                <div style={{ ..._fieldStyle, paddingRight: 8 }}>
                  <_Lock style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
                  <input type={showPwd[key] ? "text" : "password"} value={pwdForm[key]} placeholder={placeholder} onChange={(e) => setPwdForm((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
                  <button type="button" onClick={() => setShowPwd((s) => ({ ...s, [key]: !s[key] }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4 }}>
                    {showPwd[key] ? <_EyeOff style={{ width: 15, height: 15 }} /> : <_Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </label>
            ))}
          </div>
          {pwdMsg.text && <p style={{ fontSize: 13, color: pwdMsg.error ? "#EF4444" : "#22C55E", margin: "8px 0 0" }}>{pwdMsg.text}</p>}
          <button type="submit" disabled={pwdLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary, #7c3aed)", color: "#fff", border: "none", cursor: pwdLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: pwdLoading ? 0.6 : 1 }}>
            {pwdLoading ? <_Loader2 style={{ width: 14, height: 14 }} /> : <_Lock style={{ width: 14, height: 14 }} />}
            {pwdLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
        <div style={{ ..._pageCard, padding: "16px 20px", background: "var(--surface-soft)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>Password Tips</div>
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {["At least 8 characters", "Mix uppercase & lowercase", "Include numbers & symbols", "Avoid your name or email"].map((tip) => (
              <li key={tip} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
                <_CheckCircle style={{ width: 13, height: 13, color: "#10B981", flexShrink: 0 }} />{tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
