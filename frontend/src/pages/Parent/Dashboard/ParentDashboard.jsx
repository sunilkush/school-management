import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Col, Empty, Row, Skeleton, Space, Tag } from "antd";
import {
  BellOutlined, BookOutlined, CalendarOutlined, CheckCircleOutlined,
  DollarOutlined, ReloadOutlined, TrophyOutlined, UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid } from "../../../styles/pageStyles";

const STAT_COLORS = ["#7c3aed", "#0284c7", "#059669", "#dc2626"];

const ParentDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [childStats, setChildStats] = useState({});
  const [alerts, setAlerts]         = useState([]);
  const [fetching, setFetching]     = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!children.length) return;
    const now   = dayjs();
    const month = now.month() + 1;
    const year  = now.year();
    const newAlerts = [];
    const stats     = {};

    const fetchChildData = async () => {
      setFetching(true);
      await Promise.allSettled(
        children.map(async (child) => {
          const childId = child.userId;
          const [attRes, hwRes] = await Promise.allSettled([
            apiClient.get("/attendance/my", { params: { childId, month, year } }),
            apiClient.get(`/student-portal/child/${childId}/homework`),
          ]);

          const attendance   = attRes.status === "fulfilled" ? (attRes.value.data?.data || []) : [];
          const homeworkList = hwRes.status  === "fulfilled" ? (hwRes.value.data?.data?.homework || []) : [];

          const present = attendance.filter((a) => a.status === "present").length;
          const absent  = attendance.filter((a) => a.status === "absent").length;
          const attPct  = attendance.length ? Math.round((present / attendance.length) * 100) : null;
          const pending = homeworkList.filter((h) => !h.submission).length;

          stats[childId] = { attPct, pending, absent, total: attendance.length };

          if (attPct !== null && attPct < 75)
            newAlerts.push({ key: `att-${childId}`, type: "warning", text: `${child.name}'s attendance is ${attPct}% this month — below 75%` });
          if (absent >= 3)
            newAlerts.push({ key: `abs-${childId}`, type: "error", text: `${child.name} has ${absent} absences this month` });
          if (pending > 0)
            newAlerts.push({ key: `hw-${childId}`, type: "info", text: `${child.name} has ${pending} pending homework assignment${pending > 1 ? "s" : ""}` });
        })
      );
      setChildStats(stats);
      setAlerts(newAlerts);
      setFetching(false);
    };

    fetchChildData();
  }, [children]);

  const totals = useMemo(() => {
    const vals      = Object.values(childStats);
    const attValues = vals.map((v) => v.attPct).filter((v) => v !== null);
    return {
      children: children.length,
      avgAtt:   attValues.length ? Math.round(attValues.reduce((a, b) => a + b, 0) / attValues.length) : null,
      pending:  vals.reduce((a, v) => a + (v.pending || 0), 0),
      absent:   vals.reduce((a, v) => a + (v.absent  || 0), 0),
    };
  }, [childStats, children]);

  const statMeta = [
    { key: "children", label: "Children",         icon: <UserOutlined />,        value: totals.children },
    { key: "avgAtt",   label: "Avg Attendance",   icon: <CheckCircleOutlined />, value: totals.avgAtt !== null ? `${totals.avgAtt}%` : "—" },
    { key: "pending",  label: "Pending Homework",  icon: <BookOutlined />,        value: totals.pending },
    { key: "absent",   label: "Absences (Month)",  icon: <CalendarOutlined />,    value: totals.absent },
  ];

  const isLoading = childLoading || fetching;

  if (isLoading && !children.length) {
    return (
      <div style={pageWrapper}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || "Parent"}`}
        subtitle="Monitor your children's academic progress, attendance, fees, and more."
        icon={<UserOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={loadData}>
            Refresh
          </Button>
        }
      />
      <div style={pageWrapper}>
        {/* KPI stats */}
        <div className="stat-grid" style={statGrid(175)}>
          {statMeta.map(({ key, label, icon, value }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{isLoading ? "…" : value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={sectionPanel}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
              <BellOutlined style={{ marginRight: 8 }} />Alerts
            </div>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              {alerts.map((a) => (
                <Alert key={a.key} type={a.type} showIcon message={a.text} style={{ borderRadius: 8 }} />
              ))}
            </Space>
          </div>
        )}

        {/* Children cards */}
        <Row gutter={[16, 16]}>
          {children.length === 0 ? (
            <Col xs={24}>
              <div style={sectionPanel}>
                <Empty description="No children linked to your account. Contact the school admin." />
              </div>
            </Col>
          ) : (
            children.map((child) => {
              const cs = childStats[child.userId] || {};
              return (
                <Col xs={24} sm={12} xl={8} key={child.userId}>
                  <div style={{ ...sectionPanel, marginBottom: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "var(--primary)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(child.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                          {child.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {child.className}{child.sectionName ? ` — ${child.sectionName}` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {cs.attPct !== undefined && cs.attPct !== null && (
                        <Tag color={cs.attPct >= 75 ? "green" : cs.attPct >= 60 ? "orange" : "red"}>
                          Attendance: {cs.attPct}%
                        </Tag>
                      )}
                      {cs.pending !== undefined && (
                        <Tag color={cs.pending > 0 ? "orange" : "green"}>
                          {cs.pending > 0 ? `${cs.pending} Pending HW` : "All HW Done"}
                        </Tag>
                      )}
                    </div>

                    <Space wrap size={6}>
                      <Button size="small" onClick={() => navigate("/dashboard/parent/attendance")}>Attendance</Button>
                      <Button size="small" onClick={() => navigate("/dashboard/parent/homework")}>Homework</Button>
                      <Button size="small" onClick={() => navigate("/dashboard/parent/grades")}>Grades</Button>
                      <Button size="small" onClick={() => navigate("/dashboard/parent/fees")}>Fees</Button>
                    </Space>
                  </div>
                </Col>
              );
            })
          )}
        </Row>

        {/* Quick Links */}
        <div style={{ ...sectionPanel, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
            Quick Links
          </div>
          <Space wrap>
            <Button icon={<CalendarOutlined />} onClick={() => navigate("/dashboard/parent/timetable")}>Timetable</Button>
            <Button icon={<TrophyOutlined />}   onClick={() => navigate("/dashboard/parent/exams")}>Exams</Button>
            <Button icon={<DollarOutlined />}   onClick={() => navigate("/dashboard/parent/fees")}>Fees</Button>
            <Button icon={<CalendarOutlined />} onClick={() => navigate("/dashboard/parent/calendar")}>Calendar</Button>
            <Button icon={<BookOutlined />}     onClick={() => navigate("/dashboard/parent/leave")}>Apply Leave</Button>
            <Button icon={<CheckCircleOutlined />} onClick={() => navigate("/dashboard/parent/progress")}>Progress Report</Button>
          </Space>
        </div>
      </div>
    </>
  );
};

export default ParentDashboard;
