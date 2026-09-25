import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar, Button, DatePicker, Drawer, Dropdown, Empty, Flex, Form, Input,
  Modal, Select, Skeleton, Tooltip, Typography, message,
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined,
  ExclamationCircleOutlined, MoreOutlined, PlusOutlined, SnippetsOutlined,
  StopOutlined, SyncOutlined, UserOutlined,
} from "@ant-design/icons";
import { AlertTriangle, ChevronDown, Flame, Minus } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  createTask, deleteTask, fetchAssignableUsers, fetchTasks, updateTask,
} from "../../../features/taskSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, modalTitle, statGrid } from "../../../styles/pageStyles";
import { categoricalColorFor } from "../../../utils/colorPalette";

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/* ── Config ─────────────────────────────────────────────────────────── */
// col.color feeds the --tm-col custom property on each column; every tint (header wash, drop-zone
// border, card hover shadow) is mixed from that one variable in _pages.scss.
const COLUMNS = [
  { key: "todo",        label: "To Do",       color: "var(--warning)", icon: <ClockCircleOutlined /> },
  { key: "in_progress", label: "In Progress", color: "var(--primary)", icon: <SyncOutlined />        },
  { key: "done",        label: "Done",        color: "var(--success)", icon: <CheckCircleOutlined /> },
  { key: "cancelled",   label: "Cancelled",   color: "var(--text-secondary)", icon: <StopOutlined /> },
];

const PRIORITY = {
  low:    { label: "Low",    color: "var(--text-secondary)", icon: <Minus size={9} /> },
  medium: { label: "Medium", color: "var(--warning-hover)", icon: <ChevronDown size={9} /> },
  high:   { label: "High",   color: "var(--orange)", icon: <Flame size={9} /> },
  urgent: { label: "Urgent", color: "var(--danger-hover)", icon: <AlertTriangle size={9} /> },
};
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const STATUS_LABEL   = { todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled" };
const CLOSED = new Set(["done", "cancelled"]);

// Stable per-person color (same user always gets the same avatar color across renders/pages).
const avatarBg = (name = "") => categoricalColorFor(name);

/* ── Date helpers ───────────────────────────────────────────────────── */
// A closed task is never "overdue" or "due today": the work is finished or withdrawn, so a date
// in the past says nothing the board should act on.
const isOverdue  = (t) => Boolean(t.dueDate) && !CLOSED.has(t.status) && dayjs(t.dueDate).isBefore(dayjs(), "day");
const isDueToday = (t) => Boolean(t.dueDate) && !CLOSED.has(t.status) && dayjs(t.dueDate).isSame(dayjs(), "day");
const isUnassigned = (t) => !CLOSED.has(t.status) && !(t.assignedTo?.length > 0);

// Inside a column: late work first, then whatever is due soonest, undated last, newest first among
// equals. The API returns creation order, which buries the task that actually needs attention.
const sortTasks = (list) => {
  const due = (t) => (t.dueDate ? dayjs(t.dueDate).valueOf() : Number.MAX_SAFE_INTEGER);
  return [...list].sort((a, b) => {
    const late = (isOverdue(a) ? 0 : 1) - (isOverdue(b) ? 0 : 1);
    if (late !== 0) return late;
    const byDue = due(a) - due(b);
    if (byDue !== 0) return byDue;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

/* ── Priority pill ──────────────────────────────────────────────────── */
const PriorityPill = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: p.color,
      background: `color-mix(in srgb, ${p.color} 9%, transparent)`, padding: "2px 8px", borderRadius: 99,
    }}>
      {p.icon} {p.label.toUpperCase()}
    </span>
  );
};

/* ── Due date chip ──────────────────────────────────────────────────── */
const DueChip = ({ task }) => {
  if (!task.dueDate) return null;
  const d       = dayjs(task.dueDate);
  const overdue = isOverdue(task);
  const today   = isDueToday(task);
  const color   = overdue ? "var(--danger)" : today ? "var(--warning-hover)" : "var(--text-muted)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color,
      background: overdue ? "var(--danger-light)" : today ? "var(--warning-light)" : "var(--surface-soft)",
      padding: "2px 7px", borderRadius: 6,
    }}>
      <ClockCircleOutlined style={{ fontSize: 9 }} />
      {overdue ? `Overdue · ${d.fromNow(true)} late` : today ? "Due today" : d.format("DD MMM")}
    </span>
  );
};

