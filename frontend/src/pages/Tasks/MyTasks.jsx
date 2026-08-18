import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Select, Skeleton, Tooltip, message } from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined,
  SnippetsOutlined, SyncOutlined,
} from "@ant-design/icons";
import { AlertTriangle, ChevronDown, Flame, GripVertical, Minus } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchTasks, updateTask } from "../../features/taskSlice";
import PageHeader from "../../components/layout/PageHeader";

dayjs.extend(relativeTime);

const COLUMNS = [
  { key: "todo",        label: "To Do",      icon: <ClockCircleOutlined />, color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning-light)" },
  { key: "in_progress", label: "In Progress", icon: <SyncOutlined />,        color: "var(--primary)", bg: "var(--primary-light)", border: "var(--primary-light)" },
  { key: "done",        label: "Done",        icon: <CheckCircleOutlined />, color: "var(--success)", bg: "var(--success-light)", border: "var(--success-light)" },
];

const PRIORITY = {
  low:    { label: "Low",    color: "var(--text-secondary)", bg: "var(--surface-soft)", icon: <Minus size={9}/>          },
  medium: { label: "Medium", color: "var(--warning-hover)", bg: "var(--warning-light)", icon: <ChevronDown size={9}/>   },
  high:   { label: "High",   color: "var(--orange)", bg: "rgba(var(--warning-rgb), 0.08)", icon: <Flame size={9}/>          },
  urgent: { label: "Urgent", color: "var(--danger-hover)", bg: "var(--danger-light)", icon: <AlertTriangle size={9}/> },
};

/* ─── atoms ─────────────────────────────────────────────────────── */
const PriorityPill = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: p.color,
      background: p.bg,
      padding: "2px 8px", borderRadius: 99,
    }}>
      {p.icon} {p.label.toUpperCase()}
    </span>
  );
};

const DueChip = ({ date, status }) => {
  if (!date) return null;
  const d       = dayjs(date);
  const overdue = d.isBefore(dayjs(), "day") && status !== "done";
  const today   = d.isSame(dayjs(), "day");
  const color   = overdue ? "var(--danger-hover)" : today ? "var(--warning-hover)" : "var(--text-secondary)";
  const bg      = overdue ? "var(--danger-light)" : today ? "var(--warning-light)" : "var(--surface-soft)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color, background: bg,
      padding: "2px 7px", borderRadius: 6,
    }}>
      <ClockCircleOutlined style={{ fontSize: 9 }} />
      {overdue ? "Overdue · " : today ? "Today · " : ""}
      {d.format("DD MMM")}
    </span>
  );
};

const AssignedByTag = ({ task, currentUserId }) => {
  const assigner = task.assignedBy;
  if (!assigner) return null;
  const assignerId = typeof assigner === "object" ? assigner._id?.toString() : assigner?.toString();
  if (assignerId === currentUserId?.toString()) return null;
  const name = (typeof assigner === "object" ? (assigner.name || assigner.email?.split("@")[0]) : null) || "Unknown";
  const hue  = Math.abs((name.charCodeAt(0) || 65) * 40) % 360;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-muted)" }}>
      <Avatar size={14} style={{ background: `hsl(${hue},50%,50%)`, fontSize: 7, lineHeight: "14px" }}>
        {name[0]?.toUpperCase()}
      </Avatar>
      <span>from {name}</span>
    </div>
  );
};

/* ─── Task Card ─────────────────────────────────────────────────── */
const TaskCard = ({ task, colColor, currentUserId, onDragStart, onDragEnd, isDragging }) => {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task); }}
      onDragEnd={onDragEnd}
      style={{
        background:   "var(--surface)",
        border:       "1px solid var(--border)",
        borderRadius: 13,
        padding:      "12px 14px",
        borderTop:    `3px solid ${colColor}`,
        display:      "flex", flexDirection: "column", gap: 9,
        boxShadow:    "var(--shadow-soft)",
        cursor:       "grab",
        opacity:      isDragging ? 0.4 : 1,
        transition:   "opacity 0.15s, box-shadow 0.18s",
        userSelect:   "none",
      }}
    >
      {/* Drag handle + priority */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", color: "var(--text-disabled)", flexShrink: 0 }}>
          <GripVertical size={14} />
        </span>
        <PriorityPill priority={task.priority} />
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {task.description}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <DueChip date={task.dueDate} status={task.status} />
        <AssignedByTag task={task} currentUserId={currentUserId} />
      </div>
    </div>
  );
};

