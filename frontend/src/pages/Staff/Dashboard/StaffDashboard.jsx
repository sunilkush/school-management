import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Empty, Space } from "antd";
import {
  ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ScheduleOutlined, IdcardOutlined, WalletOutlined,
  MessageOutlined, DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchTasks } from "../../../features/taskSlice";
import { useGetRoleDashboardOverviewQuery } from "../../../services/schoolDashboardApi";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
} from "../../../styles/pageStyles";

const PRIORITY_COLOR = {
  low:    ["#64748B", "rgba(241,245,249,0.6)"],
  medium: ["#B45309", "rgba(254,243,199,0.5)"],
  high:   ["#EA580C", "rgba(255,247,237,0.7)"],
  urgent: ["#DC2626", "rgba(254,226,226,0.5)"],
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const StaffDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, refetch } = useGetRoleDashboardOverviewQuery();
  const { items: tasks = [], loading: tasksLoading } = useSelector((s) => s.tasks || {});

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const loading = isLoading || isFetching || tasksLoading;

  const metrics = useMemo(() => {
    const map = Object.fromEntries((data?.metrics || []).map((m) => [m.key, m]));
    return {
      attendance: map.attendance?.value ?? 0,
      pendingTasks: map.pending_tasks?.value ?? 0,
      completedTasks: map.completed_tasks?.value ?? 0,
    };
  }, [data]);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === "todo" || t.status === "in_progress")
      .sort((a, b) => {
        const da = a.dueDate ? dayjs(a.dueDate).valueOf() : Infinity;
        const db = b.dueDate ? dayjs(b.dueDate).valueOf() : Infinity;
        return da - db;
      })
      .slice(0, 5);
  }, [tasks]);

  const handleRefresh = () => {
    refetch();
    dispatch(fetchTasks());
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Staff Dashboard"
        subtitle="Your attendance, tasks and quick actions in one place."
        icon={<DashboardOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ ...statGrid(190), marginTop: 20 }}>
        <StatCard icon={<ScheduleOutlined />} label="My Attendance (Month)" value={`${metrics.attendance}%`} color="#2563EB" />
        <StatCard icon={<ClockCircleOutlined />} label="Pending Tasks" value={metrics.pendingTasks} color="#F59E0B" />
        <StatCard icon={<CheckCircleOutlined />} label="Completed Tasks" value={metrics.completedTasks} color="#22C55E" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }} className="staff-dash-grid">
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>My Pending Tasks</span>
            <Button size="small" onClick={() => navigate("/dashboard/staff/tasks")}>View All</Button>
          </div>
          {pendingTasks.length === 0 ? (
            <Empty description="No pending tasks — you're all caught up!" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingTasks.map((task) => {
                const [color, bg] = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium;
                const overdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), "day") && task.status !== "done";
                return (
                  <div
                    key={task._id}
                    style={{
                      padding: "12px 14px", borderRadius: 10,
                      border: "1px solid var(--border-muted)",
                      background: "var(--surface-soft)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 10, flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: overdue ? "#DC2626" : "var(--text-muted)", marginTop: 2 }}>
                        {task.dueDate ? `Due ${dayjs(task.dueDate).format("DD MMM YYYY")}${overdue ? " (Overdue)" : ""}` : "No due date"}
                      </div>
                    </div>
                    <span style={pill(color, bg)}>{(task.priority || "medium").toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Quick Actions</div>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <Button block icon={<IdcardOutlined />} onClick={() => navigate("/dashboard/staff/attendance/self")}>
              GPS Check-In / Check-Out
            </Button>
            <Button block icon={<ScheduleOutlined />} onClick={() => navigate("/dashboard/staff/attendance")}>
              My Attendance
            </Button>
            <Button block icon={<ClockCircleOutlined />} onClick={() => navigate("/dashboard/staff/tasks")}>
              My Tasks
            </Button>
            <Button block icon={<WalletOutlined />} onClick={() => navigate("/dashboard/staff/payroll")}>
              My Payroll
            </Button>
            <Button block icon={<MessageOutlined />} onClick={() => navigate("/dashboard/staff/message")}>
              Messages
            </Button>
          </Space>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .staff-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default StaffDashboard;
