import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  Spin,
  Empty,
  Table,
  DatePicker,
  Tag,
  Progress,
} from "antd";
import {
  BarChartOutlined,
  WarningOutlined,
  UserOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { fetchMonthlyReport } from "../../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import PageHeader              from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
  sectionPanel,
} from "../../../styles/pageStyles";

const TABLE_CLS = "analytics-tbl";
const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PIE_COLORS = {
  present: "var(--success)",
  absent:  "var(--danger)",
  late:    "var(--warning)",
  halfday: "var(--warning)",
  leave:   "var(--cyan)",
};

const AttendanceAnalytics = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector(
    (s) => s.attendance || {}
  );
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { user }               = useSelector((s) => s.auth || {});

  const schoolId = user?.school?._id;

  const [month,   setMonth]   = useState(dayjs().month());
  const [year,    setYear]    = useState(dayjs().year());
  const [classId, setClassId] = useState(null);
  const [role,    setRole]    = useState("student");

  /* ── Fetch ── */
  const doFetch = useCallback(() => {
    if (!schoolId) return;
    dispatch(
      fetchMonthlyReport({
        schoolId,
        month: month + 1,
        year,
        role,
        ...(classId ? { classId } : {}),
        limit: 500,
      })
    );
  }, [schoolId, month, year, role, classId, dispatch]);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSchoolClasses({ schoolId }));
    doFetch();
  }, [schoolId, dispatch, doFetch]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  /* ── Normalise classes ── */
  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  /* ── Aggregate totals ── */
  const totals = useMemo(() => {
    const acc = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0, totalDays: 0 };
    monthlyReport.forEach((s) => {
      const b = s.statusBreakdown || {};
      acc.present  += b.present  || 0;
      acc.absent   += b.absent   || 0;
      acc.late     += b.late     || 0;
      acc.halfday  += b.halfday  || 0;
      acc.leave    += b.leave    || 0;
      acc.totalDays += s.totalDays || 0;
    });
    const total = acc.present + acc.absent + acc.late + acc.halfday + acc.leave;
    return { ...acc, total, rate: total > 0 ? ((acc.present / total) * 100).toFixed(1) : 0 };
  }, [monthlyReport]);

  /* ── Daily trend chart data ── */
  const dailyTrend = useMemo(() => {
    const dayMap = {};
    monthlyReport.forEach((student) => {
      if (!student.dailyStatus) return;
      Object.entries(student.dailyStatus).forEach(([day, status]) => {
        const d = parseInt(day, 10);
        if (!dayMap[d]) dayMap[d] = { day: d, present: 0, absent: 0, late: 0 };
        if (status === "present") dayMap[d].present++;
        else if (status === "absent") dayMap[d].absent++;
        else if (status === "late")   dayMap[d].late++;
      });
    });
    return Object.values(dayMap)
      .sort((a, b) => a.day - b.day)
      .map((d) => ({ ...d, day: String(d.day) }));
  }, [monthlyReport]);

  /* ── Pie chart data ── */
  const pieData = useMemo(() =>
    Object.entries(PIE_COLORS)
      .filter(([k]) => totals[k] > 0)
      .map(([k]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: totals[k], key: k })),
    [totals]
  );

  /* ── Monthly attendance % per student (for bar chart) ── */
  const studentRates = useMemo(() =>
    monthlyReport.map((s) => {
      const present = s.presentDays || s.statusBreakdown?.present || 0;
      const total   = s.totalDays || 0;
      return {
        name: (s.name || s.userId?.name || "—").split(" ")[0],
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }).sort((a, b) => a.rate - b.rate).slice(0, 15), // bottom 15 for risk view
    [monthlyReport]
  );

  /* ── Chronic absentees (< 75%) ── */
  const chronicAbsentees = useMemo(() =>
    monthlyReport
      .map((s) => {
        const present = s.presentDays || s.statusBreakdown?.present || 0;
        const total   = s.totalDays || 0;
        const rate    = total > 0 ? Math.round((present / total) * 100) : 0;
        return { ...s, rate, present, total };
      })
      .filter((s) => s.total > 0 && s.rate < 75)
      .sort((a, b) => a.rate - b.rate),
    [monthlyReport]
  );

  /* ── Chronic absentee table columns ── */
  const absenteeColumns = [
    {
      title: "Name",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--primary-light)", color: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}
          >
            {(r.name || "S")[0].toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {r.name || r.userId?.name || "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Attendance",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
          <Progress
            percent={r.rate}
            size="small"
            strokeColor={r.rate < 50 ? "var(--danger)" : "var(--warning)"}
            trailColor="var(--border-muted)"
            showInfo={false}
            style={{ flex: 1 }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 12,
              color: r.rate < 50 ? "var(--danger)" : "var(--warning)",
              minWidth: 36,
            }}
          >
            {r.rate}%
          </span>
        </div>
      ),
    },
    {
      title: "Absent",
      dataIndex: undefined,
      render: (_, r) => (
        <Tag color="red">{r.statusBreakdown?.absent ?? "—"} days</Tag>
      ),
    },
    {
      title: "Risk",
      render: (_, r) => (
        <Tag color={r.rate < 50 ? "error" : "warning"}>
          {r.rate < 50 ? "Critical" : "At Risk"}
        </Tag>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Analytics"
        subtitle={`${MONTHS[month]} ${year} — Detailed attendance insights`}
        icon={<BarChartOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={doFetch}
            loading={reportLoading}
            style={{ borderColor: "var(--border-muted)" }}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          <Select
            value={role}
            onChange={setRole}
            options={[
              { value: "student", label: "Students" },
              { value: "teacher", label: "Teachers" },
              { value: "staff",   label: "Staff"    },
            ]}
            style={{ width: "100%" }}
          />
          {role === "student" && (
            <Select
              placeholder="All Classes"
              allowClear
              value={classId}
              onChange={(v) => setClassId(v || null)}
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              style={{ width: "100%" }}
            />
          )}
          <Select
            value={month}
            onChange={setMonth}
            options={MONTHS.map((m, i) => ({ value: i, label: m }))}
            style={{ width: "100%" }}
          />
          <Select
            value={year}
            onChange={setYear}
            options={[2023, 2024, 2025, 2026].map((y) => ({
              value: y,
              label: `${y}`,
            }))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <Spin spinning={reportLoading}>
        {/* ── Summary stat cards ── */}
        {/* `color` feeds the shared iconWell() helper (frontend/src/styles/pageStyles.js). */}
        <div style={statGrid(120)}>
          {[
            { key: "present",  label: "Present",   color: "var(--success)" },
            { key: "absent",   label: "Absent",    color: "var(--danger)"  },
            { key: "late",     label: "Late",      color: "var(--warning)" },
            { key: "halfday",  label: "Half Day",  color: "var(--warning)" },
            { key: "leave",    label: "Leave",     color: "var(--cyan)"    },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-muted)",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={iconWell(color, 34)}>
                <UserOutlined style={{ fontSize: 14 }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {totals[key]}
                </div>
              </div>
            </div>
          ))}
          {/* Rate card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 6,
              }}
            >
              Avg Rate
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--primary)",
                marginBottom: 4,
              }}
            >
              {totals.rate}%
            </div>
            <Progress
              percent={Number(totals.rate)}
              strokeColor="var(--primary)"
              trailColor="var(--border-muted)"
              size="small"
              showInfo={false}
            />
          </div>
        </div>

        {/* ── Two charts side by side ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Daily trend line chart */}
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
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Daily Attendance Trend
            </div>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={dailyTrend}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
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
                    width={28}
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
                    wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="present"
                    name="Present"
                    stroke="var(--success)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    name="Absent"
                    stroke="var(--danger)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    name="Late"
                    stroke="var(--warning)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)" }}>
                      No daily data
                    </span>
                  }
                />
              </div>
            )}
          </div>

          {/* Pie chart */}
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
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Status Breakdown
            </div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PIE_COLORS[entry.key] || "var(--text-muted)"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-muted)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pieData.map((d) => (
                    <div
                      key={d.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: PIE_COLORS[d.key],
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "var(--text-primary)" }}>
                          {d.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: PIE_COLORS[d.key],
                        }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)" }}>No data</span>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Student attendance rate bar chart ── */}
        {studentRates.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              Student-wise Attendance Rate
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 14,
              }}
            >
              Showing bottom 15 students by attendance %
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={studentRates}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-muted)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-muted)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v}%`, "Attendance"]}
                />
                <Bar
                  dataKey="rate"
                  name="Attendance %"
                  radius={[0, 4, 4, 0]}
                  fill="var(--accent)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Chronic absentees table ── */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <WarningOutlined style={{ color: "var(--warning)" }} />
            <span
              style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}
            >
              Students Below 75% Attendance
            </span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                padding: "1px 8px",
                background: "rgba(var(--danger-rgb), 0.08)",
                color: "var(--danger)",
                borderRadius: 99,
                fontWeight: 600,
                border: "1px solid rgba(var(--danger-rgb), 0.15)",
              }}
            >
              {chronicAbsentees.length}
            </span>
          </div>

          {chronicAbsentees.length > 0 ? (
            <Table
              className={TABLE_CLS}
              rowKey={(r) => r.userId || r.name}
              columns={absenteeColumns}
              dataSource={chronicAbsentees}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ x: 500 }}
            />
          ) : (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    No students below 75% for this period
                  </span>
                }
              />
            </div>
          )}
        </div>
      </Spin>
    </div>
  );
};

export default AttendanceAnalytics;
