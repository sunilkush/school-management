import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
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
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

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
  sectionPanel,
} from "../../../styles/pageStyles";

const TABLE_CLS = "my-att-tbl";

const MyAttendancePage = () => {
  const dispatch = useDispatch();

  const { myAttendance = [], loading } = useSelector((s) => s.attendance);
  const { user }                       = useSelector((s) => s.auth);

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
      color: "#16a34a",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Absent",
      value: summary.absent,
      color: "#dc2626",
      icon: <CloseCircleOutlined />,
    },
    {
      label: "Late",
      value: summary.late,
      color: "#d97706",
      icon: <ClockCircleOutlined />,
    },
    {
      label: "Leave",
      value: summary.leave,
      color: "#0891b2",
      icon: <CalendarOutlined />,
    },
  ];

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
          />
        </div>
      </Spin>
    </div>
  );
};

export default MyAttendancePage;