/* ── Assignee faces ─────────────────────────────────────────────────── */
const Faces = ({ users = [], size = 22 }) => {
  if (users.length === 0) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
      }}>
        <UserOutlined style={{ fontSize: 10 }} /> Unassigned
      </span>
    );
  }
  return (
    <Avatar.Group max={{ count: 3 }} size={size}>
      {users.map((u) => (
        <Tooltip key={u._id} title={u.name}>
          <Avatar size={size} src={u.avatar}
            style={{ background: avatarBg(u.name), fontSize: 9, border: "1.5px solid var(--surface)" }}
          >
            {!u.avatar && u.name?.[0]?.toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
};

/* ── Task Card ──────────────────────────────────────────────────────── */
const TaskCard = ({ task, onOpen, onMenu, onDragStart, onDragEnd, isDragging }) => {
  const overdue = isOverdue(task);
  const classes = ["tm-card"];
  if (overdue) classes.push("is-overdue");
  if (isDragging) classes.push("is-dragging");
  if (task.status === "cancelled") classes.push("is-muted");

  return (
    <div
      className={classes.join(" ")}
      draggable
      role="button"
      tabIndex={0}
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(task); } }}
    >
      <Flex align="center" justify="space-between" style={{ marginBottom: 7 }}>
        <PriorityPill priority={task.priority} />
      </Flex>

      <div className="tm-card-title">{task.title}</div>

      {task.description && <div className="tm-card-desc">{task.description}</div>}

      <Flex align="center" justify="space-between" wrap="wrap" gap={6}>
        <DueChip task={task} />
        <Faces users={task.assignedTo || []} />
      </Flex>

      <Dropdown menu={onMenu(task)} trigger={["click"]} placement="bottomRight">
        <button
          className="tm-card-menu"
          aria-label="Task actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreOutlined />
        </button>
      </Dropdown>
    </div>
  );
};

/* ── Kanban Column ──────────────────────────────────────────────────── */
const KanbanColumn = ({ col, tasks, onOpen, onMenu, onAdd, dragState, onDragStart, onDragEnd, onDrop }) => {
  const [over, setOver] = useState(false);

  return (
    <div className="tm-col" style={{ "--tm-col": col.color }}>
      <div className="tm-col-head">
        <span className="tm-col-title">
          <span className="tm-col-icon">{col.icon}</span>
          {col.label}
        </span>
        <span className="tm-col-count">{tasks.length}</span>
      </div>

      <div
        className={over ? "tm-drop is-over" : "tm-drop"}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); onDrop(col.key); }}
      >
        {tasks.length === 0 && (
          <div className="tm-col-empty">{dragState ? "Drop here" : "Nothing here"}</div>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t._id} task={t}
            onOpen={onOpen} onMenu={onMenu}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragState?.task?._id === t._id}
          />
        ))}
      </div>

      <button className="tm-add" onClick={() => onAdd(col.key)}>
        <PlusOutlined style={{ fontSize: 10 }} /> Add task
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
const TaskManagement = () => {
  const dispatch = useDispatch();
  const {
    items: tasks = [], loading = false,
    assignableUsers = [], usersLoading = false,
  } = useSelector((s) => s.tasks || {});

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [detail,      setDetail]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [initStatus,  setInitStatus]  = useState("todo");
  const [filterPri,   setFilterPri]   = useState(null);
  const [filterWho,   setFilterWho]   = useState(null);
  const [quick,       setQuick]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [dragState,   setDragState]   = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const openCreate = (status = "todo") => {
    setEditTask(null);
    setInitStatus(status);
    form.resetFields();
    form.setFieldsValue({ priority: "medium", status });
    dispatch(fetchAssignableUsers());
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    form.setFieldsValue({
      title:       task.title,
      description: task.description,
      priority:    task.priority,
      status:      task.status,
      dueDate:     task.dueDate ? dayjs(task.dueDate) : null,
      assignedTo:  task.assignedTo?.map((u) => u._id) || [],
    });
    dispatch(fetchAssignableUsers());
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title:       values.title,
        description: values.description || "",
        priority:    values.priority,
        status:      values.status || initStatus,
        dueDate:     values.dueDate ? values.dueDate.toISOString() : null,
        assignedTo:  values.assignedTo || [],
      };
      if (editTask) {
        await dispatch(updateTask({ id: editTask._id, ...payload })).unwrap();
        message.success("Task updated");
      } else {
        await dispatch(createTask(payload)).unwrap();
        message.success("Task created");
      }
      setModalOpen(false);
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (task) => {
    Modal.confirm({
      title: "Delete this task?",
      icon: <ExclamationCircleOutlined />,
      content: task.title,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteTask(task._id)).unwrap();
          setDetail((d) => (d?._id === task._id ? null : d));
          message.success("Task deleted");
        } catch (err) {
          message.error(typeof err === "string" ? err : "Failed to delete task");
        }
      },
    });
  };

  // One path for every status change — the ⋯ menu, the drawer buttons and a drag all land here.
  const moveTo = async (task, status) => {
    if (!task || task.status === status) return;
    try {
      await dispatch(updateTask({ id: task._id, status })).unwrap();
      setDetail((d) => (d?._id === task._id ? { ...d, status } : d));
      message.success(`Moved to ${STATUS_LABEL[status]}`);
    } catch {
      message.error("Failed to move task");
    }
  };

  const handleDrop = async (targetStatus) => {
    if (!dragState?.task) return;
    const { task } = dragState;
    setDragState(null);
    await moveTo(task, targetStatus);
  };

  // Dragging works with a mouse; this menu is how the same move happens on a laptop trackpad or a
  // phone, where a cross-column drag is not realistic.
  const cardMenu = (task) => ({
    items: [
      { key: "open", label: "Open details", icon: <SnippetsOutlined /> },
      { key: "edit", label: "Edit task", icon: <EditOutlined /> },
      { type: "divider" },
      ...COLUMNS.filter((c) => c.key !== task.status).map((c) => ({
        key: `move:${c.key}`,
        label: `Move to ${c.label}`,
        icon: c.icon,
      })),
      { type: "divider" },
      { key: "delete", label: "Delete", icon: <DeleteOutlined />, danger: true },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "open") setDetail(task);
      else if (key === "edit") openEdit(task);
      else if (key === "delete") handleDelete(task);
      else if (key.startsWith("move:")) moveTo(task, key.slice(5));
    },
  });

  /* ── Derived data ─────────────────────────────────────────────────── */
  const QUICK = useMemo(() => ({
    open:       (t) => !CLOSED.has(t.status),
    today:      isDueToday,
    overdue:    isOverdue,
    unassigned: isUnassigned,
  }), []);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => tasks.filter((t) => {
    if (filterPri && t.priority !== filterPri) return false;
    if (filterWho && !(t.assignedTo || []).some((u) => u._id === filterWho)) return false;
    if (quick && !QUICK[quick](t)) return false;
    if (q && !t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    return true;
  }), [tasks, filterPri, filterWho, quick, q, QUICK]);

  const byColumn = useMemo(() => Object.fromEntries(
    COLUMNS.map((c) => [c.key, sortTasks(filtered.filter((t) => t.status === c.key))])
  ), [filtered]);

  // Everyone who currently holds a task — no extra request, and it lists exactly the people worth
  // filtering by.
  const assigneeOptions = useMemo(() => {
    const seen = new Map();
    tasks.forEach((t) => (t.assignedTo || []).forEach((u) => { if (!seen.has(u._id)) seen.set(u._id, u.name); }));
    return [...seen.entries()]
      .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))
      .map(([value, label]) => ({ value, label }));
  }, [tasks]);

  const counts = useMemo(() => ({
    open:       tasks.filter(QUICK.open).length,
    today:      tasks.filter(isDueToday).length,
    overdue:    tasks.filter(isOverdue).length,
    unassigned: tasks.filter(isUnassigned).length,
  }), [tasks, QUICK]);

  // Cancelled work was withdrawn, not left undone — counting it as incomplete makes a board that
  // is actually finished read as 0%.
  const doneCount    = tasks.filter((t) => t.status === "done").length;
  const trackedCount = tasks.filter((t) => t.status !== "cancelled").length;
  const pct = trackedCount ? Math.round((doneCount / trackedCount) * 100) : 0;

  const STATS = [
    { key: "open",       label: "Open",       value: counts.open,       color: "var(--primary)", icon: <SyncOutlined />        },
    { key: "today",      label: "Due today",  value: counts.today,      color: "var(--warning)", icon: <ClockCircleOutlined /> },
    { key: "overdue",    label: "Overdue",    value: counts.overdue,    color: "var(--danger)",  icon: <AlertTriangle size={17} /> },
    { key: "unassigned", label: "Unassigned", value: counts.unassigned, color: "var(--purple)",  icon: <UserOutlined />        },
  ];

  const isFiltered = Boolean(filterPri || filterWho || quick || q);
  const clearFilters = () => { setFilterPri(null); setFilterWho(null); setQuick(null); setSearch(""); };

  return (
    <>
      <PageHeader
        title="Task Management"
        subtitle="Create, assign and track tasks across your school"
        icon={<SnippetsOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            New Task
          </Button>
        }
      />

      <div className="page-wrapper">
        {/* ── Stat tiles — each one is also a filter ── */}
        <div style={{ ...statGrid(170), marginBottom: 16 }}>
          {STATS.map((s) => (
            <button
              key={s.key}
              className={quick === s.key ? "tm-stat is-active" : "tm-stat"}
              style={{ "--tm-col": s.color }}
              disabled={s.value === 0 && quick !== s.key}
              onClick={() => setQuick((cur) => (cur === s.key ? null : s.key))}
            >
              <div style={iconWell(s.color, 42)}>
                {React.cloneElement(s.icon, { style: { fontSize: 17 } })}
              </div>
              <div className="u-grow-min">
                <div className="tm-stat-value">{s.value}</div>
                <div className="tm-stat-label">{s.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Progress + filter toolbar ── */}
        <div className="section-panel" style={{ padding: "12px 16px", marginBottom: 16 }}>
          <Flex align="center" justify="space-between" gap={12} wrap="wrap">
            <Flex align="center" gap={10}>
              <div style={{ width: 120, height: 6, background: "var(--border-muted)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--success)", borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              <Text className="u-meta">
                <b style={{ color: "var(--success)" }}>{pct}%</b>
                {" · "}
                {doneCount} of {trackedCount} done
                {tasks.length !== trackedCount && ` · ${tasks.length - trackedCount} cancelled`}
              </Text>
            </Flex>

            <Flex gap={8} align="center" wrap="wrap">
              <Input.Search
                placeholder="Search tasks…"
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                style={{ width: 210 }}
              />
              <Select
                allowClear
                placeholder="All priorities"
                style={{ width: 145 }}
                value={filterPri}
                onChange={setFilterPri}
              >
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ color: PRIORITY[k].color, fontWeight: 600 }}>{v}</span>
                  </Option>
                ))}
              </Select>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Anyone"
                style={{ width: 160 }}
                value={filterWho}
                onChange={setFilterWho}
                options={assigneeOptions}
              />
              {isFiltered && <Button onClick={clearFilters}>Clear</Button>}
            </Flex>
          </Flex>

          {isFiltered && (
            <Text className="u-meta u-mt-2" style={{ display: "block" }}>
              Showing {filtered.length} of {tasks.length} tasks
            </Text>
          )}
        </div>

        {/* ── Board ── */}
        {loading && tasks.length === 0 ? (
          <div className="tm-board">
            {COLUMNS.map((c) => (
              <div key={c.key} className="tm-col" style={{ "--tm-col": c.color }}>
                <div className="tm-col-head"><Skeleton active title={{ width: 90 }} paragraph={false} /></div>
                <div className="tm-drop"><Skeleton active paragraph={{ rows: 4 }} /></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="page-card" style={{ padding: "56px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>No tasks yet</div>
                  <Text className="u-meta">Create a task, assign it to your staff and track it across the board.</Text>
                </>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
                Create your first task
              </Button>
            </Empty>
          </div>
        ) : filtered.length === 0 ? (
          <div className="page-card" style={{ padding: "48px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks match these filters">
              <Button onClick={clearFilters}>Clear filters</Button>
            </Empty>
          </div>
        ) : (
          <div className="tm-board">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key} col={col}
                tasks={byColumn[col.key] || []}
                onOpen={setDetail}
                onMenu={cardMenu}
                onAdd={openCreate}
                dragState={dragState}
                onDragStart={(t) => setDragState({ task: t })}
                onDragEnd={() => setDragState(null)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width={460}
        title="Task details"
        footer={
          detail && (
            <Flex gap={8} wrap="wrap">
              {detail.status !== "done" ? (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => moveTo(detail, "done")}>
                  Mark done
                </Button>
              ) : (
                <Button icon={<SyncOutlined />} onClick={() => moveTo(detail, "in_progress")}>
                  Reopen
                </Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => { openEdit(detail); setDetail(null); }}>Edit</Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(detail)}>Delete</Button>
            </Flex>
          )
        }
      >
        {detail && (
          <>
            <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 10 }}>
              <PriorityPill priority={detail.priority} />
              <DueChip task={detail} />
            </Flex>

            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 12 }}>
              {detail.title}
            </div>

            {detail.description ? (
              <Paragraph style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)", marginBottom: 20 }}>
                {detail.description}
              </Paragraph>
            ) : (
              <Text className="u-meta" style={{ display: "block", marginBottom: 20 }}>No description</Text>
            )}

            <div className="tm-facts">
              <span className="tm-fact-label">Status</span>
              <Select
                value={detail.status}
                onChange={(v) => moveTo(detail, v)}
                style={{ width: "100%", maxWidth: 220 }}
                options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))}
              />

              <span className="tm-fact-label">Due</span>
              <span>{detail.dueDate ? dayjs(detail.dueDate).format("DD MMM YYYY") : "—"}</span>

              <span className="tm-fact-label">Assigned to</span>
              <span>
                {detail.assignedTo?.length
                  ? detail.assignedTo.map((u) => u.name).join(", ")
                  : "Nobody yet"}
              </span>

              <span className="tm-fact-label">Assigned by</span>
              <span>{detail.assignedBy?.name || "—"}</span>

              <span className="tm-fact-label">Created</span>
              <span>{detail.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY") : "—"}</span>

              {detail.completedAt && (
                <>
                  <span className="tm-fact-label">Completed</span>
                  <span>{dayjs(detail.completedAt).format("DD MMM YYYY")}</span>
                </>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={modalTitle(
          <SnippetsOutlined />,
          editTask ? "Edit Task" : "Create New Task",
          editTask ? "Update task details" : "Add a new task to the board",
        )}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="u-mt-4">
          <Form.Item label="Task Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Enter task title" size="large" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Describe the task (optional)" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item label="Priority" name="priority" initialValue="medium">
              <Select size="large">
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ color: PRIORITY[k].color, fontWeight: 600 }}>{v}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Status" name="status" initialValue={initStatus}>
              <Select size="large">
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Due Date" name="dueDate">
            <DatePicker className="u-full" size="large" format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item label="Assign To" name="assignedTo">
            <Select
              mode="multiple"
              placeholder="Search and select users…"
              showSearch
              filterOption={(input, opt) => opt?.label?.toLowerCase().includes(input.toLowerCase())}
              loading={usersLoading}
              optionLabelProp="label"
              size="large"
            >
              {assignableUsers.map((u) => (
                <Option key={u._id} value={u._id} label={u.name}>
                  <Flex align="center" gap={8}>
                    <Avatar size={20} src={u.avatar} style={{ background: avatarBg(u.name), fontSize: 9 }}>
                      {!u.avatar && u.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <span style={{ fontSize: 13 }}>{u.name}</span>
                    <span className="u-meta-xs">{u.role}</span>
                  </Flex>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Flex gap={10} className="u-mt-3">
            <Button block size="large" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button block size="large" type="primary" htmlType="submit" loading={saving}>
              {editTask ? "Save Changes" : "Create Task"}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </>
  );
};

export default TaskManagement;