/* ─── Column ────────────────────────────────────────────────────── */
const KanbanColumn = ({ col, tasks, currentUserId, dragState, onDragStart, onDragEnd, onDrop }) => {
  const [over, setOver] = useState(false);
  return (
    <div style={{ flex: "1 1 240px", minWidth: 240, maxWidth: 340, display: "flex", flexDirection: "column", gap: 0, boxShadow: "var(--shadow-soft)" }}>
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
          <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>
            {col.label}
          </span>
        </div>
        <span style={{
          fontWeight: 800, fontSize: 10, color: "#fff",
          background: col.color, minWidth: 20, height: 20, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); onDrop(col.key); }}
        style={{
          flex: 1, minHeight: 200, padding: "10px 9px",
          display: "flex", flexDirection: "column", gap: 9,
          border: `1px solid ${over ? col.color : col.border}`,
          borderTop: "none", borderRadius: "0 0 12px 12px",
          background: over
            ? `color-mix(in srgb, ${col.color} 8%, transparent)`
            : "var(--background)",
          transition: "all 0.15s ease",
          boxShadow: over ? `inset 0 0 0 2px color-mix(in srgb, ${col.color} 27%, transparent)` : "none",
        }}
      >
        {tasks.length === 0 && !over && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--border)", fontSize: 12, fontWeight: 500,
            borderRadius: 8, border: `2px dashed ${col.border}`,
            minHeight: 80, margin: "4px 0",
          }}>
            {dragState ? "Drop here" : "No tasks"}
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t._id} task={t} colColor={col.color}
            currentUserId={currentUserId}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragState?.task?._id === t._id}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Mobile Column Nav ──────────────────────────────────────────── */
