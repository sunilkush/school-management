import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar, Button, DatePicker, Flex, Form, Input,
  Modal, Popconfirm, Select, Skeleton, Tooltip, Typography, message,
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined,
  PlusOutlined, SnippetsOutlined, StopOutlined, SyncOutlined,
} from "@ant-design/icons";
import { AlertTriangle, ChevronDown, Flame, Minus } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  createTask, deleteTask, fetchAssignableUsers, fetchTasks, updateTask,
} from "../../../features/taskSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, modalTitle, pageWrapper, sectionPanel, statGrid } from "../../../styles/pageStyles";
import { categoricalColorFor } from "../../../utils/colorPalette";

dayjs.extend(relativeTime);

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/* ── Config ─────────────────────────────────────────────────────────── */
// col.color values are var(--token) references. Every consumer below that used to derive a
// tinted border/background/shadow via hex-alpha-suffix concatenation (e.g. `${col.color}22`)
// now wraps the same math in color-mix(in srgb, ${col.color} N%, transparent) instead, which
// works with both literal hex and var() color strings.
const COLUMNS = [
  { key: "todo",        label: "To Do",       color: "var(--warning)", icon: <ClockCircleOutlined /> },
  { key: "in_progress", label: "In Progress",  color: "var(--primary)", icon: <SyncOutlined />        },
  { key: "done",        label: "Done",         color: "var(--success)", icon: <CheckCircleOutlined /> },
  { key: "cancelled",   label: "Cancelled",    color: "var(--text-secondary)", icon: <StopOutlined />        },
];

// Same reasoning as COLUMNS above: PRIORITY[x].color is consumed via color-mix() in PriorityPill.
const PRIORITY = {
  low:    { label: "Low",    color: "var(--text-secondary)", icon: <Minus size={9} /> },
  medium: { label: "Medium", color: "var(--warning-hover)", icon: <ChevronDown size={9} /> },
  high:   { label: "High",   color: "var(--orange)", icon: <Flame size={9} /> },
  urgent: { label: "Urgent", color: "var(--danger-hover)", icon: <AlertTriangle size={9} /> },
};
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const STATUS_LABEL   = { todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled" };

// Stable per-person color (same user always gets the same avatar color across renders/pages).
const avatarBg = (name = "") => categoricalColorFor(name);

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
const DueChip = ({ date, status }) => {
  if (!date) return null;
  const d       = dayjs(date);
  const overdue = d.isBefore(dayjs(), "day") && status !== "done" && status !== "cancelled";
  const today   = d.isSame(dayjs(), "day");
  const color   = overdue ? "var(--danger)" : today ? "var(--warning-hover)" : "var(--text-muted)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color,
      background: overdue ? "var(--danger-light)" : today ? "var(--warning-light)" : "var(--surface-soft)",
      padding: "2px 7px", borderRadius: 6,
    }}>
      <ClockCircleOutlined style={{ fontSize: 9 }} />
      {overdue ? "Overdue · " : today ? "Today · " : ""}{d.format("DD MMM")}
    </span>
  );
};

/* ── Task Card ──────────────────────────────────────────────────────── */
const TaskCard = ({ task, col, onEdit, onDelete, onDragStart, onDragEnd, isDragOver }) => {
  const [hovered, setHovered] = useState(false);
  const isOverdue = task.dueDate
    && dayjs(task.dueDate).isBefore(dayjs(), "day")
    && task.status !== "done" && task.status !== "cancelled";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        padding: "12px 14px",
        border: `1px solid ${hovered ? `color-mix(in srgb, ${col.color} 31%, transparent)` : "var(--border-muted)"}`,
        borderLeft: `3px solid ${isOverdue ? "var(--danger)" : col.color}`,
        boxShadow: hovered
          ? `0 6px 20px color-mix(in srgb, ${col.color} 13%, transparent)`
          : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.18s, border-color 0.18s, opacity 0.15s",
        position: "relative",
        cursor: "grab",
        opacity: isDragOver ? 0.42 : 1,
      }}
    >
      {/* Priority + overdue badge */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
        <PriorityPill priority={task.priority} />
        {isOverdue && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--danger)",
            background: "var(--danger-light)", borderRadius: 99, padding: "1px 7px",
          }}>
            OVERDUE
          </span>
        )}
      </Flex>

      {/* Title */}
      <div style={{
        fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.45,
        marginBottom: 6,
        paddingRight: hovered ? 60 : 0,
        transition: "padding 0.15s",
      }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 8,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {task.description}
        </div>
      )}

      {/* Footer */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={6}>
        <DueChip date={task.dueDate} status={task.status} />
        {task.assignedTo?.length > 0 && (
          <Avatar.Group maxCount={3} size={22}>
            {task.assignedTo.map((u) => (
              <Tooltip key={u._id} title={u.name}>
                <Avatar size={22} src={u.avatar}
                  style={{
                    background: avatarBg(u.name), fontSize: 9,
                    border: "1.5px solid var(--surface)",
                  }}
                >
                  {!u.avatar && u.name?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        )}
      </Flex>

      {/* Hover actions */}
      {hovered && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", gap: 4, zIndex: 2,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            style={{
              background: "var(--surface-soft)",
              border: "1px solid var(--border-muted)",
              borderRadius: 7, padding: "4px 7px", cursor: "pointer",
              color: "var(--primary)",
            }}
          >
            <EditOutlined style={{ fontSize: 11 }} />
          </button>
          <Popconfirm
            title="Delete this task?"
            onConfirm={() => onDelete(task._id)}
            okText="Delete" okButtonProps={{ danger: true }}
          >
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--danger-light)", border: "1px solid rgba(var(--danger-rgb), 0.3)",
                borderRadius: 7, padding: "4px 7px", cursor: "pointer", color: "var(--danger)",
              }}
            >
              <DeleteOutlined style={{ fontSize: 11 }} />
            </button>
          </Popconfirm>
        </div>
      )}
    </div>
  );
};

