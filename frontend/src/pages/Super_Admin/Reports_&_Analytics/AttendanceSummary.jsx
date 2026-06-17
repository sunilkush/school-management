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
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  CalendarOutlined,
  ReloadOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchAttendanceSummary } from "../../../features/analyticsSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  statGrid,
  iconWell,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

const { Option } = Select;

const TABLE_CLS = "attendance-tbl";

const StatCard = ({ icon, label, value, color, suffix }) => (
  <div style={{
    background: "var(--surface)",
    border: "1px solid var(--border-muted)",
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "var(--shadow-soft)",
  }}>
    <div style={iconWell(color, 44)}>
      {icon}
    </div>
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
        {value !== undefined && value !== null ? value : "—"}
        {suffix && <span style={{ fontSize: 14, marginLeft: 3 }}>{suffix}</span>}
      </div>
    </div>
  </div>
);

const AttendanceSummary = () => {
  const dispatch = useDispatch();
  const { attendance, loading: loadingMap, error } = useSelector((s) => s.analytics || {});
  const { schools = [] } = useSelector((s) => s.school || {});
  const loading = loadingMap?.attendance || false;

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDate, setSelectedDate]     = useState(null);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools]
  );

  const doFetch = useCallback(
    (schoolId, date) => {
      const params = {};
      if (schoolId) params.schoolId = schoolId;
      if (date) params.date = date.format("YYYY-MM-DD");
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

  const handleRefresh = () => {
    doFetch(selectedSchool, selectedDate);
  };

  /* ── Derive stats from API data ── */
  const stats = attendance || {};
  const totalStudents  = stats.totalStudents  ?? "—";
  const presentToday   = stats.presentToday   ?? "—";
  const absentToday    = stats.absentToday    ?? "—";
  const lateToday      = stats.lateToday      ?? "—";
  const attendanceRate = stats.attendanceRate != null
    ? `${Number(stats.attendanceRate).toFixed(1)}`
    : "—";

  /* ── School stats table ── */
  const schoolStats = stats.schoolStats || [];

  const schoolColumns = [
    {
      title: "School",
      dataIndex: "schoolName",
      render: (n) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n || "—"}</span>,
    },
    {
      title: "Total Students",
      dataIndex: "totalStudents",
      align: "right",
    },
    {
      title: "Present",
      dataIndex: "present",
      align: "right",
      render: (v) => <span style={{ color: "var(--success)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title: "Absent",
      dataIndex: "absent",
      align: "right",
      render: (v) => <span style={{ color: "var(--danger)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title: "Late",
      dataIndex: "late",
      align: "right",
      render: (v) => <span style={{ color: "var(--warning)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title: "Rate",
      dataIndex: "attendanceRate",
      align: "right",
      render: (v) => v != null ? `${Number(v).toFixed(1)}%` : "—",
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Attendance Summary"
        subtitle="Overall student and staff attendance across schools"
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

      {/* Toolbar */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Select
          placeholder="All Schools"
          allowClear
          style={{ width: 220 }}
          onChange={handleSchoolChange}
          value={selectedSchool || undefined}
        >
          {schoolOptions.map((s) => (
            <Option key={s.value} value={s.value}>{s.label}</Option>
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

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px",
          background: "var(--danger)10",
          border: "1px solid var(--danger)30",
          borderRadius: 10,
          color: "var(--danger)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={handleRefresh}>Retry</Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* Stat Cards */}
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
            color="var(--success)"
          />
          <StatCard
            icon={<UserOutlined />}
            label="Absent Today"
            value={absentToday}
            color="var(--danger)"
          />
          <StatCard
            icon={<ClockCircleOutlined />}
            label="Late Today"
            value={lateToday}
            color="var(--warning)"
          />
          <StatCard
            icon={<PercentageOutlined />}
            label="Attendance Rate"
            value={attendanceRate}
            color="var(--primary)"
            suffix="%"
          />
        </div>

        {/* School Breakdown Table */}
        {schoolStats.length > 0 ? (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 8,
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-primary)",
            }}>
              School-wise Breakdown
            </div>
            <div style={tableContainer}>
              <Table
                className={TABLE_CLS}
                rowKey={(r) => r.schoolId || r.schoolName}
                columns={schoolColumns}
                dataSource={schoolStats}
                pagination={false}
                scroll={{ x: 600 }}
              />
            </div>
          </div>
        ) : !loading && attendance && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
            marginTop: 8,
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  No school-wise breakdown available
                </span>
              }
            />
          </div>
        )}

        {/* Empty state when no data at all */}
        {!loading && !attendance && !error && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "56px 24px",
            textAlign: "center",
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "var(--text-muted)" }}>No attendance data available</span>}
            >
              <Button type="primary" onClick={handleRefresh}>Load Data</Button>
            </Empty>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AttendanceSummary;
