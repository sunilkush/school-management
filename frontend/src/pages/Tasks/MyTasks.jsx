import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Tag, Badge, Avatar, Select, Empty, Spin, Tooltip, message, Button,
} from "antd";
import {
  ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, StopOutlined,
  CalendarOutlined, UserOutlined, SnippetsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchTasks, updateTask } from "../../features/taskSlice";
import PageHeader from "../../components/layout/PageHeader";

dayjs.extend(relativeTime);

const { Option } = Select;

const PRIORITY_COLOR  = { low: "green", medium: "blue", high: "orange", urgent: "red" };
const PRIORITY_LABEL  = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const MY_STATUS_LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const MY_STATUS_COLOR = {
  todo:        { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  in_progress: { bg: "#dbeafe", color: "#2563eb", border: "#bfdbfe" },
  done:        { bg: "#d1fae5", color: "#059669", border: "#a7f3d0" },
};
const STATUS_ICON = {
  todo:        <ClockCircleOutlined />,
  in_progress: <SyncOutlined spin />,
  done:        <CheckCircleOutlined />,
};

const TaskCard = ({ task, userId, onStatusChange, updating }) => {
  const myEntry = task.assigneeStatus?.find((a) => a.userId === userId || a.userId?._id === userId);
  const myStatus = myEntry?.status || "todo";
  const { bg, color, border } = MY_STATUS_COLOR[myStatus] || MY_STATUS_COLOR.todo;

  const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs()) && myStatus !== "done";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: "16px 18px",
      borderLeft: `4px solid ${color}`,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {task.description}
            </div>
          )}
        </div>
        <Tag color={PRIORITY_COLOR[task.priority]} style={{ flexShrink: 0 }}>
          {PRIORITY_LABEL[task.priority]}
        </Tag>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {task.assignedBy && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
            <UserOutlined />
            <span>By {task.assignedBy.name}</span>
          </div>
        )}
        {task.dueDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: isOverdue ? "#ef4444" : "var(--text-muted)" }}>
            <CalendarOutlined />
            <span>{isOverdue ? "Overdue: " : ""}{dayjs(task.dueDate).format("DD MMM YYYY")}</span>
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Created {dayjs(task.createdAt).fromNow()}
        </div>
      </div>

      {/* Status selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>My status:</span>
        <Select
          value={myStatus}
          size="small"
          style={{ flex: 1, maxWidth: 180 }}
          loading={updating === task._id}
          disabled={updating === task._id}
          onChange={(val) => onStatusChange(task._id, val)}
        >
          {Object.entries(MY_STATUS_LABEL).map(([k, v]) => (
            <Option key={k} value={k}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {STATUS_ICON[k]} {v}
              </span>
            </Option>
          ))}
        </Select>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: bg, color, border: `1px solid ${border}`,
          borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
        }}>
          {STATUS_ICON[myStatus]} {MY_STATUS_LABEL[myStatus]}
        </div>
      </div>
    </div>
  );
};

const MyTasks = () => {
  const dispatch = useDispatch();
  const { items: tasks = [], loading = false } = useSelector((s) => s.tasks || {});
  const { user } = useSelector((s) => s.auth);

  const [filterStatus, setFilterStatus]     = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [updating, setUpdating]             = useState(null);

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await dispatch(updateTask({ id: taskId, myStatus: newStatus })).unwrap();
      message.success("Status updated");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const userId = user?._id;

  const counts = {
    total:       tasks.length,
    todo:        tasks.filter((t) => {
      const e = t.assigneeStatus?.find((a) => a.userId === userId || a.userId?._id === userId);
      return (e?.status || "todo") === "todo";
    }).length,
    in_progress: tasks.filter((t) => {
      const e = t.assigneeStatus?.find((a) => a.userId === userId || a.userId?._id === userId);
      return e?.status === "in_progress";
    }).length,
    done: tasks.filter((t) => {
      const e = t.assigneeStatus?.find((a) => a.userId === userId || a.userId?._id === userId);
      return e?.status === "done";
    }).length,
  };

  const filtered = tasks.filter((t) => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus) {
      const e = t.assigneeStatus?.find((a) => a.userId === userId || a.userId?._id === userId);
      const myStatus = e?.status || "todo";
      if (myStatus !== filterStatus) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="My Tasks"
        subtitle="Tasks assigned to you"
        icon={<SnippetsOutlined />}
      />

      <div style={{ padding: "0 24px 24px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Total",       value: counts.total,       color: "#7c3aed" },
            { label: "To Do",       value: counts.todo,        color: "#d97706" },
            { label: "In Progress", value: counts.in_progress, color: "#2563eb" },
            { label: "Done",        value: counts.done,        color: "#059669" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", minWidth: 100, flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Select
            allowClear
            placeholder="Filter by my status"
            style={{ width: 170 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            {Object.entries(MY_STATUS_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="Filter by priority"
            style={{ width: 160 }}
            value={filterPriority}
            onChange={setFilterPriority}
          >
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
        </div>

        {/* Cards grid */}
        {loading && tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
        ) : filtered.length === 0 ? (
          <Empty description="No tasks assigned to you yet" style={{ padding: "60px 0" }} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {filtered.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                userId={userId}
                onStatusChange={handleStatusChange}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyTasks;
