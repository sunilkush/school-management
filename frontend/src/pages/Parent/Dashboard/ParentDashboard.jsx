import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Empty, Progress, Skeleton } from "antd";
import {
  BookOutlined, CalendarOutlined, CarOutlined, CheckCircleFilled, CheckCircleOutlined, ClockCircleOutlined,
  CreditCardOutlined, ExclamationCircleOutlined, FileTextOutlined, LineChartOutlined, ReloadOutlined,
  RightOutlined, TeamOutlined, TrophyOutlined, UserOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { fmtDate, money } from "../../../components/fees/feeUi.jsx";
import { iconWell, pill, statCard, statLabel, statValue, statGrid } from "../../../styles/pageStyles";

const LOW_ATTENDANCE = 75;

const TODAY = {
  present: { label: "Present today", color: "var(--success-hover)", bg: "var(--success-light)" },
  late: { label: "Late today", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  halfday: { label: "Half day today", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  absent: { label: "Absent today", color: "var(--danger-hover)", bg: "var(--danger-light)" },
  leave: { label: "On leave today", color: "var(--primary)", bg: "var(--primary-light)" },
  holiday: { label: "Holiday today", color: "var(--text-secondary)", bg: "var(--surface-soft)" },
  none: { label: "Not marked yet today", color: "var(--text-secondary)", bg: "var(--surface-soft)" },
};

const attendanceColor = (pct) => (pct == null ? "var(--text-muted)" : pct >= LOW_ATTENDANCE ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)");

/** One figure inside a child's card. */
const Metric = ({ label, value, sub, color, children }) => (
  <div style={{ padding: 14, borderRadius: 14, background: "var(--surface-soft)", border: "1px solid var(--border-muted)", minWidth: 0 }}>
    <div className="u-meta">{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: color || "var(--text-primary)", lineHeight: 1.3 }}>{value}</div>
    {children}
    {sub && <div className="u-meta" style={{ marginTop: 2 }}>{sub}</div>}
  </div>
);

/**
 * Parent home: what needs doing today, then each child at a glance.
 *
 * For every child it reads this month's attendance, the homework list and the fee schedule. Fee
 * figures are shown as the server gives them; nothing about money is worked out here.
 */
const ParentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});
  const academicYearId = useSelector((s) => s.academicYear?.selectedAcademicYear?._id);

  const [byChild, setByChild] = useState({});
  const [fetching, setFetching] = useState(false);

  const loadData = useCallback(() => { dispatch(fetchMyChildren()); }, [dispatch]);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!children.length) return undefined;
    let cancelled = false;
    const now = dayjs();
    const todayKey = now.format("YYYY-MM-DD");

    const fetchChildData = async () => {
      setFetching(true);
      const entries = await Promise.all(children.map(async (child) => {
        const childId = child.userId;
        const [attRes, hwRes, feeRes] = await Promise.allSettled([
          apiClient.get("/attendance/my", { params: { childId, month: now.month() + 1, year: now.year() } }),
          apiClient.get(`/student-portal/child/${childId}/homework`),
          academicYearId && child._id
            ? apiClient.get("/fee-installments", { params: { studentId: child._id, academicYearId } })
            : Promise.reject(new Error("no year")),
        ]);

        const attendance = attRes.status === "fulfilled" ? (attRes.value.data?.data || []) : [];
        const homework = hwRes.status === "fulfilled" ? (hwRes.value.data?.data?.homework || []) : [];
        const fee = feeRes.status === "fulfilled" ? feeRes.value.data?.data : null;

        // Holidays are not school days; late still means the child came.
        const days = attendance.filter((a) => a.status !== "holiday");
        const present = days.filter((a) => a.status === "present" || a.status === "late").length;
        const absent = days.filter((a) => a.status === "absent").length;
        const today = attendance.find((a) => dayjs(a.date).format("YYYY-MM-DD") === todayKey)?.status || "none";

        return [childId, {
          attPct: days.length ? Math.round((present / days.length) * 100) : null,
          present, absent, days: days.length, today,
          pending: homework.filter((h) => !h.submission).length,
          fee: fee?.heads?.length ? {
            dueNow: fee.totals?.dueNowAmount || 0,
            overdue: fee.totals?.overdueAmount || 0,
            left: fee.totals?.dueAmount || 0,
            next: (fee.periods || []).find((p) => p.balance > 0 && !p.dueNow) || null,
          } : null,
        }];
      }));
      if (cancelled) return;
      setByChild(Object.fromEntries(entries));
      setFetching(false);
    };

    fetchChildData();
    return () => { cancelled = true; };
  }, [children, academicYearId]);

  const go = (page, child) => navigate(`/dashboard/parent/${page}${child ? `?childId=${child.userId}` : ""}`);

  /* What the parent should act on, most urgent first. */
  const todo = useMemo(() => {
    const items = [];
    children.forEach((child) => {
      const d = byChild[child.userId];
      if (!d) return;
      if (d.fee?.overdue > 0) items.push({ key: `od-${child.userId}`, rank: 0, color: "var(--danger)", icon: <ExclamationCircleOutlined />, text: `${money(d.fee.dueNow)} fee to pay for ${child.name}`, sub: `${money(d.fee.overdue)} of it is overdue`, action: "Pay now", primary: true, onClick: () => go("fees", child) });
      else if (d.fee?.dueNow > 0) items.push({ key: `fee-${child.userId}`, rank: 1, color: "var(--warning)", icon: <RupeeIcon />, text: `${money(d.fee.dueNow)} fee to pay for ${child.name}`, sub: "Due now", action: "Pay now", primary: true, onClick: () => go("fees", child) });
      if (d.today === "absent") items.push({ key: `abs-${child.userId}`, rank: 2, color: "var(--danger)", icon: <CalendarOutlined />, text: `${child.name} is marked absent today`, sub: "Apply for leave if this was planned", action: "Apply leave", onClick: () => go("leave", child) });
      if (d.attPct != null && d.attPct < LOW_ATTENDANCE) items.push({ key: `att-${child.userId}`, rank: 3, color: "var(--warning)", icon: <CheckCircleOutlined />, text: `${child.name}'s attendance is ${d.attPct}% this month`, sub: `Below ${LOW_ATTENDANCE}% · ${d.absent} day${d.absent === 1 ? "" : "s"} absent`, action: "See attendance", onClick: () => go("attendance", child) });
      if (d.pending > 0) items.push({ key: `hw-${child.userId}`, rank: 4, color: "var(--primary)", icon: <BookOutlined />, text: `${child.name} has ${d.pending} homework to hand in`, action: "See homework", onClick: () => go("homework", child) });
    });
    return items.sort((a, b) => a.rank - b.rank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, byChild]);

  const totals = useMemo(() => {
    const vals = children.map((c) => byChild[c.userId]).filter(Boolean);
    const att = vals.map((v) => v.attPct).filter((v) => v != null);
    return {
      avgAtt: att.length ? Math.round(att.reduce((a, b) => a + b, 0) / att.length) : null,
      pending: vals.reduce((a, v) => a + (v.pending || 0), 0),
      // Each child's figure comes from the server; this only puts siblings on one card.
      dueNow: vals.reduce((a, v) => a + (v.fee?.dueNow || 0), 0),
      hasFees: vals.some((v) => v.fee),
    };
  }, [children, byChild]);

  const isLoading = childLoading || fetching;
  const ready = children.length > 0 && children.every((c) => byChild[c.userId]);

  if (isLoading && !children.length) {
    return <div className="page-wrapper"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  }

  const stats = [
    { label: children.length === 1 ? "Child" : "Children", value: children.length, color: "var(--primary)", icon: <TeamOutlined /> },
    { label: "Attendance this month", value: totals.avgAtt != null ? `${totals.avgAtt}%` : "—", color: attendanceColor(totals.avgAtt), icon: <CheckCircleOutlined /> },
    { label: "Homework to hand in", value: totals.pending, color: totals.pending > 0 ? "var(--warning)" : "var(--success)", icon: <BookOutlined /> },
    { label: "Fee to pay now", value: totals.hasFees ? money(totals.dueNow) : "—", color: totals.dueNow > 0 ? "var(--danger)" : "var(--success)", icon: <RupeeIcon /> },
  ];

  const links = [
    { label: "Timetable", icon: <ClockCircleOutlined />, page: "timetable" },
    { label: "Exams", icon: <TrophyOutlined />, page: "exams" },
    { label: "Report Cards", icon: <FileTextOutlined />, page: "report-cards" },
    { label: "Progress Report", icon: <LineChartOutlined />, page: "progress" },
    { label: "Circulars", icon: <FileTextOutlined />, page: "circulars" },
    { label: "PTM Booking", icon: <TeamOutlined />, page: "ptm" },
    { label: "Where is the Bus", icon: <CarOutlined />, page: "transport/live" },
    { label: "Apply Leave", icon: <CalendarOutlined />, page: "leave" },
    { label: "Calendar", icon: <CalendarOutlined />, page: "calendar" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || "Parent"}`}
        subtitle={`${dayjs().format("dddd, D MMMM YYYY")} · what needs your attention, and each child at a glance`}
        icon={<UserOutlined />}
        extra={<Button icon={<ReloadOutlined />} loading={isLoading} onClick={loadData}>Refresh</Button>}
      />
      <div className="page-wrapper">

        {/* 1 ── What needs doing */}
        {children.length > 0 && (
          <div className="section-panel">
            <div className="u-title" style={{ marginBottom: 14 }}>Needs your attention</div>
            {!ready ? (
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            ) : todo.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, background: "var(--success-light)" }}>
                <CheckCircleFilled style={{ color: "var(--success)", fontSize: 24 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>All good today</div>
                  <div className="u-meta">No fee due, no homework waiting and attendance is fine.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {todo.map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--border-muted)", borderLeft: `4px solid ${item.color}`, flexWrap: "wrap" }}>
                    <div style={iconWell(item.color, 38)}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.text}</div>
                      {item.sub && <div className="u-meta">{item.sub}</div>}
                    </div>
                    <Button type={item.primary ? "primary" : "default"} size="large" onClick={item.onClick}>
                      {item.action} <RightOutlined />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2 ── Totals */}
        <div className="stat-grid" style={statGrid(190)}>
          {stats.map((s) => (
            <div key={s.label} style={statCard({ color: s.color })}>
              <div>
                <div style={statLabel()}>{s.label}</div>
                <div style={statValue()}>{ready || s.label.startsWith("Child") ? s.value : "…"}</div>
              </div>
              <div style={iconWell(s.color, 42)}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* 3 ── Each child */}
        {children.length === 0 ? (
          <div className="section-panel">
            <Empty description="No child is linked to your account yet. Please contact the school office." />
          </div>
        ) : (
          children.map((child) => {
            const d = byChild[child.userId];
            const today = TODAY[d?.today] || TODAY.none;
            return (
              <div key={child.userId} className="section-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700,
                    }}>
                      {(child.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{child.name}</div>
                      <div className="u-meta">
                        {[child.className && `${child.className}${child.sectionName ? ` - ${child.sectionName}` : ""}`, child.registrationNumber].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                  {d && <span style={{ ...pill(today.color, today.bg), fontSize: 13, padding: "5px 12px" }}>{today.label}</span>}
                </div>

                {!d ? (
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <Metric
                      label="Attendance this month"
                      value={d.attPct != null ? `${d.attPct}%` : "—"}
                      color={attendanceColor(d.attPct)}
                      sub={d.days ? `${d.present} present · ${d.absent} absent of ${d.days} days` : "Nothing marked yet this month"}
                    >
                      {d.attPct != null && <Progress percent={d.attPct} showInfo={false} strokeColor={attendanceColor(d.attPct)} size="small" style={{ margin: "2px 0 0" }} />}
                    </Metric>
                    <Metric
                      label="Homework"
                      value={d.pending > 0 ? `${d.pending} to hand in` : "All done"}
                      color={d.pending > 0 ? "var(--warning-hover)" : "var(--success)"}
                      sub={d.pending > 0 ? "Not submitted yet" : "Nothing waiting"}
                    />
                    <Metric
                      label="Fees"
                      value={!d.fee ? "—" : d.fee.dueNow > 0 ? money(d.fee.dueNow) : d.fee.left > 0 ? "Nothing due" : "Fully paid"}
                      color={!d.fee ? undefined : d.fee.dueNow > 0 ? "var(--danger)" : "var(--success)"}
                      sub={!d.fee ? "No fee assigned for this year"
                        : d.fee.dueNow > 0 ? (d.fee.overdue > 0 ? `To pay now · ${money(d.fee.overdue)} overdue` : "To pay now")
                          : d.fee.next ? `Next: ${money(d.fee.next.balance)} by ${fmtDate(d.fee.next.dueDate)}` : "This year's fee is paid"}
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  {d?.fee?.dueNow > 0 && (
                    <Button type="primary" size="large" icon={<CreditCardOutlined />} onClick={() => go("fees", child)}>Pay {money(d.fee.dueNow)}</Button>
                  )}
                  <Button size="large" onClick={() => go("attendance", child)}>Attendance</Button>
                  <Button size="large" onClick={() => go("homework", child)}>Homework</Button>
                  <Button size="large" onClick={() => go("grades", child)}>Grades</Button>
                  {!(d?.fee?.dueNow > 0) && <Button size="large" onClick={() => go("fees", child)}>Fees</Button>}
                  <Button size="large" onClick={() => go("timetable", child)}>Timetable</Button>
                </div>
              </div>
            );
          })
        )}

        {/* 4 ── Everything else */}
        <div className="section-panel">
          <div className="u-title" style={{ marginBottom: 14 }}>More</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
            {links.map((l) => (
              <button
                key={l.page}
                type="button"
                onClick={() => go(l.page)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: "var(--surface)", border: "1px solid var(--border-muted)", color: "var(--text-primary)", fontWeight: 600, fontSize: 14,
                }}
              >
                <span style={iconWell("var(--primary)", 34)}>{l.icon}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentDashboard;
