import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Skeleton } from "antd";
import {
  AimOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LoginOutlined, LogoutOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../api/httpClient";
import { iconWell, pill, sectionPanel } from "../../styles/pageStyles";

/**
 * "My Attendance" on a school employee's dashboard: today's check-in, this month so far, and the
 * way to the My Attendance page.
 *
 * Check-in does not happen here. It needs a live GPS reading judged against the school's zone on a
 * map, and that lives on the My Attendance page (`<role>/attendance/self`); this section only says
 * where you stand and takes you there.
 *
 * It fetches for itself instead of going through the attendance slice: several dashboards already
 * keep other attendance lists and a shared loading flag in that slice, and this must not overwrite
 * them or make their spinners flicker.
 */

const STATUS = {
  present: { label: "Present", color: "var(--success)" },
  late:    { label: "Late", color: "var(--warning)" },
  halfday: { label: "Half day", color: "var(--purple, #7C3AED)" },
  absent:  { label: "Absent", color: "var(--danger)" },
  leave:   { label: "Leave", color: "var(--info, #0EA5E9)" },
};

const duration = (from, to) => {
  const minutes = Math.max(0, dayjs(to).diff(dayjs(from), "minute"));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const Stat = ({ label, value, color }) => (
  <div style={{ minWidth: 72 }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || "var(--text-primary)", lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
  </div>
);

const MyAttendanceSection = ({ basePath: basePathProp, style }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Dashboards live at /dashboard/<role path>; several roles share one dashboard component, so the
  // role path is read from where we are rather than hard-coded by each caller.
  const basePath = basePathProp || pathname.split("/")[2];
  const selfPage = `/dashboard/${basePath}/attendance/self`;

  const [state, setState] = useState({ loading: true, error: null, record: null, month: [] });
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [status, history] = await Promise.all([
        apiClient.get("/attendance/self/status"),
        apiClient.get("/attendance/self/history", { params: { month: dayjs().format("YYYY-MM") } }),
      ]);
      setState({
        loading: false,
        error: null,
        record: status.data?.data?.record || null,
        month: Array.isArray(history.data?.data) ? history.data.data : [],
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.response?.data?.message || "Could not load your attendance" }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keeps "working for 2h 14m" honest while the dashboard stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { loading, error, record, month } = state;

  const counts = month.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  // Only days that were actually marked are on record, so this is "of the days marked", never a
  // percentage of working days — a missing day is unknown, not absent.
  const markedDays = month.filter((r) => r.status !== "leave").length;
  const attendedDays = (counts.present || 0) + (counts.late || 0) + (counts.halfday || 0);

  const checkedIn = Boolean(record?.checkInAt);
  const checkedOut = Boolean(record?.checkOutAt);
  const markedWithoutCheckIn = Boolean(record && !checkedIn && record.status);

  let headline;
  let detail;
  let tone;
  let action;
  if (checkedOut) {
    headline = "Done for today";
    detail = `${dayjs(record.checkInAt).format("hh:mm A")} – ${dayjs(record.checkOutAt).format("hh:mm A")} · ${duration(record.checkInAt, record.checkOutAt)}`;
    tone = "var(--success)";
    action = { label: "View", icon: <CalendarOutlined />, primary: false };
  } else if (checkedIn) {
    headline = `Checked in at ${dayjs(record.checkInAt).format("hh:mm A")}`;
    detail = `Working for ${duration(record.checkInAt, now)} · remember to check out`;
    tone = "var(--primary)";
    action = { label: "Check out", icon: <LogoutOutlined />, primary: true };
  } else if (markedWithoutCheckIn) {
    // Marked by the school (leave, absent, a bulk mark) rather than by a check-in.
    headline = `Marked ${STATUS[record.status]?.label.toLowerCase() || record.status} today`;
    detail = "Recorded by the school office";
    tone = STATUS[record.status]?.color || "var(--text-secondary)";
    action = { label: "View", icon: <CalendarOutlined />, primary: false };
  } else {
    headline = "Not checked in yet";
    detail = "Check in from school with your location on";
    tone = "var(--warning)";
    action = { label: "Check in", icon: <LoginOutlined />, primary: true };
  }

  return (
    <div style={{ ...sectionPanel, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconWell("var(--primary)", 36)}><ClockCircleOutlined /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>My Attendance</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayjs().format("dddd, D MMMM")}</div>
          </div>
        </div>
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={load} loading={loading} aria-label="Refresh attendance" />
      </div>

      {loading && !record && !month.length ? (
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      ) : error ? (
        <div style={{ fontSize: 13, color: "var(--danger)" }}>
          {error} — <Button type="link" size="small" style={{ padding: 0 }} onClick={load}>try again</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
          {/* Today */}
          <div style={{
            flex: "1 1 260px", borderRadius: 14, padding: "14px 16px",
            background: `color-mix(in srgb, ${tone} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${tone} 25%, transparent)`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: tone, marginTop: 4 }}>{headline}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{detail}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, alignItems: "center" }}>
              {record?.status && STATUS[record.status] && (
                <span style={pill(STATUS[record.status].color)}>{STATUS[record.status].label}</span>
              )}
              {checkedIn && (
                record.gpsVerified ? (
                  <span style={pill("var(--success)")}>
                    <AimOutlined /> GPS verified{record.distanceFromSchool != null ? ` · ${record.distanceFromSchool}m` : ""}
                  </span>
                ) : (
                  <span style={pill("var(--text-secondary)")}>Location not verified</span>
                )
              )}
            </div>
            <Button
              type={action.primary ? "primary" : "default"}
              icon={action.icon}
              onClick={() => navigate(selfPage)}
              style={{ marginTop: 12, borderRadius: 10 }}
            >
              {action.label}
            </Button>
          </div>

          {/* This month */}
          <div style={{ flex: "1 1 260px", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--border-muted)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {dayjs().format("MMMM")} so far
              </div>
              {markedDays > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <CheckCircleOutlined style={{ color: "var(--success)" }} /> {attendedDays} of {markedDays} marked days
                </div>
              )}
            </div>
            {month.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 18px", marginTop: 12 }}>
                <Stat label="Present" value={counts.present || 0} color={STATUS.present.color} />
                <Stat label="Late" value={counts.late || 0} color={STATUS.late.color} />
                <Stat label="Half day" value={counts.halfday || 0} color={STATUS.halfday.color} />
                <Stat label="Absent" value={counts.absent || 0} color={STATUS.absent.color} />
                <Stat label="Leave" value={counts.leave || 0} color={STATUS.leave.color} />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                Nothing recorded this month yet.
              </div>
            )}
            <Button type="link" style={{ padding: 0, marginTop: 10 }} onClick={() => navigate(selfPage)}>
              Open My Attendance →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendanceSection;
