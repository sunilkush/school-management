import React, { useEffect, useMemo, useState } from "react";
import {
  Badge, Calendar, Col, Popover, Row, Spin, Tooltip,
} from "antd";
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, MinusCircleOutlined, QuestionCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper } from "../../styles/pageStyles";

dayjs.extend(isSameOrBefore);

/* ── theme ── */
const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  accent:  "var(--accent)", accentLight:  "var(--accent-light)",
  success: "var(--success)", successLight: "var(--success-light)",
  warning: "var(--warning)", warningLight: "var(--warning-light)",
  danger:  "var(--danger)", dangerLight:  "var(--danger-light)",
  purple:  "var(--purple)", purpleLight:  "rgba(var(--purple-rgb), 0.12)",
  cyan:    "var(--cyan)", cyanLight:    "var(--cyan-light)",
  border:  "var(--border)", text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--surface)", surfaceSoft: "var(--surface-soft)",
};

const STATUS = {
  present: { color: C.success, bg: C.successLight, border: "var(--success-light)", label: "Present",  icon: <CheckCircleOutlined />, antBadge: "success"  },
  absent:  { color: C.danger,  bg: C.dangerLight,  border: "var(--danger-light)", label: "Absent",   icon: <CloseCircleOutlined />, antBadge: "error"    },
  late:    { color: C.warning, bg: C.warningLight,  border: "var(--warning)", label: "Late",     icon: <ClockCircleOutlined />, antBadge: "warning"  },
  halfday: { color: C.purple,  bg: C.purpleLight,  border: "rgba(var(--purple-rgb), 0.5)", label: "Half Day", icon: <MinusCircleOutlined />, antBadge: "processing"},
  leave:   { color: C.cyan,    bg: C.cyanLight,    border: "rgba(var(--cyan-rgb), 0.4)", label: "On Leave", icon: <QuestionCircleOutlined/>,antBadge: "default"  },
};

