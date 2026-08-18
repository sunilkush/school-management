import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Select, Button, Spin, Empty, Table, DatePicker, Progress, Alert,
} from "antd";
import {
  BarChartOutlined, TeamOutlined, UserOutlined, ClockCircleOutlined,
  PercentageOutlined, ReloadOutlined, WarningOutlined,
  EditOutlined, UnorderedListOutlined, FileTextOutlined,
} from "@ant-design/icons";
import { fetchAttendanceSummary } from "../../features/analyticsSlice";
import { fetchSchools }           from "../../features/schoolSlice";
import PageHeader                 from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, iconWell, toolbarRow, tableHeadCss, pill,
} from "../../styles/pageStyles";

const TABLE_CLS   = "sa-dash-tbl";
const LOW         = 75;

/* ── KPI card ───────────────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, color, suffix }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 14, padding: "18px 20px",
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  }}>
    <div style={iconWell(color, 46)}>{icon}</div>
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
        {value ?? "—"}
        {suffix && <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 3 }}>{suffix}</span>}
      </div>
    </div>
  </div>
);

/* ── Quick action button ─────────────────────────────────────────────── */
const QuickBtn = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: "1 1 160px", padding: "14px 18px",
      background: "var(--surface)", border: `1.5px solid color-mix(in srgb, ${color} 16%, transparent)`,
      borderRadius: 12, cursor: "pointer", display: "flex",
      alignItems: "center", gap: 10, fontWeight: 600, fontSize: 13,
      color: "var(--text-primary)", transition: "border-color 0.15s, background 0.15s",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background  = `color-mix(in srgb, ${color} 4%, transparent)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 16%, transparent)`;
      e.currentTarget.style.background  = "var(--surface)";
    }}
  >
    <div style={iconWell(color, 34)}>{icon}</div>
    {label}
  </button>
);

