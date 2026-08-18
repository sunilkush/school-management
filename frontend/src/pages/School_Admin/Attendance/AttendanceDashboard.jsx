import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Spin,
  Empty,
  Table,
  Select,
  Progress,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EditOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { fetchAttendanceSummary } from "../../../features/analyticsSlice";
import { fetchMonthlyReport }     from "../../../features/attendanceSlice";
import PageHeader                  from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
  sectionPanel,
} from "../../../styles/pageStyles";

const TABLE_CLS   = "sa-dash-tbl";
const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Quick-action card ─────────────────────────────────────────── */
const QuickAction = ({ icon, label, color, path, navigate }) => (
  <button
    onClick={() => navigate(path)}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "16px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border-muted)",
      borderRadius: 14,
      cursor: "pointer",
      transition: "all 0.2s",
      flex: "1 1 120px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background   = `${color}08`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-muted)";
      e.currentTarget.style.background   = "var(--surface)";
    }}
  >
    <div style={iconWell(color, 44)}>{icon}</div>
    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
      {label}
    </span>
  </button>
);

/* ── KPI stat card ─────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, color, sub }) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border-muted)",
      borderRadius: 14,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <div style={iconWell(color, 44)}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      {sub != null && (
        <Progress
          percent={sub}
          strokeColor={color}
          trailColor="var(--border-muted)"
          size="small"
          showInfo={false}
          style={{ marginTop: 6, marginBottom: 0 }}
        />
      )}
    </div>
  </div>
);

const AttendanceDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const { attendance, loading: analyticsLoadingMap } = useSelector(
    (s) => s.analytics || {}
  );
  const { monthlyReport, reportLoading } = useSelector(
    (s) => s.attendance || {}
  );
  const { user } = useSelector((s) => s.auth || {});

  const schoolId = user?.school?._id;

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear,  setSelectedYear]  = useState(dayjs().year());

  /* ── Fetch today's summary ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAttendanceSummary({ schoolId, date: dayjs().format("YYYY-MM-DD") }));
  }, [dispatch, schoolId]);

  /* ── Fetch monthly report for chart ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(
      fetchMonthlyReport({
        schoolId,
        month: selectedMonth + 1,
        year:  selectedYear,
        role:  "student",
        limit: 500,
      })
    );
  }, [dispatch, schoolId, selectedMonth, selectedYear]);

  /* ── Stats ── */
  const stats        = attendance || {};
  const totalStudents = stats.totalStudents  ?? 0;
  const presentToday  = stats.presentToday   ?? 0;
  const absentToday   = stats.absentToday    ?? 0;
  const lateToday     = stats.lateToday      ?? 0;
  const leaveToday    = stats.leaveToday     ?? 0;
  const attendanceRate = stats.attendanceRate ?? 0;

  /* ── Monthly chart data from report ── */
  const chartData = useMemo(() => {
    if (!Array.isArray(monthlyReport) || !monthlyReport.length) return [];

    // Build a day-by-day aggregate from all students' dailyStatus
    const dayMap = {};
    monthlyReport.forEach((student) => {
      if (!student.dailyStatus) return;
      Object.entries(student.dailyStatus).forEach(([day, status]) => {
        if (!dayMap[day]) dayMap[day] = { day, present: 0, absent: 0, late: 0 };
        if (status === "present") dayMap[day].present++;
        else if (status === "absent") dayMap[day].absent++;
        else if (status === "late")   dayMap[day].late++;
      });
    });

    return Object.values(dayMap)
      .sort((a, b) => Number(a.day) - Number(b.day))
      .map((d) => ({ ...d, day: `${d.day}` }));
  }, [monthlyReport]);

  /* ── Low-attendance students (< 75% in monthly report) ── */
  const lowAttendanceStudents = useMemo(() => {
    if (!Array.isArray(monthlyReport)) return [];
    return monthlyReport
      .filter((s) => {
        const total   = (s.totalDays || 0);
        const present = (s.presentDays || s.statusBreakdown?.present || 0);
        return total > 0 && (present / total) * 100 < 75;
      })
      .slice(0, 10);
  }, [monthlyReport]);

  /* ── Quick actions ── */
  // `color` feeds a `${color}08` hover-alpha-suffix trick and the shared iconWell() helper
  // (frontend/src/styles/pageStyles.js) below — both break with a var() string, so these
  // stay raw hex (except the one entry that was already var(--primary), left as pre-existing).
  const QUICK_ACTIONS = [
    { icon: <EditOutlined />,    label: "Mark Students",  color: "var(--primary)", path: "/dashboard/schooladmin/attendance/students" },
    { icon: <TeamOutlined />,    label: "Mark Teachers",  color: "#0891b2",        path: "/dashboard/schooladmin/attendance/teachers" },
    { icon: <UserOutlined />,    label: "Mark Staff",     color: "#F59E0B",        path: "/dashboard/schooladmin/attendance/staff"    },
    { icon: <CalendarOutlined />,label: "Leave Requests", color: "#14B8A6",        path: "/dashboard/schooladmin/attendance/leave"    },
    { icon: <FileTextOutlined />,label: "Reports",        color: "#22C55E",        path: "/dashboard/schooladmin/attendance/reports"  },
    { icon: <BarChartOutlined />,label: "Analytics",      color: "#F59E0B",        path: "/dashboard/schooladmin/attendance/analytics"},
  ];

  /* ── Low attendance table columns ── */
  const lowColumns = [
    {
      title: "Student",
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {r.name || r.userId?.name || "—"}
        </span>
      ),
    },
    {
      title: "Present Days",
      render: (_, r) => {
        const present = r.presentDays || r.statusBreakdown?.present || 0;
        const total   = r.totalDays   || 0;
        const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={pct}
              size="small"
              strokeColor={pct < 60 ? "var(--danger)" : "var(--warning)"}
              trailColor="var(--border-muted)"
              showInfo={false}
              style={{ flex: 1, minWidth: 60 }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: pct < 60 ? "var(--danger)" : "var(--warning)",
                minWidth: 36,
              }}
            >
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      title: "Absences",
      render: (_, r) => (
        <span style={{ color: "var(--danger)", fontWeight: 600 }}>
          {r.statusBreakdown?.absent ?? "—"}
        </span>
      ),
    },
  ];

  const loading = (typeof analyticsLoadingMap === "object" ? analyticsLoadingMap?.attendance : analyticsLoadingMap) || false;

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Dashboard"
        subtitle={`Today — ${dayjs().format("dddd, DD MMMM YYYY")}`}
        icon={<BarChartOutlined />}
      />

      {/* ── Quick Actions ── */}
      <div
        style={{
          ...sectionPanel,
          marginTop: 20,
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
          }}
        >
          Quick Actions
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {QUICK_ACTIONS.map((a) => (
            <QuickAction
              key={a.label}
              {...a}
              navigate={navigate}
            />
          ))}
        </div>
      </div>

      {/* ── Today KPI cards ── */}
      <Spin spinning={loading}>
        <div style={statGrid(150)}>
          <KpiCard
            icon={<TeamOutlined />}
            label="Total Students"
            value={totalStudents}
            color="var(--primary)"
          />
          {/* `color` on KpiCard feeds the shared iconWell() helper — see QUICK_ACTIONS note above. */}
          <KpiCard
            icon={<CheckCircleOutlined />}
            label="Present Today"
            value={presentToday}
            color="#22C55E"
            sub={
              totalStudents > 0
                ? Math.round((presentToday / totalStudents) * 100)
                : 0
            }
          />
          <KpiCard
            icon={<CloseCircleOutlined />}
            label="Absent Today"
            value={absentToday}
            color="#EF4444"
          />
          <KpiCard
            icon={<ClockCircleOutlined />}
            label="Late Today"
            value={lateToday}
            color="#F59E0B"
          />
          <KpiCard
            icon={<CalendarOutlined />}
            label="On Leave Today"
            value={leaveToday}
            color="#0891b2"
          />
          <KpiCard
            icon={<BarChartOutlined />}
            label="Attendance Rate"
            value={`${Number(attendanceRate).toFixed(1)}%`}
            color="var(--primary)"
            sub={Math.round(Number(attendanceRate))}
          />
        </div>
      </Spin>

      {/* ── Bottom two panels ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          marginTop: 8,
        }}
      >
        {/* ── Monthly trend chart ── */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "18px 20px",
          }}
        >
          {/* Chart header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              Monthly Attendance Trend
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                size="small"
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 100 }}
                options={MONTHS.map((m, i) => ({ value: i, label: m }))}
              />
              <Select
                size="small"
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 80 }}
                options={[2023, 2024, 2025, 2026].map((y) => ({
                  value: y,
                  label: `${y}`,
                }))}
              />
            </div>
          </div>

          <Spin spinning={reportLoading}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barSize={10}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-muted)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border-muted)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="present"
                    name="Present"
                    fill="var(--success)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill="var(--danger)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="Late"
                    fill="var(--warning)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No data for selected month
                    </span>
                  }
                />
              </div>
            )}
          </Spin>
        </div>

        {/* ── Low attendance students ── */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <WarningOutlined style={{ color: "var(--warning)" }} />
              Low Attendance
            </div>
            <Button
              type="link"
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() =>
                navigate("/dashboard/schooladmin/attendance/analytics")
              }
              style={{ color: "var(--primary)", padding: 0, fontSize: 12 }}
            >
              View All
            </Button>
          </div>

          {lowAttendanceStudents.length > 0 ? (
            <Table
              className={TABLE_CLS}
              rowKey={(r) => r.userId || r.name}
              columns={lowColumns}
              dataSource={lowAttendanceStudents}
              pagination={false}
              size="small"
              scroll={{ x: 250 }}
            />
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <CheckCircleOutlined
                style={{ fontSize: 32, color: "var(--success)", marginBottom: 8 }}
              />
              <div
                style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}
              >
                All students above 75%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigate to Analytics button ── */}
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button
          type="default"
          icon={<BarChartOutlined />}
          onClick={() =>
            navigate("/dashboard/schooladmin/attendance/analytics")
          }
          style={{ borderColor: "var(--border-muted)" }}
        >
          Full Analytics Report
        </Button>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
