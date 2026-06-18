import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Badge, Button, Col, DatePicker, Empty, Progress, Radio, Row, Select, Spin, Table, Tag, message,
} from "antd";
import { CheckCircleOutlined, CheckOutlined, CloseOutlined, ExportOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchAttendanceSheet, markHostelAttendance, fetchHostelAttendance,
} from "../../features/hostelWardenSlice";
import PageHeader from "../../components/layout/PageHeader";
import { iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss } from "../../styles/pageStyles";

const { Option } = Select;

const STATUS_STYLE = {
  present: { color: "#059669", bg: "#d1fae5" },
  absent:  { color: "#dc2626", bg: "#fee2e2" },
  leave:   { color: "#d97706", bg: "#fef3c7" },
};

const HostelAttendance = () => {
  const dispatch = useDispatch();
  const { attendanceSheet, attendanceRecords, attendanceTotal, attendanceLoading, actionLoading } = useSelector((s) => s.hostelWarden || {});

  const [session, setSession] = useState("morning");
  const [date, setDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState("mark");
  const [historyPage, setHistoryPage] = useState(1);
  const [markedStatus, setMarkedStatus] = useState({});

  useEffect(() => {
    if (viewMode === "mark") {
      dispatch(fetchAttendanceSheet({ session, date: date.toISOString() }));
    } else {
      dispatch(fetchHostelAttendance({ page: historyPage, limit: 20, session }));
    }
  }, [dispatch, viewMode, session, date, historyPage]);

  const sheetStudents = useMemo(() => {
    if (!attendanceSheet) return [];
    return attendanceSheet.students || [];
  }, [attendanceSheet]);

  useEffect(() => {
    if (sheetStudents.length > 0) {
      const init = {};
      sheetStudents.forEach((s) => { init[s.studentId] = s.status || "present"; });
      setMarkedStatus(init);
    }
  }, [sheetStudents]);

  const setAll = (status) => {
    const all = {};
    sheetStudents.forEach((s) => { all[s.studentId] = status; });
    setMarkedStatus(all);
  };

  const handleSubmit = async () => {
    const records = sheetStudents.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      roomNumber: s.roomNumber,
      status: markedStatus[s.studentId] || "present",
    }));
    try {
      await dispatch(markHostelAttendance({ date: date.toISOString(), session, records })).unwrap();
      message.success("Attendance saved");
    } catch (e) { message.error(e || "Failed to save attendance"); }
  };

  const handleExport = () => {
    const headers = ["Student", "Room", "Status"];
    const rows = sheetStudents.map((s) => [s.studentName, s.roomNumber || "—", markedStatus[s.studentId] || "present"]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hostel-attendance-${date.format("YYYY-MM-DD")}-${session}.csv`;
    a.click();
  };

  const presentCount  = Object.values(markedStatus).filter((s) => s === "present").length;
  const absentCount   = Object.values(markedStatus).filter((s) => s === "absent").length;
  const leaveCount    = Object.values(markedStatus).filter((s) => s === "leave").length;
  const total         = sheetStudents.length;
  const attendancePct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const markColumns = [
    { title: "#", render: (_, __, i) => i + 1, width: 40 },
    {
      title: "Student",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.studentName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.admissionNo || "—"}</div>
        </div>
      ),
    },
    { title: "Room", dataIndex: "roomNumber", render: (v) => v || "—", width: 80 },
    {
      title: "Status", width: 220,
      render: (_, r) => (
        <Radio.Group
          value={markedStatus[r.studentId] || "present"}
          onChange={(e) => setMarkedStatus((prev) => ({ ...prev, [r.studentId]: e.target.value }))}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="present" style={{ color: markedStatus[r.studentId] === "present" ? "#fff" : "#059669", borderColor: "#059669", background: markedStatus[r.studentId] === "present" ? "#059669" : "transparent" }}>P</Radio.Button>
          <Radio.Button value="absent"  style={{ color: markedStatus[r.studentId] === "absent"  ? "#fff" : "#dc2626", borderColor: "#dc2626", background: markedStatus[r.studentId] === "absent"  ? "#dc2626" : "transparent" }}>A</Radio.Button>
          <Radio.Button value="leave"   style={{ color: markedStatus[r.studentId] === "leave"   ? "#fff" : "#d97706", borderColor: "#d97706", background: markedStatus[r.studentId] === "leave"   ? "#d97706" : "transparent" }}>L</Radio.Button>
        </Radio.Group>
      ),
    },
  ];

  const historyColumns = [
    { title: "Date",    dataIndex: "date",    render: (d) => dayjs(d).format("DD MMM YYYY") },
    { title: "Session", dataIndex: "session", render: (s) => <Tag>{s}</Tag> },
    { title: "Present", dataIndex: "totalPresent", render: (v) => <span style={{ color: "#059669", fontWeight: 700 }}>{v}</span> },
    { title: "Absent",  dataIndex: "totalAbsent",  render: (v) => <span style={{ color: "#dc2626", fontWeight: 700 }}>{v}</span> },
    { title: "Leave",   dataIndex: "totalOnLeave", render: (v) => <span style={{ color: "#d97706", fontWeight: 700 }}>{v}</span> },
    { title: "Rate",    render: (_, r) => {
      const t = (r.totalPresent || 0) + (r.totalAbsent || 0) + (r.totalOnLeave || 0);
      const pct = t > 0 ? Math.round((r.totalPresent / t) * 100) : 0;
      return <Progress percent={pct} size="small" strokeColor={pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626"} />;
    }, width: 140 },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("attendance-tbl")}</style>
      <PageHeader
        title="Hostel Attendance"
        subtitle="Mark daily attendance by session — morning, evening, night"
        icon={<CheckCircleOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleExport} icon={<ExportOutlined />}>Export</Button>
            {viewMode === "mark" && <Button type="primary" onClick={handleSubmit} loading={actionLoading} icon={<CheckOutlined />}>Save Attendance</Button>}
          </div>
        }
      />

      {/* ── Controls ──────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "12px 18px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
          <Radio.Button value="mark">Mark Attendance</Radio.Button>
          <Radio.Button value="history">View History</Radio.Button>
        </Radio.Group>
        <Select value={session} onChange={setSession} style={{ width: 120 }}>
          <Option value="morning">Morning</Option>
          <Option value="evening">Evening</Option>
          <Option value="night">Night</Option>
        </Select>
        {viewMode === "mark" && (
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
        )}
      </div>

      {viewMode === "mark" ? (
        <>
          {/* ── Stats ───────────────────────────────────────────── */}
          <div style={statGrid(130)}>
            {[
              { label: "Total",   value: total,        color: "#7c3aed" },
              { label: "Present", value: presentCount, color: "#059669" },
              { label: "Absent",  value: absentCount,  color: "#dc2626" },
              { label: "On Leave",value: leaveCount,   color: "#d97706" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                <div style={iconWell(color, 36)}><CheckCircleOutlined /></div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Progress bar ─────────────────────────────────────── */}
          {total > 0 && (
            <div style={{ ...sectionPanel, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Attendance Rate — {date.format("DD MMM YYYY")} ({session})</span>
                <span style={{ fontWeight: 700 }}>{attendancePct}%</span>
              </div>
              <Progress percent={attendancePct} strokeColor={attendancePct >= 80 ? "#059669" : attendancePct >= 60 ? "#d97706" : "#dc2626"} showInfo={false} />
            </div>
          )}

          {/* ── Bulk actions ─────────────────────────────────────── */}
          {sheetStudents.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Button size="small" icon={<CheckOutlined />} onClick={() => setAll("present")} style={{ color: "#059669", borderColor: "#059669" }}>Mark All Present</Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => setAll("absent")}  danger>Mark All Absent</Button>
            </div>
          )}

          <div style={sectionPanel}>
            {attendanceLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
            ) : sheetStudents.length === 0 ? (
              <Empty description="No students allocated in hostel" />
            ) : (
              <Table
                className="attendance-tbl"
                rowKey="studentId"
                columns={markColumns}
                dataSource={sheetStudents}
                pagination={false}
                size="small"
                scroll={{ x: 500 }}
              />
            )}
          </div>
        </>
      ) : (
        <div style={sectionPanel}>
          {attendanceLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table
              className="attendance-tbl"
              rowKey="_id"
              columns={historyColumns}
              dataSource={attendanceRecords}
              pagination={{ total: attendanceTotal, current: historyPage, pageSize: 20, onChange: setHistoryPage, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="No attendance records" /> }}
              size="small"
              scroll={{ x: 600 }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HostelAttendance;
