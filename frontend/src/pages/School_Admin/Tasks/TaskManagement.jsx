import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar, Button, DatePicker, Form, Input, Modal, Popconfirm,
  Select, Skeleton, Tooltip, message,
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined,
  PlusOutlined, SnippetsOutlined, StopOutlined, SyncOutlined,
} from "@ant-design/icons";
import { AlertTriangle, ChevronDown, Flame, GripVertical, Minus } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  pointerWithin, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  createTask, deleteTask, fetchAssignableUsers, fetchTasks, updateTask,
} from "../../../features/taskSlice";
import PageHeader from "../../../components/layout/PageHeader";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Option } = Select;

const COLUMNS = [
  { key: "todo",        label: "To Do",      color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: <ClockCircleOutlined /> },
  { key: "in_progress", label: "In Progress", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: <SyncOutlined />        },
  { key: "done",        label: "Done",        color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", icon: <CheckCircleOutlined /> },
  { key: "cancelled",   label: "Cancelled",   color: "#6B7280", bg: "#F9FAFB", border: "#D1D5DB", icon: <StopOutlined />        },
];

const PRIORITY = {
  low:    { label: "Low",    color: "#64748B", bg: "#F1F5F9", icon: <Minus size={9}/>          },
  medium: { label: "Medium", color: "#D97706", bg: "#FEF3C7", icon: <ChevronDown size={9}/>   },
  high:   { label: "High",   color: "#EA580C", bg: "#FFF7ED", icon: <Flame size={9}/>          },
  urgent: { label: "Urgent", color: "#DC2626", bg: "#FEF2F2", icon: <AlertTriangle size={9}/> },
};

const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const STATUS_LABEL   = { todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled" };

/* ─── atoms ─────────────────────────────────────────────────────── */
const PriorityPill = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: p.color, background: p.bg,
      padding: "2px 8px", borderRadius: 99,
    }}>
      {p.icon} {p.label.toUpperCase()}
    </span>
  );
};

const DueChip = ({ date, status }) => {
  if (!date) return null;
  const d       = dayjs(date);
  const overdue = d.isBefore(dayjs(), "day") && status !== "done" && status !== "cancelled";
  const today   = d.isSame(dayjs(), "day");
  const color   = overdue ? "#DC2626" : today ? "#D97706" : "#64748B";
  const bg      = overdue ? "#FEF2F2" : today ? "#FFFBEB" : "#F1F5F9";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color, background: bg, padding: "2px 7px", borderRadius: 6,
    }}>
      <ClockCircleOutlined style={{ fontSize: 9 }} />
      {overdue ? "Overdue · " : today ? "Today · " : ""}{d.format("DD MMM")}
    </span>
  );
};