/* ── Main component ─────────────────────────────────────────────────── */
const AttendanceDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const { attendance, loading: loadingMap, error } = useSelector((s) => s.analytics || {});
  const { schools = [] }                           = useSelector((s) => s.school   || {});
  const loading = (typeof loadingMap === "object" ? loadingMap?.attendance : loadingMap) || false;

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDate,   setSelectedDate]   = useState(null);

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  /* ── Fetch ── */
  const doFetch = useCallback(
    (schoolId, date) => {
      const params = {};
      if (schoolId) params.schoolId = schoolId;
      if (date)     params.date     = date.format("YYYY-MM-DD");
      dispatch(fetchAttendanceSummary(params));
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchSchools());
    doFetch("", null);
  }, [dispatch, doFetch]);

  /* ── Derived ── */
  const stats       = attendance || {};
  const schoolStats = useMemo(() => attendance?.schoolStats || [], [attendance]);

  const lowSchools = useMemo(
    () => schoolStats.filter((s) => s.attendanceRate != null && Number(s.attendanceRate) < LOW),
    [schoolStats],
  );

  const avgRate =
    stats.attendanceRate != null ? Number(stats.attendanceRate).toFixed(1) : "—";

  /* ── Quick actions ── */
  const QUICK_ACTIONS = [
    {
      label: "Mark Attendance",
      icon:  <EditOutlined />,
      color: "var(--primary)",
      path:  "dashboard/superadmin/attendance/mark",
    },
    {
      label: "Attendance Table",
      icon:  <UnorderedListOutlined />,
      color: "var(--cyan)",
      path:  "dashboard/superadmin/attendance/table",
    },
    {
      label: "Monthly Report",
      icon:  <FileTextOutlined />,
      color: "var(--success)",
      path:  "dashboard/superadmin/attendance/monthly",
    },
  ];

  /* ── Table columns ── */
  const schoolColumns = [
    {
      title:     "School",
      dataIndex: "schoolName",
      render:    (n) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n || "—"}</span>
      ),
    },
    {
      title:  "Present",
      dataIndex: "present",
      align:  "right",
      width:  80,
      render: (v) => <span style={{ color: "var(--success)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title:  "Absent",
      dataIndex: "absent",
      align:  "right",
      width:  80,
      render: (v) => <span style={{ color: "var(--danger)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title:  "Late",
      dataIndex: "late",
      align:  "right",
      width:  80,
      render: (v) => <span style={{ color: "var(--warning)", fontWeight: 600 }}>{v ?? "—"}</span>,
    },
    {
      title:     "Attendance Rate",
      dataIndex: "attendanceRate",
      width:     200,
      render:    (v) => {
        if (v == null) return "—";
        const pct = Number(v).toFixed(1);
        const low = Number(v) < LOW;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={Number(pct)}
              size="small"
              strokeColor={low ? "var(--danger)" : "var(--success)"}
              trailColor="var(--border-muted)"
              showInfo={false}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{
              fontWeight: 700, fontSize: 13,
              color: low ? "var(--danger)" : "var(--success)",
              minWidth: 44, textAlign: "right",
            }}>
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
        title="Attendance Overview"
        subtitle="Platform-wide student attendance across all schools"
        icon={<BarChartOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => doFetch(selectedSchool, selectedDate)}
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
          showSearch
          style={{ width: 240 }}
          value={selectedSchool || undefined}
          options={schoolOptions}
          filterOption={(input, opt) =>
            opt.label.toLowerCase().includes(input.toLowerCase())
          }
          onChange={(val) => {
            setSelectedSchool(val || "");
            doFetch(val || "", selectedDate);
          }}
        />
        <DatePicker
          placeholder="Select date (today)"
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            doFetch(selectedSchool, date);
          }}
          style={{ width: 190 }}
          allowClear
        />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          padding: "13px 18px",
          background: "color-mix(in srgb, var(--danger) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--danger) 19%, transparent)",
          borderRadius: 10, color: "var(--danger)", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={() => doFetch(selectedSchool, selectedDate)}>
            Retry
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* ── KPI cards ── */}
        <div style={statGrid(155)}>
          <KpiCard icon={<TeamOutlined />}          label="Total Students"  value={stats.totalStudents} color="var(--primary)" />
          <KpiCard icon={<UserOutlined />}           label="Present Today"   value={stats.presentToday}  color="var(--success)" />
          <KpiCard icon={<UserOutlined />}           label="Absent Today"    value={stats.absentToday}   color="var(--danger)" />
          <KpiCard icon={<ClockCircleOutlined />}    label="Late Today"      value={stats.lateToday}     color="var(--warning)" />
          <KpiCard icon={<PercentageOutlined />}     label="Attendance Rate" value={avgRate}             color="var(--primary)" suffix="%" />
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map(({ label, icon, color, path }) => (
            <QuickBtn
              key={path}
              label={label}
              icon={icon}
              color={color}
              onClick={() => navigate(`/${path}`)}
            />
          ))}
        </div>

        {/* ── Low-attendance alert ── */}
        {lowSchools.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16, borderRadius: 10 }}
            message={
              <span style={{ fontWeight: 600 }}>
                {lowSchools.length} school{lowSchools.length > 1 ? "s" : ""} below {LOW}% attendance
              </span>
            }
            description={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {lowSchools.map((s) => (
                  <span key={s.schoolId || s.schoolName} style={pill("var(--danger)")}>
                    {s.schoolName} — {Number(s.attendanceRate).toFixed(1)}%
                  </span>
                ))}
              </div>
            }
          />
        )}

        {/* ── School-wise table ── */}
        {schoolStats.length > 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-muted)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              fontWeight: 700, fontSize: 14, color: "var(--text-primary)",
            }}>
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
          !loading && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-muted)",
              borderRadius: 14, padding: "52px 24px", textAlign: "center",
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "var(--text-muted)" }}>
                    {attendance
                      ? "No school-wise breakdown available for the selected filters"
                      : "Click Refresh to load attendance data"}
                  </span>
                }
              >
                {!attendance && (
                  <Button type="primary" onClick={() => doFetch(selectedSchool, selectedDate)}>
                    Load Data
                  </Button>
                )}
              </Empty>
            </div>
          )
        )}
      </Spin>
    </div>
  );
};

export default AttendanceDashboard;