const ColNav = ({ activeKey, onChange, counts, border }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
    {COLUMNS.map((c) => {
      const active = activeKey === c.key;
      return (
        <button key={c.key} onClick={() => onChange(c.key)} style={{
          flex: "1 1 90px", padding: "8px 12px", borderRadius: 10,
          border: `1px solid ${active ? c.color : border}`,
          background: active ? c.bg : "transparent",
          color: active ? c.color : "var(--text-muted)",
          fontWeight: 700, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}>
          {c.icon} {c.label}
          <span style={{
            background: active ? c.color : "var(--border-muted)",
            color: active ? "#fff" : "var(--text-muted)",
            borderRadius: 99, padding: "0 6px", fontSize: 10, fontWeight: 800,
          }}>
            {counts[c.key] || 0}
          </span>
        </button>
      );
    })}
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────────── */
const MyTasks = () => {
  const dispatch      = useDispatch();
  const { items: tasks = [], loading = false } = useSelector((s) => s.tasks || {});
  const { user }      = useSelector((s) => s.auth);
  const currentUserId = user?._id;

  const [filterPriority, setFilterPriority] = useState("all");
  const [search,         setSearch]         = useState("");
  const [dragState,      setDragState]      = useState(null);
  const [mobileCol,      setMobileCol]      = useState("todo");
  const [windowW,        setWindowW]        = useState(() => window.innerWidth);

  useEffect(() => {
    const h = () => setWindowW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const isMobile = windowW < 640;

  const myTasks = useMemo(() =>
    tasks.filter((t) => {
      if (!Array.isArray(t.assignedTo)) return false;
      return t.assignedTo.some((u) => (u._id || u) === currentUserId);
    }),
  [tasks, currentUserId]);

  const handleDragStart = (task) => setDragState({ task });
  const handleDragEnd   = ()    => setDragState(null);

  const handleDrop = useCallback(async (targetStatus) => {
    if (!dragState?.task) return;
    const { task } = dragState;
    setDragState(null);
    if (task.status === targetStatus) return;
    try {
      await dispatch(updateTask({ id: task._id, myStatus: targetStatus })).unwrap();
    } catch {
      message.error("Failed to move task");
    }
  }, [dispatch, dragState]);

  const counts = useMemo(() => ({
    total:       myTasks.length,
    todo:        myTasks.filter((t) => t.status === "todo").length,
    in_progress: myTasks.filter((t) => t.status === "in_progress").length,
    done:        myTasks.filter((t) => t.status === "done").length,
    overdue:     myTasks.filter((t) =>
      t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), "day") && t.status !== "done"
    ).length,
  }), [myTasks]);

  const byColumn = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = myTasks.filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (q && !t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      return true;
    });
    return Object.fromEntries(COLUMNS.map((c) => [c.key, filtered.filter((t) => t.status === c.key)]));
  }, [myTasks, filterPriority, search]);

  const pageBg = "var(--background)";
  const cardBg = "var(--surface)";
  const border = "var(--border)";
  const txtMut = "var(--text-muted)";

  const STATS = [
    { label: "Assigned",    value: counts.total,       color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.12)" },
    { label: "To Do",       value: counts.todo,        color: "var(--warning-hover)", bg: "var(--warning-light)" },
    { label: "In Progress", value: counts.in_progress, color: "var(--primary)", bg: "var(--primary-light)" },
    { label: "Completed",   value: counts.done,        color: "var(--success)", bg: "var(--success-light)" },
    { label: "Overdue",     value: counts.overdue,     color: "var(--danger-hover)", bg: "var(--danger-light)" },
  ];

  return (
    <>
      <style>{`
        .mt-board{display:flex;gap:14px;align-items:flex-start;overflow-x:auto;padding-bottom:12px}
        .mt-board::-webkit-scrollbar{height:5px}
        .mt-board::-webkit-scrollbar-thumb{background:${border};border-radius:4px}
        .mt-stats>div{flex:1 1 110px}
        @media(max-width:639px){.mt-stats>div{flex:1 1 calc(50% - 6px) !important}}
      `}</style>

      <PageHeader
        title="My Tasks"
        subtitle="Tasks assigned to you — drag cards to update status"
        icon={<SnippetsOutlined />}
        extra={
          <button
            onClick={() => dispatch(fetchTasks())}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9, border: `1px solid ${border}`,
              background: cardBg, cursor: "pointer", fontSize: 13, fontWeight: 600, color: txtMut,
            }}
          >
            <ReloadOutlined style={{ fontSize: 12 }} />
            {!isMobile && " Refresh"}
          </button>
        }
      />

      <div style={{ padding: isMobile ? "10px 12px 24px" : "20px 20px 28px", background: pageBg, minHeight: "calc(100vh - 118px)" }}>

        {/* Stats */}
        <div className="mt-stats" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              background: cardBg, border: `1px solid ${border}`,
              borderRadius: 13, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "var(--shadow-soft)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: s.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: txtMut, lineHeight: 1.3 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{
          background: cardBg, border: `1px solid ${border}`,
          borderRadius: 13, padding: "12px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          boxShadow: "var(--shadow-soft)",
        }}>
          <input
            placeholder="Search my tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 150, padding: "7px 12px", borderRadius: 9,
              border: `1px solid ${border}`,
              background: "var(--surface-soft)",
              color: "var(--text-primary)",
              fontSize: 13, outline: "none",
            }}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ width: 145 }}
            options={[
              { value: "all", label: "All Priority" },
              ...Object.entries(PRIORITY).map(([k, v]) => ({
                value: k,
                label: <span style={{ color: v.color, fontWeight: 600 }}>{v.label}</span>,
              })),
            ]}
          />
        </div>

        {/* Mobile column tabs */}
        {isMobile && (
          <ColNav
            activeKey={mobileCol} onChange={setMobileCol}
            counts={counts} border={border}
          />
        )}

        {/* Board */}
        {loading && myTasks.length === 0 ? (
          <div style={{ display: "flex", gap: 14 }}>
            {(isMobile ? [COLUMNS[0]] : COLUMNS).map((c) => (
              <div key={c.key} style={{ flex: "1 1 240px", minWidth: 240 }}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ))}
          </div>
        ) : myTasks.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: cardBg, borderRadius: 16, border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>
              No tasks assigned yet
            </div>
            <div style={{ fontSize: 13, color: txtMut }}>Tasks assigned to you will appear here</div>
          </div>
        ) : (
          <div className="mt-board">
            {(isMobile ? COLUMNS.filter((c) => c.key === mobileCol) : COLUMNS).map((col) => (
              <KanbanColumn
                key={col.key} col={col}
                tasks={byColumn[col.key] || []}
                currentUserId={currentUserId}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyTasks;
