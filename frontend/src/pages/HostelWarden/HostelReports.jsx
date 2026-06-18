import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Col, DatePicker, Empty, Progress, Row, Select, Spin, Table } from "antd";
import { FileTextOutlined, PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchHostelDashboard, fetchHostelLeaves, fetchHostelVisitors,
  fetchHostelComplaints, fetchHostelAttendance,
} from "../../features/hostelWardenSlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, AreaChart, Area,
} from "recharts";
import { iconWell, pageWrapper, sectionPanel, statGrid } from "../../styles/pageStyles";
import { BarChartOutlined } from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;

const CHART_COLORS = ["#7c3aed", "#dc2626", "#059669", "#d97706", "#0891b2", "#f97316"];

const ReportCard = ({ title, children, extra }) => (
  <div style={{ ...sectionPanel, marginBottom: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
      {extra}
    </div>
    {children}
  </div>
);

const HostelReports = () => {
  const dispatch = useDispatch();
  const {
    dashboard, dashboardLoading,
    leaves, leavesLoading,
    visitors, visitorsLoading,
    complaints, complaintsLoading,
    attendanceRecords, attendanceLoading,
  } = useSelector((s) => s.hostelWarden || {});

  useEffect(() => {
    dispatch(fetchHostelDashboard());
    dispatch(fetchHostelLeaves({ limit: 200 }));
    dispatch(fetchHostelVisitors({ limit: 200 }));
    dispatch(fetchHostelComplaints({ limit: 200 }));
    dispatch(fetchHostelAttendance({ limit: 30 }));
  }, [dispatch]);

  const kpis          = dashboard?.kpis           || {};
  const leaveMonthly  = dashboard?.leaveMonthly   || [];
  const complByType   = dashboard?.complaintByType || [];

  const leaveByType = useMemo(() => {
    const counts = {};
    leaves.forEach((l) => { counts[l.leaveType] = (counts[l.leaveType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leaves]);

  const visitorByRelation = useMemo(() => {
    const counts = {};
    visitors.forEach((v) => { counts[v.relation] = (counts[v.relation] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [visitors]);

  const attendanceTrend = useMemo(() => {
    return attendanceRecords.slice(0, 14).reverse().map((r) => ({
      date: dayjs(r.date).format("DD MMM"),
      Present: r.totalPresent || 0,
      Absent:  r.totalAbsent  || 0,
      Leave:   r.totalOnLeave || 0,
    }));
  }, [attendanceRecords]);

  const exportSummary = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Rooms", kpis.totalRooms || 0],
      ["Total Capacity", kpis.totalCapacity || 0],
      ["Occupied Beds", kpis.totalOccupied || 0],
      ["Occupancy Rate", `${kpis.occupancyRate || 0}%`],
      ["Total Students", kpis.totalStudents || 0],
      ["Pending Leaves", kpis.pendingLeaves || 0],
      ["Visitors Today", kpis.visitorsToday || 0],
      ["Open Complaints", kpis.openComplaints || 0],
    ];
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hostel-summary-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const printReport = () => window.print();

  const loading = dashboardLoading || leavesLoading || visitorsLoading || complaintsLoading || attendanceLoading;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Hostel Reports"
        subtitle="Occupancy, leave, visitor, complaint, and attendance analytics"
        icon={<BarChartOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<PrinterOutlined />} onClick={printReport}>Print</Button>
            <Button icon={<FileTextOutlined />} onClick={exportSummary}>Export Summary</Button>
          </div>
        }
      />

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
      )}

      {/* ── Overview KPIs ─────────────────────────────────────── */}
      <div style={statGrid(140)}>
        {[
          { label: "Total Rooms",     value: kpis.totalRooms,     color: "#7c3aed" },
          { label: "Total Capacity",  value: kpis.totalCapacity,  color: "#0891b2" },
          { label: "Occupied Beds",   value: kpis.totalOccupied,  color: "#059669" },
          { label: "Occupancy Rate",  value: `${kpis.occupancyRate || 0}%`, color: "#d97706" },
          { label: "Students",        value: kpis.totalStudents,  color: "#8b5cf6" },
          { label: "Open Complaints", value: kpis.openComplaints, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...sectionPanel, marginBottom: 0, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell(color, 36)}><FileTextOutlined /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{value ?? "—"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Occupancy ──────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Occupancy Rate</div>
        <Progress
          percent={kpis.occupancyRate || 0}
          strokeColor={kpis.occupancyRate > 90 ? "#dc2626" : kpis.occupancyRate > 70 ? "#f97316" : "#059669"}
        />
        <div style={{ display: "flex", gap: 24, marginTop: 10, fontSize: 12 }}>
          <span style={{ color: "#059669" }}>Occupied: <strong>{kpis.totalOccupied}</strong></span>
          <span style={{ color: "#64748b" }}>Vacant: <strong>{(kpis.totalCapacity || 0) - (kpis.totalOccupied || 0)}</strong></span>
          <span style={{ color: "#0891b2" }}>Capacity: <strong>{kpis.totalCapacity}</strong></span>
        </div>
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <ReportCard title="Monthly Leave Trend (Last 6 Months)">
            {leaveMonthly.length === 0 ? (
              <Empty description="No leave data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaveMonthly} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Leaves" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ReportCard>
        </Col>
        <Col xs={24} lg={10}>
          <ReportCard title="Leaves by Type">
            {leaveByType.length === 0 ? (
              <Empty description="No leave data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={leaveByType} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}(${value})`} labelLine={false}>
                    {leaveByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ReportCard>
        </Col>
      </Row>

      {/* ── Charts Row 2 ─────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ReportCard title="Complaints by Type">
            {complByType.length === 0 ? (
              <Empty description="No complaints" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complByType} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ReportCard>
        </Col>
        <Col xs={24} lg={12}>
          <ReportCard title="Visitors by Relation">
            {visitorByRelation.length === 0 ? (
              <Empty description="No visitor data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={visitorByRelation} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}(${value})`} labelLine={false}>
                    {visitorByRelation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ReportCard>
        </Col>
      </Row>

      {/* ── Attendance Trend ─────────────────────────────────── */}
      <ReportCard title="Attendance Trend (Last 14 Days)">
        {attendanceTrend.length === 0 ? (
          <Empty description="No attendance data" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Present" fill="#d1fae5" stroke="#059669" strokeWidth={2} />
              <Area type="monotone" dataKey="Absent"  fill="#fee2e2" stroke="#dc2626" strokeWidth={2} />
              <Area type="monotone" dataKey="Leave"   fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ReportCard>
    </div>
  );
};

export default HostelReports;
