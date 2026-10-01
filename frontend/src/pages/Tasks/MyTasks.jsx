import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar, Button, Drawer, Dropdown, Empty, Flex, Input, Segmented, Select, Skeleton, Table, Tooltip, Typography, message,
} from "antd";
import {
  AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, MoreOutlined, PlayCircleOutlined,
  ReloadOutlined, SnippetsOutlined, SyncOutlined, UnorderedListOutlined,
} from "@ant-design/icons";
import { AlertTriangle, ChevronDown, Flame, Minus } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchTasks, updateTask } from "../../features/taskSlice";
import PageHeader from "../../components/layout/PageHeader";
import { categoricalColorFor } from "../../utils/colorPalette";

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

/* The same board as the School Admin's Task Management (the tm-* styles in _pages.scss), for the
   tasks assigned to whoever is signed in. They cannot create, edit or delete a task; they move
   their own part of it between To Do, In Progress and Done. */
const COLUMNS = [
  { key: "todo",        label: "To Do",       color: "var(--warning)", icon: <ClockCircleOutlined /> },
  { key: "in_progress", label: "In Progress", color: "var(--primary)", icon: <SyncOutlined />        },
  { key: "done",        label: "Done",        color: "var(--success)", icon: <CheckCircleOutlined /> },
];
const STATUS_LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled" };

const PRIORITY = {
  low:    { label: "Low",    color: "var(--text-secondary)", icon: <Minus size={9} /> },
  medium: { label: "Medium", color: "var(--warning-hover)", icon: <ChevronDown size={9} /> },
  high:   { label: "High",   color: "var(--orange)", icon: <Flame size={9} /> },
  urgent: { label: "Urgent", color: "var(--danger-hover)", icon: <AlertTriangle size={9} /> },
};

const idOf = (v) => String(v?._id || v || "");
const isOpen = (t) => t.mine === "todo" || t.mine === "in_progress";
const isOverdue = (t) => Boolean(t.dueDate) && isOpen(t) && dayjs(t.dueDate).isBefore(dayjs(), "day");
const isDueToday = (t) => Boolean(t.dueDate) && isOpen(t) && dayjs(t.dueDate).isSame(dayjs(), "day");

// Late work first, then whatever is due soonest, undated last.
const sortTasks = (list) => {
  const due = (t) => (t.dueDate ? dayjs(t.dueDate).valueOf() : Number.MAX_SAFE_INTEGER);
  return [...list].sort((a, b) => (isOverdue(a) ? 0 : 1) - (isOverdue(b) ? 0 : 1)
    || due(a) - due(b)
    || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

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

const DueChip = ({ task }) => {
  if (!task.dueDate) return null;
  const d = dayjs(task.dueDate);
  const overdue = isOverdue(task);
  const today = isDueToday(task);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600,
      color: overdue ? "var(--danger)" : today ? "var(--warning-hover)" : "var(--text-muted)",
      background: overdue ? "var(--danger-light)" : today ? "var(--warning-light)" : "var(--surface-soft)",
      padding: "2px 7px", borderRadius: 6,
    }}>
      <ClockCircleOutlined style={{ fontSize: 9 }} />
      {overdue ? `Overdue · ${d.fromNow(true)} late` : today ? "Due today" : d.format("DD MMM")}
    </span>
  );
};

// Who set the task (the admin's board shows who it is assigned to; here that is always you).
const From = ({ task, me }) => {
  const a = task.assignedBy;
  if (!a || idOf(a) === me || typeof a !== "object") return null;
  const name = a.name || a.email?.split("@")[0] || "";
  return (
    <Tooltip title={`From ${name}`}>
      <Avatar size={20} style={{ background: categoricalColorFor(name), fontSize: 9 }}>{name[0]?.toUpperCase()}</Avatar>
    </Tooltip>
  );
};

