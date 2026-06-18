import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  Spin,
  Empty,
  Table,
  DatePicker,
  message,
  Progress,
  Alert,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  CalendarOutlined,
  ReloadOutlined,
  BarChartOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAttendanceSummary } from "../../../features/analyticsSlice";
import { fetchSchools }           from "../../../features/schoolSlice";
import PageHeader                 from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  statGrid,
  iconWell,
  tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;

const TABLE_CLS       = "attendance-tbl";
const LOW_THRESHOLD   = 75; // schools below this % get an alert

/* ── KPI stat card ───────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, suffix }) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border-muted)",
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: "var(--shadow-soft)",
    }}
  >
    <div style={iconWell(color, 44)}>{icon}</div>
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}
      >
        {value !== undefined && value !== null ? value : "—"}
        {suffix && (
          <span style={{ fontSize: 14, marginLeft: 3 }}>{suffix}</span>
        )}
      </div>
    </div>
  </div>
);

const AttendanceSummary = () => {
  const dispatch = useDispatch();

  const { attendance, loading: loadingMap, error } = useSelector(
    (s) => s.analytics || {}
  );
  const { schools = [] } = useSelector((s) => s.school || {});
  const loading          = loadingMap?.attendance || false;

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDate,   setSelectedDate]   = useState(null);

  const schoolOptions = useMemo(
    () =>
      schools
        .map((s) => ({ value: s._id, label: s.name }))
        .filter((s) => s.label),
    [schools]
  );

  /* ── Fetch helper ── */
  const doFetch = useCallback(
    (schoolId, date) => {
      const params = {};
      if (schoolId) params.schoolId = schoolId;
      if (date)     params.date = date.format("YYYY-MM-DD");
      dispatch(fetchAttendanceSummary(params));
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(fetchSchools());
    doFetch("", null);
  }, [dispatch]);

  const handleSchoolChange = (val) => {
    setSelectedSchool(val || "");
    doFetch(val || "", selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    doFetch(selectedSchool, date);
  };

  const handleRefresh = () => doFetch(selectedSchool, selectedDate);

  /* ── Derived stats ── */
  const stats          = attendance || {};
  const totalStudents  = stats.totalStudents   ?? "—";
  const presentToday   = stats.presentToday    ?? "—";
  const absentToday    = stats.absentToday     ?? "—";
  const lateToday      = stats.lateToday       ?? "—";
  const attendanceRate =
    stats.attendanceRate != null
      ? Number(stats.attendanceRate).toFixed(1)
      : "—";

  /* ── School stats table ── */
  const schoolStats = stats.schoolStats || [];

  /* ── Low-attendance alerts ── */
  const lowAttendanceSchools = useMemo(
    () =>
      schoolStats.filter(
        (s) => s.attendanceRate != null && Number(s.attendanceRate) < LOW_THRESHOLD
      ),
    [schoolStats]
  );

  /* ── Table columns ── */
  const schoolColumns = [
    {
      title: "School",
      dataIndex: "schoolName",
      render: (n) => (
        <span
          style={{ fontWeight: 600, color: "var(--text-primary)" }}
        >
          {n || "—"}
        </span>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalStudents",
      align: "right",
      width: 80,
    },
    {
      title: "Present",
      dataIndex: "present",
      align: "right",
      width: 80,
      render: (v) => (
        <span style={{ color: "#5BA89A", fontWeight: 600 }}>
          {v ?? "—"}
        </span>
      ),
    },
    {
      title: "Absent",
      dataIndex: "absent",
      align: "right",
      width: 80,
      render: (v) => (
        <span style={{ color: "#D96B7A", fontWeight: 600 }}>
          {v ?? "—"}
        </span>
      ),
    },
    {
      title: "Late",
      dataIndex: "late",
      align: "right",
      width: 80,
      render: (v) => (
        <span style={{ color: "#D4922A", fontWeight: 600 }}>
          {v ?? "—"}
        </span>
      ),
    },
    {
      title: "Attendance Rate",
      dataIndex: "attendanceRate",
      width: 180,
      render: (v) => {
        if (v == null) return "—";
        const pct  = Number(v).toFixed(1);
        const low  = Number(v) < LOW_THRESHOLD;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={Number(pct)}
              size="small"
              strokeColor={low ? "#D96B7A" : "#5BA89A"}
              trailColor="var(--border-muted)"
              showInfo={false}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: low ? "#D96B7A" : "#5BA89A",
                minWidth: 44,
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
        );
      },
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Summary"
        subtitle="System-wide student attendance across all schools"
        icon={<BarChartOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            style={{ borderColor: "var(--border-muted)" }}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Select
          placeholder="All Schools"
          allowClear
          style={{ width: 220 }}
          onChange={handleSchoolChange}
          value={selectedSchool || undefined}
        >
          {schoolOptions.map((s) => (
            <Option key={s.value} value={s.value}>
              {s.label}
            </Option>
          ))}
        </Select>

        <DatePicker
          placeholder="Select date"
          value={selectedDate}
          onChange={handleDateChange}
          style={{ width: 180 }}
          suffixIcon={<CalendarOutlined />}
          allowClear
        />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            background: "#D96B7A10",
            border: "1px solid #D96B7A30",
            borderRadius: 10,
            color: "#D96B7A",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <Button size="small" danger onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* ── KPI cards ── */}
        <div style={statGrid(160)}>
          <StatCard
            icon={<TeamOutlined />}
            label="Total Students"
            value={totalStudents}
            color="var(--primary)"
          />
          <StatCard
            icon={<UserOutlined />}
            label="Present Today"
            value={presentToday}
            color="#5BA89A"
          />
          <StatCard
            icon={<UserOutlined />}
            label="Absent Today"
            value={absentToday}
            color="#D96B7A"
          />
          <StatCard
            icon={<ClockCircleOutlined />}
            label="Late Today"
            value={lateToday}
            color="#D4922A"
          />
          <StatCard
            icon={<PercentageOutlined />}
            label="Attendance Rate"
            value={attendanceRate}
            color="var(--primary)"
            suffix="%"
          />
        </div>

        {/* ── Low-attendance alerts ── */}
        {lowAttendanceSchools.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16, borderRadius: 10 }}
            message={
              <span style={{ fontWeight: 600 }}>
                {lowAttendanceSchools.length} school
                {lowAttendanceSchools.length > 1 ? "s" : ""} below {LOW_THRESHOLD}%
                attendance
              </span>
            }
            description={
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 6,
                }}
              >
                {lowAttendanceSchools.map((s) => (
                  <span
                    key={s.schoolId || s.schoolName}
                    style={{
                      padding: "2px 10px",
                      background: "#D96B7A10",
                      color: "#D96B7A",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid #D96B7A25",
                    }}
                  >
                    {s.schoolName} — {Number(s.attendanceRate).toFixed(1)}%
                  </span>
                ))}
              </div>
            }
          />
        )}

        {/* ── School breakdown table ── */}
        {schoolStats.length > 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 14,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-muted)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              School-wise Breakdown
            </div>
            <Table
              className={TABLE_CLS}
              rowKey={(r) => r.schoolId || r.schoolName}
              columns={schoolColumns}
              dataSource={schoolStats}
              pagination={false}
              scroll={{ x: 640 }}
            />
          </div>
        ) : (
          !loading &&
          attendance && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-muted)",
                borderRadius: 14,
                padding: "40px 24px",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    No school-wise breakdown available
                  </span>
                }
              />
            </div>
          )
        )}

        {/* ── Full empty state ── */}
        {!loading && !attendance && !error && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 14,
              padding: "56px 24px",
              textAlign: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  No attendance data available
                </span>
              }
            >
              <Button type="primary" onClick={handleRefresh}>
                Load Data
              </Button>
            </Empty>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AttendanceSummary;