const PANEL = {
  background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
  padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

/* ── stat card ── */
const StatCard = ({ label, value, color, bg, icon, pct }) => (
  <div style={{
    background: bg, borderRadius: 12, padding: "14px 16px",
    border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: `color-mix(in srgb, ${color} 13%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>
        {value}
        {pct !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginLeft: 4 }}>{pct}%</span>
        )}
      </div>
    </div>
  </div>
);

/* ── day cell popup detail ── */
const DayDetail = ({ record, date }) => {
  const cfg = STATUS[record.status] || {};
  return (
    <div style={{ minWidth: 180 }}>
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: 13 }}>
        {dayjs(date).format("dddd, DD MMM YYYY")}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 10px", borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 700, fontSize: 12, marginBottom: 8,
      }}>
        {cfg.icon} {cfg.label}
      </div>
      {(record.checkInAt || record.checkOutAt) && (
        <div style={{ fontSize: 12, color: C.textSub }}>
          {record.checkInAt && <div>In:  {dayjs(record.checkInAt).format("hh:mm A")}</div>}
          {record.checkOutAt && <div>Out: {dayjs(record.checkOutAt).format("hh:mm A")}</div>}
        </div>
      )}
      {record.remarks && (
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>
          "{record.remarks}"
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════ */
const MyAttendanceMonthlyReport = () => {
  const dispatch = useDispatch();
  const { myAttendance = [], reportLoading, loading } = useSelector((s) => s.attendance);

  const [calValue, setCalValue] = useState(dayjs());

  /* fetch when month changes */
  useEffect(() => {
    dispatch(fetchMyAttendance({
      month: calValue.month() + 1,
      year:  calValue.year(),
    }));
  }, [calValue, dispatch]);

  /* map date → record */
  const byDate = useMemo(() => {
    const m = {};
    myAttendance.forEach((r) => {
      m[dayjs(r.date).format("YYYY-MM-DD")] = r;
    });
    return m;
  }, [myAttendance]);

  /* summary counts */
  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, halfday: 0, leave: 0 };
    myAttendance.forEach((r) => { if (s[r.status] !== undefined) s[r.status]++; });
    const total = myAttendance.length;
    const pct = total ? Math.round(((s.present + s.halfday * 0.5 + s.late) / total) * 100) : 0;
    return { ...s, total, pct };
  }, [myAttendance]);

  /* ── calendar cell renderer ── */
  const cellRender = (date, info) => {
    if (info.type !== "date") return info.originNode;

    const key = date.format("YYYY-MM-DD");
    const record = byDate[key];
    const isToday = date.isSame(dayjs(), "day");
    const isFuture = date.isAfter(dayjs(), "day");
    const isCurrentMonth = date.isSame(calValue, "month");

    if (!isCurrentMonth) return null;
    if (isFuture) return null;

    if (!record) {
      /* working day but not marked — show subtle dash */
      const dow = date.day();
      const isWeekend = dow === 0 || dow === 6;
      if (isWeekend) return null;
      return (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.border }} />
        </div>
      );
    }

    const cfg = STATUS[record.status] || {};

    return (
      <Popover
        content={<DayDetail record={record} date={date} />}
        trigger="click"
        placement="top"
      >
        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, marginTop: 2, cursor: "pointer",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "1px 7px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border || C.border}`,
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
            boxShadow: isToday ? `0 0 0 2px color-mix(in srgb, ${C.primary} 19%, transparent)` : "none",
          }}>
            {cfg.icon} {cfg.label}
          </div>
          {(record.checkInAt || record.checkOutAt) && (
            <div style={{ fontSize: 9, color: C.textSub, lineHeight: 1.4, textAlign: "center" }}>
              {record.checkInAt && <div>In&nbsp;{dayjs(record.checkInAt).format("hh:mm A")}</div>}
              {record.checkOutAt && <div>Out&nbsp;{dayjs(record.checkOutAt).format("hh:mm A")}</div>}
            </div>
          )}
        </div>
      </Popover>
    );
  };

  const isLoading = loading || reportLoading;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Monthly Attendance Report"
        subtitle="View your attendance history in calendar format"
        icon={<CalendarOutlined />}
      />

      {/* ── Stats Row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12, marginTop: 16, marginBottom: 16,
      }}>
        <StatCard label="Present"  value={summary.present}  color={C.success} bg={C.successLight} icon={<CheckCircleOutlined />} pct={summary.total ? Math.round((summary.present / summary.total) * 100) : 0} />
        <StatCard label="Absent"   value={summary.absent}   color={C.danger}  bg={C.dangerLight}  icon={<CloseCircleOutlined />} />
        <StatCard label="Late"     value={summary.late}     color={C.warning} bg={C.warningLight} icon={<ClockCircleOutlined />} />
        <StatCard label="Half Day" value={summary.halfday}  color={C.purple}  bg={C.purpleLight}  icon={<MinusCircleOutlined />} />
        <StatCard label="On Leave" value={summary.leave}    color={C.cyan}    bg={C.cyanLight}    icon={<QuestionCircleOutlined/>} />
        <StatCard label="Attendance" value={`${summary.pct}%`} color={C.primary} bg={C.primaryLighter} icon={<CalendarOutlined />} />
      </div>

      {/* ── Calendar Card ── */}
      <div style={PANEL}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
            {calValue.format("MMMM YYYY")}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {Object.entries(STATUS).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textSub }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color }} />
                {cfg.label}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textSub }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.border }} />
              Not Marked
            </div>
          </div>
        </div>

        <Spin spinning={isLoading}>
          <Calendar
            fullscreen
            value={calValue}
            onPanelChange={(v) => setCalValue(v)}
            cellRender={cellRender}
            style={{ borderRadius: 10 }}
          />
        </Spin>
      </div>

      {/* ── Day-wise detail table ── */}
      {myAttendance.length > 0 && (
        <div style={{ ...PANEL, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>
            Day-wise Records — {calValue.format("MMMM YYYY")}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.surfaceSoft }}>
                  {["Date", "Day", "Status", "Check-In", "Check-Out", "Working Hours", "Remarks"].map((h) => (
                    <th key={h} style={{
                      padding: "9px 12px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: C.textSub,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      borderBottom: `2px solid ${C.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...myAttendance]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((r) => {
                    const cfg = STATUS[r.status] || {};
                    const d = dayjs(r.date);
                    let wh = "—";
                    if (r.checkInAt && r.checkOutAt) {
                      const diff = new Date(r.checkOutAt) - new Date(r.checkInAt);
                      wh = `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
                    }
                    return (
                      <tr key={r._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.text, fontSize: 13 }}>
                          {d.format("DD MMM YYYY")}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.textSub }}>
                          {d.format("ddd")}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11,
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.border || C.border}`,
                          }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                          {r.checkInAt ? dayjs(r.checkInAt).format("hh:mm A") : "—"}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                          {r.checkOutAt ? dayjs(r.checkOutAt).format("hh:mm A") : "—"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.accent, fontWeight: 600 }}>
                          {wh}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.textSub, fontStyle: r.remarks ? "italic" : "normal" }}>
                          {r.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendanceMonthlyReport;