const TaskCard = ({ task, me, onOpen, onMenu, onDragStart, onDragEnd, isDragging }) => {
  const classes = ["tm-card"];
  if (isOverdue(task)) classes.push("is-overdue");
  if (isDragging) classes.push("is-dragging");
  return (
    <div
      className={classes.join(" ")}
      draggable role="button" tabIndex={0}
      onDragStart={() => onDragStart(task)} onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(task); } }}
    >
      <div className="tm-card-title">{task.title}</div>
      {task.description && <div className="tm-card-desc">{task.description}</div>}
      <Flex align="center" justify="space-between" wrap="wrap" gap={6}>
        <Flex align="center" gap={5} wrap="wrap">
          <PriorityPill priority={task.priority} />
          <DueChip task={task} />
        </Flex>
        <From task={task} me={me} />
      </Flex>
      <Dropdown menu={onMenu(task)} trigger={["click"]} placement="bottomRight">
        <button className="tm-card-menu" aria-label="Task actions" onClick={(e) => e.stopPropagation()}>
          <MoreOutlined />
        </button>
      </Dropdown>
    </div>
  );
};

const KanbanColumn = ({ col, tasks, me, onOpen, onMenu, dragState, onDragStart, onDragEnd, onDrop }) => {
  const [over, setOver] = useState(false);
  return (
    <div className="tm-col" style={{ "--tm-col": col.color }}>
      <div className="tm-col-head">
        <span className="tm-col-title"><span className="tm-col-icon">{col.icon}</span>{col.label}</span>
        <span className="tm-col-count">{tasks.length}</span>
      </div>
      <div
        className={over ? "tm-drop is-over" : "tm-drop"}
        style={{ borderRadius: "0 0 12px 12px" }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); onDrop(col.key); }}
      >
        {tasks.length === 0 && <div className="tm-col-empty">{dragState ? "Drop here" : "Nothing here"}</div>}
        {tasks.map((t) => (
          <TaskCard
            key={t._id} task={t} me={me} onOpen={onOpen} onMenu={onMenu}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragState?.task?._id === t._id}
          />
        ))}
      </div>
    </div>
  );
};

