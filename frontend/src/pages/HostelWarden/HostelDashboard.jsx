import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Col, Empty, Progress, Row, Spin, Table, Tag } from "antd";
import {
  AlertOutlined, CheckCircleOutlined, ClockCircleOutlined,
  HomeOutlined, ReloadOutlined, TeamOutlined, UserOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { fetchHostelDashboard } from "../../features/hostelWardenSlice";
import PageHeader from "../../components/layout/PageHeader";
import { iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss } from "../../styles/pageStyles";

const COMPLAINT_COLORS = ["#dc2626", "#f97316", "#0891b2", "#7c3aed", "#059669"];

const KpiCard = ({ icon, label, value, color, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{ ...sectionPanel, marginBottom: 0, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: onClick ? "pointer" : "default", transition: "transform 0.15s" }}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
  >
    <div style={iconWell(color, 44)}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const ActionTile = ({ icon, label, path, color, navigate }) => (
  <div
    onClick={() => navigate(path)}
    style={{ ...sectionPanel, marginBottom: 0, padding: "14px 12px", textAlign: "center", cursor: "pointer", transition: "transform 0.15s" }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
  >
    <div style={{ ...iconWell(color, 36), margin: "0 auto 8px" }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
  </div>
);

const HostelDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard, dashboardLoading } = useSelector((s) => s.hostelWarden || {});

  useEffect(() => { dispatch(fetchHostelDashboard()); }, [dispatch]);

  const kpis    = dashboard?.kpis    || {};
  const leaves  = dashboard?.leaveMonthly || [];
  const compls  = dashboard?.complaintByType || [];

  if (dashboardLoading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <Spin size="large" tip="Loading hostel data…" />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("hw-dash-tbl")}</style>
      <PageHeader
        title="Hostel Dashboard"
        subtitle="Live overview — occupancy, leaves, visitors and complaints"
        icon={<HomeOutlined />}
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 13 }} onClick={() => dispatch(fetchHostelDashboard())}>
            <ReloadOutlined /> Refresh
          </div>
        }
      />

      {/* ── KPI Grid ─────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        <KpiCard icon={<HomeOutlined />}         label="Total Rooms"       value={kpis.totalRooms}          color="#7c3aed" onClick={() => navigate("hostelwarden/rooms")} />
        <KpiCard icon={<TeamOutlined />}          label="Total Capacity"    value={kpis.totalCapacity}        color="#0891b2" />
        <KpiCard icon={<CheckCircleOutlined />}   label="Occupied Beds"     value={kpis.totalOccupied}        color="#059669" />
        <KpiCard icon={<ClockCircleOutlined />}   label="Vacant Beds"       value={kpis.vacantBeds}           color="#64748b" />
        <KpiCard icon={<UserOutlined />}          label="Students"          value={kpis.totalStudents}         color="#8b5cf6" onClick={() => navigate("hostelwarden/allocations")} />
        <KpiCard icon={<ClockCircleOutlined />}   label="Pending Leaves"    value={kpis.pendingLeaves}         color="#d97706" sub="Awaiting approval" onClick={() => navigate("hostelwarden/leaves")} />
        <KpiCard icon={<AlertOutlined />}         label="On Leave Today"    value={kpis.leavesToday}           color="#f97316" />
        <KpiCard icon={<UserOutlined />}          label="Visitors Today"    value={kpis.visitorsToday}         color="#0891b2" onClick={() => navigate("hostelwarden/visitors")} />
        <KpiCard icon={<WarningOutlined />}       label="Open Complaints"   value={kpis.openComplaints}        color="#dc2626" onClick={() => navigate("hostelwarden/complaints")} sub={kpis.urgentComplaints > 0 ? `${kpis.urgentComplaints} urgent` : undefined} />
        <KpiCard icon={<CheckCircleOutlined />}   label="New Admissions"    value={kpis.newAdmissionsThisMonth} color="#059669" sub="This month" />
      </div>

      {/* ── Occupancy Progress ───────────────────────────────── */}
      <div style={{ ...sectionPanel, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Overall Occupancy Rate</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {kpis.totalOccupied || 0} / {kpis.totalCapacity || 0} beds occupied
          </span>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{kpis.occupancyRate || 0}%</span>
        </div>
        <Progress
          percent={kpis.occupancyRate || 0}
          strokeColor={kpis.occupancyRate > 90 ? "#dc2626" : kpis.occupancyRate > 70 ? "#f97316" : "#059669"}
          showInfo={false}
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Quick Actions</div>
        <div style={statGrid(120)}>
          <ActionTile icon={<ClockCircleOutlined />} label="Leave Requests" path="hostelwarden/leaves"       color="#d97706" navigate={navigate} />
          <ActionTile icon={<UserOutlined />}         label="Log Visitor"   path="hostelwarden/visitors"     color="#0891b2" navigate={navigate} />
          <ActionTile icon={<WarningOutlined />}      label="Complaints"    path="hostelwarden/complaints"   color="#dc2626" navigate={navigate} />
          <ActionTile icon={<CheckCircleOutlined />}  label="Attendance"    path="hostelwarden/hostel-attendance"  color="#059669" navigate={navigate} />
          <ActionTile icon={<HomeOutlined />}         label="Rooms"         path="hostelwarden/rooms"        color="#7c3aed" navigate={navigate} />
          <ActionTile icon={<TeamOutlined />}         label="Allocations"   path="hostelwarden/allocations"  color="#8b5cf6" navigate={navigate} />
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={14}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Monthly Leave Trend</div>
            {leaves.length === 0 ? (
              <Empty description="No leave data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaves} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[5, 5, 0, 0]} name="Leaves" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Complaints by Type</div>
            {compls.length === 0 ? (
              <Empty description="No complaints" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={compls.map((c) => ({ name: c._id, value: c.count }))} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {compls.map((_, i) => <Cell key={i} fill={COMPLAINT_COLORS[i % COMPLAINT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Status Summary ───────────────────────────────────── */}
      <Row gutter={[12, 12]}>
        {[
          { label: "Occupancy",       value: `${kpis.occupancyRate || 0}%`,        color: "#7c3aed", bg: "#ede9fe" },
          { label: "Pending Leaves",  value: kpis.pendingLeaves || 0,             color: "#d97706", bg: "#fef3c7" },
          { label: "Open Complaints", value: kpis.openComplaints || 0,            color: "#dc2626", bg: "#fee2e2" },
          { label: "Visitors Today",  value: kpis.visitorsToday || 0,             color: "#0891b2", bg: "#dbeafe" },
        ].map(({ label, value, color, bg }) => (
          <Col xs={12} sm={6} key={label}>
            <div style={{ background: bg, borderRadius: 12, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>{label}</div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HostelDashboard;