/* ── Add task button ────────────────────────────────────────────────── */
const AddBtn = ({ col, onAdd }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onAdd(col.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 14px", width: "100%",
        background: hov ? `color-mix(in srgb, ${col.color} 4%, transparent)` : "transparent",
        border: `1.5px dashed ${hov ? `color-mix(in srgb, ${col.color} 44%, transparent)` : `color-mix(in srgb, ${col.color} 16%, transparent)`}`,
        borderTop: "none",
        borderRadius: "0 0 14px 14px",
        cursor: "pointer",
        color: hov ? col.color : "var(--text-muted)",
        fontSize: 12, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6,
        transition: "all 0.15s",
      }}
    >
      <PlusOutlined style={{ fontSize: 10 }} /> Add task
    </button>
  );
};

/* ── Kanban Column ──────────────────────────────────────────────────── */
const KanbanColumn = ({ col, tasks, onEdit, onDelete, onAdd, dragState, onDragStart, onDragEnd, onDrop }) => {
  const [over, setOver] = useState(false);

  return (
    <div style={{ flex: "1 1 260px", minWidth: 260, maxWidth: 310, display: "flex", flexDirection: "column" }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: `color-mix(in srgb, ${col.color} 5%, transparent)`,
        border: `1px solid color-mix(in srgb, ${col.color} 16%, transparent)`,
        borderBottom: "none",
        borderRadius: "14px 14px 0 0",
      }}>
        <Flex align="center" gap={8}>
          <span style={{ color: col.color, fontSize: 14 }}>{col.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{col.label}</span>
        </Flex>
        <Flex align="center" gap={8}>
          {tasks.length > 0 && (
            <div style={{
              width: 44, height: 4, borderRadius: 4,
              background: "var(--border-muted)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 4, background: col.color,
                width: col.key === "done" ? "100%" : "40%",
                opacity: 0.7,
              }} />
            </div>
          )}
          <span style={{
            background: col.color, color: "#fff",
            fontSize: 11, fontWeight: 800,
            borderRadius: 99, padding: "1px 9px", minWidth: 22,
            textAlign: "center",
          }}>
            {tasks.length}
          </span>
        </Flex>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); onDrop(col.key); }}
        style={{
          flex: 1, minHeight: 240,
          padding: "10px 10px 8px",
          display: "flex", flexDirection: "column", gap: 8,
          border: `1px solid ${over ? `color-mix(in srgb, ${col.color} 33%, transparent)` : `color-mix(in srgb, ${col.color} 13%, transparent)`}`,
          borderTop: "none",
          background: over ? `color-mix(in srgb, ${col.color} 3%, transparent)` : "var(--surface-page)",
          transition: "all 0.15s",
          boxShadow: over ? `inset 0 0 0 2px color-mix(in srgb, ${col.color} 16%, transparent)` : "none",
        }}
      >
        {tasks.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6,
            color: "var(--text-muted)", fontSize: 12, fontWeight: 500,
            border: "1.5px dashed var(--border-muted)",
            borderRadius: 10, minHeight: 90, margin: "2px 0",
          }}>
            <span style={{ fontSize: 20, opacity: 0.4 }}>
              {col.key === "todo" ? "📝" : col.key === "in_progress" ? "⚡" : col.key === "done" ? "✅" : "🚫"}
            </span>
            <span>{dragState ? "Drop here" : "No tasks"}</span>
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t._id} task={t} col={col}
            onEdit={onEdit} onDelete={onDelete}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragOver={dragState?.task?._id === t._id}
          />
        ))}
      </div>

      <AddBtn col={col} onAdd={onAdd} />
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
  const [saving,      setSaving]      = useState(false);
  const [initStatus,  setInitStatus]  = useState("todo");
  const [filterPri,   setFilterPri]   = useState(null);
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

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTask(id)).unwrap();
      message.success("Task deleted");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete task");
    }
  };

  const handleDrop = async (targetStatus) => {
    if (!dragState?.task) return;
    const { task } = dragState;
    setDragState(null);
    if (task.status === targetStatus) return;
    try {
      await dispatch(updateTask({ id: task._id, status: targetStatus })).unwrap();
    } catch {
      message.error("Failed to move task");
    }
  };

  /* ── Derived data ─────────────────────────────────────────────────── */
  const q        = search.toLowerCase();
  const filtered = tasks.filter((t) => {
    if (filterPri && t.priority !== filterPri) return false;
    if (q && !t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    return true;
  });
  const byColumn = Object.fromEntries(
    COLUMNS.map((c) => [c.key, filtered.filter((t) => t.status === c.key)])
  );
  const overdueCount = tasks.filter(
    (t) => t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), "day") && t.status !== "done" && t.status !== "cancelled"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const KPI = [
    { label: "Total Tasks",  value: tasks.length,                                          color: "var(--purple)", icon: <SnippetsOutlined />    },
    { label: "In Progress",  value: tasks.filter((t) => t.status === "in_progress").length, color: "var(--primary)", icon: <SyncOutlined />         },
    { label: "Completed",    value: doneCount,                                              color: "var(--success)", icon: <CheckCircleOutlined /> },
    { label: "Overdue",      value: overdueCount,                                           color: "var(--danger)", icon: <ClockCircleOutlined />  },
  ];

  return (
    <>
      <style>{`
        .tm-board { display:flex; gap:14px; align-items:flex-start; overflow-x:auto; padding-bottom:12px; }
        .tm-board::-webkit-scrollbar { height:5px; }
        .tm-board::-webkit-scrollbar-thumb { background:var(--border-muted); border-radius:4px; }
        .tm-board::-webkit-scrollbar-track { background:transparent; }
      `}</style>

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

      <div style={pageWrapper}>
        {/* ── KPI Cards ── */}
        <div style={{ ...statGrid(150), marginBottom: 20 }}>
          {KPI.map((k) => (
            <div key={k.label} style={{
              padding: "16px 18px", background: "var(--surface)", borderRadius: 14,
              border: "1px solid var(--border-muted)", borderLeft: `4px solid ${k.color}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={iconWell(k.color, 42)}>
                {React.cloneElement(k.icon, { style: { fontSize: 17 } })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 5 }}>
                  {k.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress + Filter toolbar ── */}
        <div style={{ ...sectionPanel, padding: "12px 16px", marginBottom: 18 }}>
          <Flex align="center" justify="space-between" gap={12} wrap="wrap">
            {/* Completion progress */}
            <Flex align="center" gap={12}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                  Completion
                </div>
                <Flex align="center" gap={8}>
                  <div style={{ width: 120, height: 6, background: "var(--border-muted)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--success)", borderRadius: 4, transition: "width 0.4s" }} />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>{pct}%</Text>
                </Flex>
              </div>
              {overdueCount > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "var(--danger-light)", border: "1px solid rgba(var(--danger-rgb), 0.3)",
                  borderRadius: 8, padding: "5px 10px",
                }}>
                  <ClockCircleOutlined style={{ color: "var(--danger)", fontSize: 12 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>{overdueCount} overdue</span>
                </div>
              )}
            </Flex>

            {/* Search + priority filter */}
            <Flex gap={10} align="center" wrap="wrap">
              <Input.Search
                placeholder="Search tasks…"
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                style={{ width: 220 }}
              />
              <Select
                allowClear
                placeholder="All Priorities"
                style={{ width: 150 }}
                value={filterPri}
                onChange={setFilterPri}
              >
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ color: PRIORITY[k].color, fontWeight: 600 }}>{v}</span>
                  </Option>
                ))}
              </Select>
            </Flex>
          </Flex>
        </div>

        {/* ── Kanban Board ── */}
        {loading && tasks.length === 0 ? (
          <div style={{ display: "flex", gap: 14 }}>
            {COLUMNS.map((c) => (
              <div key={c.key} style={{ flex: "1 1 260px", minWidth: 260 }}>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-muted)" }}>
                  <div style={{ padding: "12px 16px", background: `color-mix(in srgb, ${c.color} 5%, transparent)`, borderBottom: "1px solid var(--border-muted)" }}>
                    <Skeleton active title={{ width: "60%" }} paragraph={false} />
                  </div>
                  <div style={{ padding: 12, background: "var(--surface-page)" }}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tm-board">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key} col={col}
                tasks={byColumn[col.key] || []}
                onEdit={openEdit}
                onDelete={handleDelete}
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
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
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
            <DatePicker style={{ width: "100%" }} size="large" format="DD MMM YYYY" />
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
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{u.role}</span>
                  </Flex>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Flex gap={10} style={{ marginTop: 12 }}>
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