const MyTasks = () => {
  const dispatch = useDispatch();
  const { items: tasks = [], loading = false } = useSelector((s) => s.tasks || {});
  const { user } = useSelector((s) => s.auth || {});
  const me = idOf(user);

  const [view, setView] = useState("board");
  const [filterPri, setFilterPri] = useState(null);
  const [quick, setQuick] = useState(null);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [dragState, setDragState] = useState(null);

  // Everything at once: the board sorts and filters it here, and the API's default page hid the rest.
  const load = () => dispatch(fetchTasks({ limit: 1000 }));
  useEffect(() => { load(); }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // My own progress on the task, not the roll-up across everyone assigned to it: with two people
  // on a task, marking your part done used to leave it sitting in "In Progress". A task the office
  // cancelled is no longer mine to do, so it is left off the board.
  const mine = useMemo(() => tasks
    .filter((t) => t.status !== "cancelled" && Array.isArray(t.assignedTo) && t.assignedTo.some((u) => idOf(u) === me))
    .map((t) => {
      const own = (t.assigneeStatus || []).find((a) => idOf(a.userId) === me);
      return { ...t, mine: own?.status || t.status || "todo" };
    }), [tasks, me]);

  // One path for every status change: a drag, the ⋯ menu, the list's select and the drawer buttons.
  const moveTo = async (task, status) => {
    if (!task || task.mine === status) return;
    try {
      await dispatch(updateTask({ id: task._id, myStatus: status })).unwrap();
      setDetail((d) => (d?._id === task._id ? { ...d, mine: status } : d));
      message.success(`Moved to ${STATUS_LABEL[status]}`);
      load();
    } catch (e) {
      message.error(typeof e === "string" ? e : "Could not update the task");
    }
  };

  const handleDrop = async (target) => {
    if (!dragState?.task) return;
    const { task } = dragState;
    setDragState(null);
    await moveTo(task, target);
  };

  // Dragging works with a mouse; this menu is how the same move happens on a trackpad or a phone.
  const cardMenu = (task) => ({
    items: [
      { key: "open", label: "Open details", icon: <SnippetsOutlined /> },
      { type: "divider" },
      ...COLUMNS.filter((c) => c.key !== task.mine).map((c) => ({ key: `move:${c.key}`, label: `Move to ${c.label}`, icon: c.icon })),
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "open") setDetail(task);
      else if (key.startsWith("move:")) moveTo(task, key.slice(5));
    },
  });

  const QUICK = { open: isOpen, today: isDueToday, overdue: isOverdue };
  const q = search.trim().toLowerCase();
  const filtered = mine.filter((t) => {
    if (filterPri && t.priority !== filterPri) return false;
    if (quick && !QUICK[quick](t)) return false;
    if (q && !t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    return true;
  });
  const byColumn = Object.fromEntries(COLUMNS.map((c) => [c.key, sortTasks(filtered.filter((t) => t.mine === c.key))]));

  const STATS = [
    { key: "open",    label: "Open",      value: mine.filter(isOpen).length,     color: "var(--primary)" },
    { key: "today",   label: "Due today", value: mine.filter(isDueToday).length, color: "var(--warning)" },
    { key: "overdue", label: "Overdue",   value: mine.filter(isOverdue).length,  color: "var(--danger)" },
  ];
  const doneCount = mine.filter((t) => t.mine === "done").length;
  const pct = mine.length ? Math.round((doneCount / mine.length) * 100) : 0;
  const isFiltered = Boolean(filterPri || quick || q);
  const clearFilters = () => { setFilterPri(null); setQuick(null); setSearch(""); };

  const nextStep = (t) => (t.mine === "todo"
    ? <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => moveTo(t, "in_progress")}>Start</Button>
    : null);

  return (
    <>
      <PageHeader
        title="My Tasks"
        subtitle="Tasks assigned to you. Drag a card, or use its menu, to update where you are with it."
        icon={<SnippetsOutlined />}
        extra={<Tooltip title="Refresh"><Button icon={<ReloadOutlined />} onClick={load} /></Tooltip>}
      />

      <div className="page-wrapper">
        {/* ── One toolbar: quick-filter chips, progress, search and filters ── */}
        <div className="section-panel" style={{ padding: "10px 14px", marginBottom: 12 }}>
          <Flex align="center" justify="space-between" gap={10} wrap="wrap" style={{ marginBottom: 8 }}>
            <Flex gap={6} wrap="wrap">
              {STATS.map((s) => (
                <button
                  key={s.key}
                  className={quick === s.key ? "tm-stat is-active" : "tm-stat"}
                  style={{ "--tm-col": s.color }}
                  disabled={s.value === 0 && quick !== s.key}
                  onClick={() => setQuick((cur) => (cur === s.key ? null : s.key))}
                >
                  <span className="tm-stat-value">{s.value}</span>
                  <span className="tm-stat-label">{s.label}</span>
                </button>
              ))}
            </Flex>
            <Flex align="center" gap={10}>
              <div style={{ width: 120, height: 6, background: "var(--border-muted)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--success)", borderRadius: 4, transition: "width 0.4s" }} />
              </div>
              <Text className="u-meta">
                <b style={{ color: "var(--success)" }}>{pct}%</b>{" · "}{doneCount} of {mine.length} done
              </Text>
            </Flex>
          </Flex>

          <Flex align="center" justify="space-between" gap={8} wrap="wrap">
            <Flex gap={8} align="center" wrap="wrap">
              <Input.Search size="small" placeholder="Search tasks…" allowClear value={search}
                onChange={(e) => setSearch(e.target.value)} onSearch={setSearch} style={{ width: 200 }} />
              <Select size="small" allowClear placeholder="All priorities" style={{ width: 130 }} value={filterPri} onChange={setFilterPri}
                options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span> }))} />
              {isFiltered && <Button size="small" onClick={clearFilters}>Clear</Button>}
            </Flex>
            <Segmented
              size="small" value={view} onChange={setView}
              options={[
                { value: "board", icon: <AppstoreOutlined />, label: "Board" },
                { value: "list", icon: <UnorderedListOutlined />, label: "List" },
              ]}
            />
          </Flex>
          {isFiltered && (
            <Text className="u-meta u-mt-2" style={{ display: "block" }}>Showing {filtered.length} of {mine.length} tasks</Text>
          )}
        </div>

        {loading && mine.length === 0 ? (
          <div className="tm-board">
            {COLUMNS.map((c) => (
              <div key={c.key} className="tm-col" style={{ "--tm-col": c.color }}>
                <div className="tm-col-head"><Skeleton active title={{ width: 90 }} paragraph={false} /></div>
                <div className="tm-drop"><Skeleton active paragraph={{ rows: 3 }} /></div>
              </div>
            ))}
          </div>
        ) : mine.length === 0 ? (
          <div className="page-card" style={{ padding: "48px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks assigned to you yet. When the office gives you a task it appears here with its due date." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="page-card" style={{ padding: "40px 0" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks match these filters">
              <Button onClick={clearFilters}>Clear filters</Button>
            </Empty>
          </div>
        ) : view === "list" ? (
          <div className="section-panel" style={{ padding: 10 }}>
            <Table
              size="small" rowKey="_id" dataSource={sortTasks(filtered)}
              pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: "max-content" }}
              onRow={(t) => ({ onClick: () => setDetail(t), style: { cursor: "pointer" } })}
              columns={[
                {
                  title: "Task",
                  render: (_, t) => (
                    <div style={{ maxWidth: 380 }}>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      {t.description ? <div className="u-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div> : null}
                    </div>
                  ),
                },
                { title: "Priority", width: 100, render: (_, t) => <PriorityPill priority={t.priority} /> },
                {
                  title: "Status", width: 150,
                  render: (_, t) => (
                    <span onClick={(e) => e.stopPropagation()} role="presentation">
                      <Select size="small" value={t.mine} style={{ width: 130 }} onChange={(v) => moveTo(t, v)}
                        options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))} />
                    </span>
                  ),
                },
                { title: "Due", width: 150, render: (_, t) => (t.dueDate ? <DueChip task={t} /> : "—") },
                { title: "From", width: 130, render: (_, t) => t.assignedBy?.name || "—" },
              ]}
            />
          </div>
        ) : (
          <div className="tm-board">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key} col={col} me={me}
                tasks={byColumn[col.key] || []}
                onOpen={setDetail} onMenu={cardMenu}
                dragState={dragState}
                onDragStart={(t) => setDragState({ task: t })}
                onDragEnd={() => setDragState(null)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={Boolean(detail)} onClose={() => setDetail(null)} width={440} title="Task details"
        footer={detail && (
          <Flex gap={8} wrap="wrap">
            {nextStep(detail)}
            {detail.mine !== "done" ? (
              <Button type={detail.mine === "in_progress" ? "primary" : "default"} icon={<CheckCircleOutlined />} onClick={() => moveTo(detail, "done")}>Mark done</Button>
            ) : (
              <Button icon={<SyncOutlined />} onClick={() => moveTo(detail, "in_progress")}>Reopen</Button>
            )}
          </Flex>
        )}
      >
        {detail && (
          <>
            <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 10 }}>
              <PriorityPill priority={detail.priority} />
              <DueChip task={detail} />
            </Flex>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 12 }}>{detail.title}</div>
            {detail.description ? (
              <Paragraph style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)", marginBottom: 20 }}>{detail.description}</Paragraph>
            ) : (
              <Text className="u-meta" style={{ display: "block", marginBottom: 20 }}>No description</Text>
            )}
            <div className="tm-facts">
              <span className="tm-fact-label">My status</span>
              <Select value={detail.mine} onChange={(v) => moveTo(detail, v)} style={{ width: "100%", maxWidth: 220 }}
                options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))} />
              <span className="tm-fact-label">Due</span>
              <span>{detail.dueDate ? dayjs(detail.dueDate).format("DD MMM YYYY") : "—"}</span>
              <span className="tm-fact-label">Assigned by</span>
              <span>{detail.assignedBy?.name || "—"}</span>
              {detail.assignedTo?.length > 1 && (
                <>
                  <span className="tm-fact-label">Also with</span>
                  <span>{detail.assignedTo.filter((u) => idOf(u) !== me).map((u) => u.name).filter(Boolean).join(", ")}</span>
                </>
              )}
              <span className="tm-fact-label">Created</span>
              <span>{detail.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY") : "—"}</span>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
};

export default MyTasks;
