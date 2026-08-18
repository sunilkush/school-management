import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Select,
  Spin,
  Table,
  message,
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  PercentageOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useDispatch, useSelector } from "react-redux";

dayjs.extend(weekOfYear);

import {
  fetchMyAttendance,
  markBulkAttendance,
} from "../../../features/attendanceSlice";
import StatusTag from "../../../components/attendance/StatusTag";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  statGrid,
  iconWell,
  tableHeadCss,
} from "../../../styles/pageStyles";

const TABLE_CLS = "my-att-tbl";

const MyAttendancePage = () => {
  const dispatch = useDispatch();

  const { myAttendance = [], loading, error } = useSelector((s) => s.attendance);
  const { user }                              = useSelector((s) => s.auth);

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [todayStatus,   setTodayStatus]   = useState("present");

  const isTeacher = user?.role?.name === "Teacher";

  /* ── Fetch on month change ── */
  useEffect(() => {
    dispatch(
      fetchMyAttendance({
        month: selectedMonth.month() + 1,
        year:  selectedMonth.year(),
      })
    );
  }, [dispatch, selectedMonth]);

  /* ── Teacher self-mark ── */
  const handleSelfMark = async () => {
    try {
      await dispatch(
        markBulkAttendance({
          schoolId: user?.school?._id || user?.schoolId,
          date: new Date().toISOString(),
          role: "teacher",
          records: [
            { userId: user._id, status: todayStatus, remarks: "Self marked" },
          ],
        })
      ).unwrap();
      message.success("Today's attendance marked");
      dispatch(
        fetchMyAttendance({
          month: selectedMonth.month() + 1,
          year:  selectedMonth.year(),
        })
      );
    } catch (err) {
      message.error(
        typeof err === "string" ? err : "Failed to mark attendance"
      );
    }
  };

  /* ── Compute summary ── */
  const summary = useMemo(() => {
    const s = {
      totalDays: myAttendance.length,
      present: 0,
      absent: 0,
      late: 0,
      halfday: 0,
      leave: 0,
    };
    myAttendance.forEach((item) => {
      if (s[item.status] !== undefined) s[item.status]++;
    });
    return {
      ...s,
      percent: s.totalDays
        ? ((s.present / s.totalDays) * 100).toFixed(1)
        : "0",
    };
  }, [myAttendance]);

  /* ── Stat cards config ── */
  const STAT_CARDS = [
    {
      label: "Total Days",
      value: summary.totalDays,
      color: "var(--primary)",
      icon: <CalendarOutlined />,
    },
    {
      label: "Present",
      value: summary.present,
      color: "var(--success)",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Absent",
      value: summary.absent,
      color: "var(--danger)",
      icon: <CloseCircleOutlined />,
    },
    {
      label: "Late",
      value: summary.late,
      color: "var(--warning)",
      icon: <ClockCircleOutlined />,
    },
    {
      label: "Leave",
      value: summary.leave,
      color: "var(--cyan)",
      icon: <CalendarOutlined />,
    },
  ];

  /* ── Weekly breakdown for BarChart ── */
  const weeklyData = useMemo(() => {
    const weeks = {};
    myAttendance.forEach((item) => {
      const week = `W${dayjs(item.date).week()}`;
      if (!weeks[week]) weeks[week] = { week, present: 0, absent: 0, late: 0, leave: 0 };
      if (weeks[week][item.status] !== undefined) weeks[week][item.status]++;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
  }, [myAttendance]);

  /* ── Table columns ── */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (v) => (
        <div>
          <div
            style={{ fontWeight: 600, color: "var(--text-primary)" }}
          >
            {dayjs(v).format("DD MMM YYYY")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {dayjs(v).format("dddd")}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (r) =>
        r ? (
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {r}
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            —
          </span>
        ),
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="My Attendance"
        subtitle={`${user?.role?.name || "Student"} • ${selectedMonth.format(
          "MMMM YYYY"
        )}`}
        icon={<CalendarOutlined />}
        extra={
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(v) => setSelectedMonth(v || dayjs())}
            allowClear={false}
          />
        }
      />

      {/* ── Error alert ── */}
      {error && (
        <Alert
          type="error"
          message="Failed to load attendance data"
          description={typeof error === "string" ? error : "Please try again or contact support."}
          showIcon
          style={{ marginTop: 16, borderRadius: 12 }}
          closable
        />
      )}

      {/* ── Teacher self-mark panel ── */}
      {isTeacher && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "16px 20px",
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                fontSize: 15,
              }}
            >
              Mark Today&apos;s Attendance
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {dayjs().format("dddd, DD MMMM YYYY")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Select
              value={todayStatus}
              onChange={setTodayStatus}
              style={{ width: 140 }}
              options={[
                { value: "present", label: "Present"  },
                { value: "late",    label: "Late"     },
                { value: "halfday", label: "Half Day" },
                { value: "leave",   label: "Leave"    },
                { value: "absent",  label: "Absent"   },
              ]}
            />
            <Button
              type="primary"
              icon={<EditOutlined />}
              loading={loading}
              onClick={handleSelfMark}
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ ...statGrid(140), marginTop: 20 }}>
        {STAT_CARDS.map(({ label, value, color, icon }) => (
          <div
            key={label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={iconWell(color, 42)}>{icon}</div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}
              >
                {value}
              </div>
            </div>
          </div>
        ))}

        {/* Attendance percentage card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={iconWell("var(--primary)", 42)}>
              <PercentageOutlined />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Attendance %
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--primary)",
                  lineHeight: 1.1,
                }}
              >
                {summary.percent}%
              </div>
            </div>
          </div>
          <Progress
            percent={Number(summary.percent)}
            strokeColor="var(--primary)"
            trailColor="var(--border-muted)"
            size="small"
            showInfo={false}
          />
        </div>
      </div>

      {/* ── Weekly BarChart ── */}
      {weeklyData.length > 0 && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border-muted)",
          borderRadius: 14,
          padding: "16px 20px",
          marginTop: 8,
        }}>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14, marginBottom: 14 }}>
            Weekly Attendance Breakdown
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)", border: "1px solid var(--border-muted)",
                  borderRadius: 10, fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name="Present" fill="var(--success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent"  name="Absent"  fill="var(--danger)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late"    name="Late"    fill="var(--warning)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leave"   name="Leave"   fill="var(--cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── History Table ── */}
      <Spin spinning={loading}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          {/* Table header bar */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                fontSize: 14,
              }}
            >
              Attendance History
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 10px",
                background: "var(--primary-light)",
                color: "var(--primary)",
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {summary.totalDays} records
            </span>
          </div>

          <Table
            className={TABLE_CLS}
            rowKey="_id"
            dataSource={myAttendance}
            columns={columns}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 400 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No attendance records for {selectedMonth.format("MMMM YYYY")}
                    </span>
                  }
                />
              ),
            }}
          />
        </div>
      </Spin>
    </div>
  );
};

export default MyAttendancePage;
