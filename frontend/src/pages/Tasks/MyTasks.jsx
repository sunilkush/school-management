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
import { useTheme } from "../../context/ThemeContext";

dayjs.extend(relativeTime);

const COLUMNS = [
  { key: "todo",        label: "To Do",      icon: <ClockCircleOutlined />, color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", dark: "#B45309", dimBg: "rgba(245,158,11,0.10)"  },
  { key: "in_progress", label: "In Progress", icon: <SyncOutlined />,        color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", dark: "#1D4ED8", dimBg: "rgba(37,99,235,0.10)"   },
  { key: "done",        label: "Done",        icon: <CheckCircleOutlined />, color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", dark: "#15803D", dimBg: "rgba(22,163,74,0.10)"   },
];

const PRIORITY = {
  low:    { label: "Low",    color: "#64748B", bg: "#F1F5F9", darkBg: "#1E293B", icon: <Minus size={9}/>          },
  medium: { label: "Medium", color: "#D97706", bg: "#FEF3C7", darkBg: "#3B2800", icon: <ChevronDown size={9}/>   },
  high:   { label: "High",   color: "#EA580C", bg: "#FFF7ED", darkBg: "#431407", icon: <Flame size={9}/>          },
  urgent: { label: "Urgent", color: "#DC2626", bg: "#FEF2F2", darkBg: "#3B0A0A", icon: <AlertTriangle size={9}/> },
};

/* ─── atoms ─────────────────────────────────────────────────────── */
const PriorityPill = ({ priority, isDark }) => {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, fontWeight: 700, color: p.color,
      background: isDark ? p.darkBg : p.bg,
      padding: "2px 8px", borderRadius: 99,
    }}>
      {p.icon} {p.label.toUpperCase()}
    </span>
  );
};

const DueChip = ({ date, status, isDark }) => {
  if (!date) return null;
  const d       = dayjs(date);
  const overdue = d.isBefore(dayjs(), "day") && status !== "done";
  const today   = d.isSame(dayjs(), "day");
  const color   = overdue ? "#DC2626" : today ? "#D97706" : "#64748B";
  const bg      = overdue ? (isDark ? "#3B0A0A" : "#FEF2F2")
                : today   ? (isDark ? "#3B2800" : "#FFFBEB")
                :            (isDark ? "#1E293B" : "#F1F5F9");
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

const AssignedByTag = ({ task, currentUserId, isDark }) => {
  const assigner = task.assignedBy;
  if (!assigner) return null;
  const assignerId = typeof assigner === "object" ? assigner._id?.toString() : assigner?.toString();
  if (assignerId === currentUserId?.toString()) return null;
  const name = (typeof assigner === "object" ? (assigner.name || assigner.email?.split("@")[0]) : null) || "Unknown";
  const hue  = Math.abs((name.charCodeAt(0) || 65) * 40) % 360;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: isDark ? "#64748B" : "#94A3B8" }}>
      <Avatar size={14} style={{ background: `hsl(${hue},50%,50%)`, fontSize: 7, lineHeight: "14px" }}>
        {name[0]?.toUpperCase()}
      </Avatar>
      <span>from {name}</span>
    </div>
  );
};

/* ─── Task Card ─────────────────────────────────────────────────── */
const TaskCard = ({ task, colColor, currentUserId, isDark, onDragStart, onDragEnd, isDragging }) => {
  const bg     = isDark ? "#1A2438" : "#ffffff";
  const border = isDark ? "#1E2A3B" : "#E8EEF6";
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task); }}
      onDragEnd={onDragEnd}
      style={{
        background:   bg,
        border:       `1px solid ${border}`,
        borderRadius: 13,
        padding:      "12px 14px",
        borderTop:    `3px solid ${colColor}`,
        display:      "flex", flexDirection: "column", gap: 9,
        boxShadow:    isDark ? "0 1px 4px rgba(0,0,0,0.20)" : "0 1px 4px rgba(0,0,0,0.06)",
        cursor:       "grab",
        opacity:      isDragging ? 0.4 : 1,
        transition:   "opacity 0.15s, box-shadow 0.18s",
        userSelect:   "none",
      }}
    >
      {/* Drag handle + priority */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", color: isDark ? "#374151" : "#CBD5E1", flexShrink: 0 }}>
          <GripVertical size={14} />
        </span>
        <PriorityPill priority={task.priority} isDark={isDark} />
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? "#E2E8F0" : "#0F172A", lineHeight: 1.4 }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontSize: 11.5, color: isDark ? "#64748B" : "#94A3B8", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {task.description}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <DueChip date={task.dueDate} status={task.status} isDark={isDark} />
        <AssignedByTag task={task} currentUserId={currentUserId} isDark={isDark} />
      </div>
    </div>
  );
};