/* ─── Draggable Task Card ────────────────────────────────────────── */
const DraggableCard = ({ task, col, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        transition: isDragging ? "none" : "opacity 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: "#fff",
        border: "1px solid #E8EEF6",
        borderRadius: 12,
        padding: "12px 14px",
        borderTop: `3px solid ${col.color}`,
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.18s",
        position: "relative",
        cursor: "default",
      }}>
        {/* Row 1: drag + priority */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span
            {...attributes}
            {...listeners}
            style={{
              display: "flex", alignItems: "center",
              color: "#CBD5E1", cursor: "grab", touchAction: "none", flexShrink: 0,
            }}
          >
            <GripVertical size={14} />
          </span>
          <PriorityPill priority={task.priority} />
        </div>

        {/* Title */}
        <div style={{
          fontWeight: 700, fontSize: 13, color: "#0F172A", lineHeight: 1.4,
          marginBottom: 6,
          paddingRight: hovered ? 60 : 0,
          transition: "padding 0.15s",
        }}>
          {task.title}
        </div>

        {/* Description */}
        {task.description && (
          <div style={{
            fontSize: 11.5, color: "#94A3B8", lineHeight: 1.55, marginBottom: 8,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {task.description}
          </div>
        )}

        {/* Footer: due + avatars */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 6,
        }}>
          <DueChip date={task.dueDate} status={task.status} />
          {task.assignedTo?.length > 0 && (
            <Avatar.Group maxCount={3} size={20}>
              {task.assignedTo.map((u) => (
                <Tooltip key={u._id} title={u.name}>
                  <Avatar
                    size={20} src={u.avatar}
                    style={{ background: "#7C3AED", fontSize: 9, lineHeight: "20px" }}
                  >
                    {!u.avatar && u.name?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          )}
        </div>

        {/* Hover actions */}
        {hovered && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            display: "flex", gap: 4, zIndex: 2,
          }}>
            <button
              onClick={() => onEdit(task)}
              style={{
                background: "#EFF6FF", border: "none", borderRadius: 6,
                padding: "4px 8px", cursor: "pointer", color: "#2563EB",
              }}
            >
              <EditOutlined style={{ fontSize: 11 }} />
            </button>
            <Popconfirm
              title="Delete this task?"
              onConfirm={() => onDelete(task._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <button style={{
                background: "#FEF2F2", border: "none", borderRadius: 6,
                padding: "4px 8px", cursor: "pointer", color: "#DC2626",
              }}>
                <DeleteOutlined style={{ fontSize: 11 }} />
              </button>
            </Popconfirm>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Droppable Kanban Column ───────────────────────────────────── */
const KanbanColumn = ({ col, tasks, onEdit, onDelete, onAdd }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <div style={{ flex: "1 1 240px", minWidth: 240, maxWidth: 320, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px",
        background: col.bg,
        border: `1px solid ${col.border}`,
        borderRadius: "13px 13px 0 0", borderBottom: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: col.color, fontSize: 13 }}>{col.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{col.label}</span>
        </div>
        <span style={{
          fontWeight: 800, fontSize: 10, color: "#fff",
          background: col.color, minWidth: 20, height: 20, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, minHeight: 220, padding: "10px",
          display: "flex", flexDirection: "column", gap: 9,
          border: `1px solid ${col.border}`,
          borderTop: "none", borderRadius: "0 0 0 0",
          background: isOver ? col.bg : "#FAFBFF",
          transition: "background 0.18s ease",
          boxShadow: isOver ? `inset 0 0 0 2px ${col.color}55` : "none",
        }}
      >
        {tasks.length === 0 && !isOver && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#CBD5E1", fontSize: 12, fontWeight: 500,
            borderRadius: 8, border: "2px dashed #E2E8F0",
            minHeight: 80, margin: "4px 0",
          }}>
            No tasks
          </div>
        )}
        {tasks.map((t) => (
          <DraggableCard
            key={t._id} task={t} col={col}
            onEdit={onEdit} onDelete={onDelete}
          />
        ))}
      </div>

      {/* Add task footer button */}
      <AddTaskBtn col={col} onAdd={onAdd} />
    </div>
  );
};

const AddTaskBtn = ({ col, onAdd }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onAdd(col.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        marginTop: 8, padding: "8px 12px",
        background: hov ? col.bg : "transparent",
        border: `1px dashed ${hov ? col.color : col.border}`,
        borderRadius: 10, cursor: "pointer",
        color: hov ? col.color : "#94A3B8",
        fontSize: 12, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6, width: "100%",
        transition: "all 0.15s",
      }}
    >
      <PlusOutlined style={{ fontSize: 11 }} /> Add task
    </button>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const TaskManagement = () => {
  const dispatch = useDispatch();
  const {
    items: tasks = [], loading = false,
    assignableUsers = [], usersLoading = false,
  } = useSelector((s) => s.tasks || {});

  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [initStatus,     setInitStatus]     = useState("todo");
  const [filterPriority, setFilterPriority] = useState(null);
  const [search,         setSearch]         = useState("");
  const [activeTask,     setActiveTask]     = useState(null);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

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

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((x) => x._id === active.id) || null);
  };

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const targetStatus = over.id;
    if (!COLUMNS.find((c) => c.key === targetStatus)) return;
    const task = tasks.find((t) => t._id === active.id);
    if (!task || task.status === targetStatus) return;
    try {
      await dispatch(updateTask({ id: active.id, status: targetStatus })).unwrap();
    } catch {
      message.error("Failed to move task");
    }
  }, [dispatch, tasks]);

  const q = search.toLowerCase();
  const filtered = tasks.filter((t) => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (q && !t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    return true;
  });
  const byColumn = Object.fromEntries(
    COLUMNS.map((c) => [c.key, filtered.filter((t) => t.status === c.key)])
  );

  const STATS = [
    { label: "Total Tasks",  value: tasks.length,                                       color: "#7C3AED", bg: "#F3EEFF", emoji: "📋" },
    { label: "To Do",        value: tasks.filter((t) => t.status === "todo").length,     color: "#D97706", bg: "#FFFBEB", emoji: "🕐" },
    { label: "In Progress",  value: tasks.filter((t) => t.status === "in_progress").length, color: "#2563EB", bg: "#EFF6FF", emoji: "⚡" },
    { label: "Completed",    value: tasks.filter((t) => t.status === "done").length,     color: "#16A34A", bg: "#F0FDF4", emoji: "✅" },
  ];

  const activeCol = COLUMNS.find((c) => c.key === activeTask?.status);

  return (
    <>
      <style>{`
        .tm-board{display:flex;gap:16px;align-items:flex-start;overflow-x:auto;padding-bottom:16px}
        .tm-board::-webkit-scrollbar{height:5px}
        .tm-board::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:4px}
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

      <div style={{ padding: "0 24px 28px", background: "#F4F6FA", minHeight: "calc(100vh - 118px)" }}>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, paddingTop: 4 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid #E8EEF6",
              borderRadius: 14, padding: "14px 18px",
              flex: "1 1 130px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {s.emoji}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{
          background: "#fff", border: "1px solid #E8EEF6",
          borderRadius: 12, padding: "12px 14px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 9,
              border: "1px solid #E8EEF6", background: "#F4F6FA",
              color: "#0F172A", fontSize: 13, outline: "none",
            }}
          />
          <Select
            allowClear
            placeholder="All Priorities"
            style={{ width: 160 }}
            value={filterPriority}
            onChange={setFilterPriority}
          >
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>
                <span style={{ color: PRIORITY[k].color, fontWeight: 600 }}>{v}</span>
              </Option>
            ))}
          </Select>
        </div>

        {/* Kanban Board */}
        {loading && tasks.length === 0 ? (
          <div style={{ display: "flex", gap: 16 }}>
            {COLUMNS.map((c) => (
              <div key={c.key} style={{ flex: "1 1 240px", minWidth: 240 }}>
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="tm-board">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.key} col={col}
                  tasks={byColumn[col.key] || []}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAdd={openCreate}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
              {activeTask && (
                <div style={{
                  background: "#fff",
                  border: "1px solid #E8EEF6",
                  borderRadius: 12,
                  padding: "12px 14px",
                  borderTop: `3px solid ${activeCol?.color || "#2563EB"}`,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                  opacity: 0.95,
                  minWidth: 220,
                }}>
                  <PriorityPill priority={activeTask.priority} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginTop: 8 }}>
                    {activeTask.title}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#F3EEFF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SnippetsOutlined style={{ color: "#7C3AED", fontSize: 14 }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              {editTask ? "Edit Task" : "Create New Task"}
            </span>
          </div>
        }
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            label="Task Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Enter task title" size="large" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Describe the task (optional)" />
          </Form.Item>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item label="Priority" name="priority" initialValue="medium" style={{ flex: 1 }}>
              <Select size="large">
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ color: PRIORITY[k].color, fontWeight: 600 }}>{v}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Status" name="status" initialValue={initStatus} style={{ flex: 1 }}>
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
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              loading={usersLoading}
              optionLabelProp="label"
              size="large"
            >
              {assignableUsers.map((u) => (
                <Option key={u._id} value={u._id} label={u.name}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar size={20} src={u.avatar} style={{ background: "#7C3AED", fontSize: 9 }}>
                      {!u.avatar && u.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <span style={{ fontSize: 13 }}>{u.name}</span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{u.role}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Button block size="large" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button block size="large" type="primary" htmlType="submit" loading={saving}>
              {editTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TaskManagement;