/* ─── Column ────────────────────────────────────────────────────── */
const KanbanColumn = ({ col, tasks, currentUserId, isDark, dragState, onDragStart, onDragEnd, onDrop }) => {
  const [over, setOver] = useState(false);
  return (
    <div style={{ flex: "1 1 240px", minWidth: 240, maxWidth: 340, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px",
        background: isDark ? col.dimBg : col.bg,
        border: `1px solid ${isDark ? col.color + "30" : col.border}`,
        borderRadius: "13px 13px 0 0", borderBottom: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: col.color, fontSize: 13 }}>{col.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? col.color : col.dark }}>
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
          border: `1px solid ${over ? col.color : (isDark ? col.color + "20" : col.border)}`,
          borderTop: "none", borderRadius: "0 0 12px 12px",
          background: over
            ? (isDark ? col.color + "14" : col.bg)
            : (isDark ? "#111827" : "#FAFBFF"),
          transition: "all 0.15s ease",
          boxShadow: over ? `inset 0 0 0 2px ${col.color}44` : "none",
        }}
      >
        {tasks.length === 0 && !over && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: isDark ? "#1E293B" : "#E2E8F0", fontSize: 12, fontWeight: 500,
            borderRadius: 8, border: `2px dashed ${isDark ? col.color + "20" : col.border}`,
            minHeight: 80, margin: "4px 0",
          }}>
            {dragState ? "Drop here" : "No tasks"}
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t._id} task={t} colColor={col.color}
            currentUserId={currentUserId} isDark={isDark}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragState?.task?._id === t._id}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Mobile Column Nav ──────────────────────────────────────────── */
const ColNav = ({ activeKey, onChange, counts, isDark, border }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
    {COLUMNS.map((c) => {
      const active = activeKey === c.key;
      return (
        <button key={c.key} onClick={() => onChange(c.key)} style={{
          flex: "1 1 90px", padding: "8px 12px", borderRadius: 10,
          border: `1px solid ${active ? c.color : border}`,
          background: active ? (isDark ? c.dimBg : c.bg) : "transparent",
          color: active ? c.color : isDark ? "#64748B" : "#94A3B8",
          fontWeight: 700, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}>
          {c.icon} {c.label}
          <span style={{
            background: active ? c.color : (isDark ? "#1E2A3B" : "#E8EEF6"),
            color: active ? "#fff" : isDark ? "#64748B" : "#94A3B8",
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
  const { isDark }    = useTheme();
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

  const pageBg = isDark ? "#0C1118" : "#F0F4FF";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const border = isDark ? "#1E2A3B" : "#E8EEF6";
  const txtMut = isDark ? "#64748B" : "#94A3B8";

  const STATS = [
    { label: "Assigned",    value: counts.total,       color: "#7C3AED", bg: isDark ? "#2D1B69" : "#F3EEFF" },
    { label: "To Do",       value: counts.todo,        color: "#D97706", bg: isDark ? "#3B2800" : "#FFFBEB" },
    { label: "In Progress", value: counts.in_progress, color: "#2563EB", bg: isDark ? "#1A2E5C" : "#EFF6FF" },
    { label: "Completed",   value: counts.done,        color: "#16A34A", bg: isDark ? "#0F3020" : "#F0FDF4" },
    { label: "Overdue",     value: counts.overdue,     color: "#DC2626", bg: isDark ? "#3B0A0A" : "#FFF1F2" },
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

      <div style={{ padding: isMobile ? "0 12px 24px" : "0 20px 28px", background: pageBg, minHeight: "calc(100vh - 118px)" }}>

        {/* Stats */}
        <div className="mt-stats" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              background: cardBg, border: `1px solid ${border}`,
              borderRadius: 13, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
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
          boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <input
            placeholder="Search my tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 150, padding: "7px 12px", borderRadius: 9,
              border: `1px solid ${border}`,
              background: isDark ? "#1A2438" : "#F4F7FF",
              color: isDark ? "#E2E8F0" : "#0F172A",
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
            counts={counts} isDark={isDark} border={border}
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
            <div style={{ fontWeight: 700, fontSize: 16, color: isDark ? "#E2E8F0" : "#0F172A", marginBottom: 6 }}>
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
                isDark={isDark}
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
