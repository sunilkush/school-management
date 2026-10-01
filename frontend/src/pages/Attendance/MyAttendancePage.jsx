import React, { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Empty, Segmented, Spin, Table, Tag, Tooltip } from "antd";
import {
  AimOutlined, CalendarOutlined, EnvironmentOutlined, LeftOutlined, RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import PageHeader from "../../components/layout/PageHeader";
import { ATTENDANCE_STATUS, attendanceLabel, workedText } from "../../utils/attendanceStatus";

const fmtTime = (d) => (d ? dayjs(d).format("hh:mm A") : "—");

/**
 * A staff member's attendance, month by month: today on one strip, the month's counts as chips,
 * and every recorded day in one compact table that can be narrowed to a status.
 */
const MyAttendancePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { myAttendance = [], loading } = useSelector((s) => s.attendance);
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [filter, setFilter] = useState("all");

  // The check-in page of whichever role this is opened under (/dashboard/<role>/attendance/self).
  const gpsPath = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const dashIdx = parts.indexOf("dashboard");
    return dashIdx !== -1 && parts[dashIdx + 1] ? `/dashboard/${parts[dashIdx + 1]}/attendance/self` : null;
  }, [location.pathname]);

  useEffect(() => {
    dispatch(fetchMyAttendance({ month: month.month() + 1, year: month.year() }));
    setFilter("all");
  }, [month, dispatch]);

  const summary = useMemo(() => {
    const s = { present: 0, late: 0, halfday: 0, absent: 0, leave: 0 };
    myAttendance.forEach((r) => { if (s[r.status] !== undefined) s[r.status] += 1; });
    // Late is still a day attended; approved leave is not a day missed, so it is left out.
    const marked = myAttendance.length - s.leave;
    const attended = s.present + s.late + s.halfday * 0.5;
    return { ...s, pct: marked > 0 ? Math.round((attended / marked) * 1000) / 10 : null };
  }, [myAttendance]);

  const today = dayjs();
  const isThisMonth = month.isSame(today, "month");
  const todayRecord = isThisMonth ? myAttendance.find((r) => dayjs(r.date).isSame(today, "day")) : null;
  const checkedIn = Boolean(todayRecord?.checkInAt);
  const checkedOut = Boolean(todayRecord?.checkOutAt);
  const todayCfg = todayRecord ? ATTENDANCE_STATUS[todayRecord.status] : null;
  const pctColor = summary.pct == null ? "var(--text-muted)" : summary.pct >= 90 ? "var(--success)" : summary.pct >= 75 ? "var(--warning)" : "var(--danger)";

  const rows = useMemo(
    () => [...myAttendance]
      .filter((r) => filter === "all" || r.status === filter)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [myAttendance, filter],
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Attendance History"
        subtitle="Every recorded day of the month, with check-in and check-out times"
        icon={<CalendarOutlined />}
        extra={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button size="small" icon={<LeftOutlined />} aria-label="Previous month" onClick={() => setMonth((m) => m.subtract(1, "month"))} />
            <DatePicker picker="month" size="small" value={month} allowClear={false} format="MMM YYYY"
              onChange={(v) => v && setMonth(v.startOf("month"))} disabledDate={(d) => d && d.isAfter(today, "month")} />
            <Button size="small" icon={<RightOutlined />} aria-label="Next month" disabled={isThisMonth} onClick={() => setMonth((m) => m.add(1, "month"))} />
          </div>
        }
      />

      {/* ── Today, on one strip ── */}
      {isThisMonth && (
        <div className="section-panel" style={{
          marginTop: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px 18px", flexWrap: "wrap",
          borderLeft: `3px solid ${todayCfg?.color || "var(--border)"}`,
        }}>
          <div style={{ minWidth: 150 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Today · {today.format("ddd, DD MMM")}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: todayCfg?.color || "var(--text-muted)" }}>
              {todayRecord ? attendanceLabel(todayRecord) : "Not marked yet"}
            </div>
          </div>
          {[
            ["In", fmtTime(todayRecord?.checkInAt)],
            ["Out", fmtTime(todayRecord?.checkOutAt)],
            ["Worked", workedText(todayRecord?.checkInAt, todayRecord?.checkOutAt) || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
          {todayRecord?.gpsVerified && (
            <Tooltip title={todayRecord.distanceFromSchool != null ? `${todayRecord.distanceFromSchool}m from school` : "GPS verified"}>
              <span style={{ fontSize: 12, color: "var(--success)" }}><AimOutlined /> GPS verified</span>
            </Tooltip>
          )}
          {gpsPath && (
            <Button
              style={{ marginLeft: "auto" }} icon={<EnvironmentOutlined />}
              type={checkedIn && checkedOut ? "default" : "primary"} danger={checkedIn && !checkedOut}
              onClick={() => navigate(gpsPath)}
            >
              {!checkedIn ? "Punch In" : !checkedOut ? "Punch Out" : "Open My Attendance"}
            </Button>
          )}
        </div>
      )}

      {/* ── The month ── */}
      <div className="section-panel" style={{ marginTop: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, border: `1px solid ${pctColor}`, color: "var(--text-secondary)" }}>
              <b style={{ color: pctColor, fontSize: 14 }}>{summary.pct == null ? "—" : `${summary.pct}%`}</b> attendance
            </span>
            {Object.entries(ATTENDANCE_STATUS).map(([k, cfg]) => (
              <span key={k} style={{
                fontSize: 12, padding: "2px 9px", borderRadius: 20, color: "var(--text-secondary)",
                border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`, background: `color-mix(in srgb, ${cfg.color} 8%, transparent)`,
              }}>
                <b style={{ color: cfg.color }}>{summary[k]}</b> {cfg.label}
              </span>
            ))}
          </div>
          <Segmented
            size="small" value={filter} onChange={setFilter}
            options={[
              { value: "all", label: `All ${myAttendance.length}` },
              ...Object.entries(ATTENDANCE_STATUS).filter(([k]) => summary[k] > 0).map(([k, cfg]) => ({ value: k, label: cfg.label })),
            ]}
          />
        </div>

        <Spin spinning={loading}>
          <Table
            size="small" rowKey={(r) => r._id || r.date} dataSource={rows}
            pagination={{ pageSize: 31, hideOnSinglePage: true }} scroll={{ x: "max-content" }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No attendance recorded for ${month.format("MMMM YYYY")}`} /> }}
            columns={[
              {
                title: "Date",
                render: (_, r) => {
                  const d = dayjs(r.date);
                  return (
                    <span style={{ whiteSpace: "nowrap" }}>
                      <b>{d.format("DD MMM")}</b> <span className="u-muted">{d.format("ddd")}</span>
                      {d.isSame(today, "day") ? <Tag color="blue" style={{ marginLeft: 6 }}>Today</Tag> : null}
                    </span>
                  );
                },
              },
              {
                title: "Status",
                render: (_, r) => <span style={{ color: ATTENDANCE_STATUS[r.status]?.color, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{attendanceLabel(r)}</span>,
              },
              {
                title: "In – Out",
                render: (_, r) => (r.checkInAt
                  ? <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{dayjs(r.checkInAt).format("hh:mm")} – {r.checkOutAt ? dayjs(r.checkOutAt).format("hh:mm A") : "…"}</span>
                  : <span className="u-muted">—</span>),
              },
              { title: "Worked", render: (_, r) => workedText(r.checkInAt, r.checkOutAt) || <span className="u-muted">—</span> },
              {
                title: "GPS", width: 60,
                render: (_, r) => (r.gpsVerified
                  ? <Tooltip title={r.distanceFromSchool != null ? `${r.distanceFromSchool}m from school` : "GPS verified"}><AimOutlined style={{ color: "var(--success)" }} /></Tooltip>
                  : <span className="u-muted">—</span>),
              },
              { title: "Remarks", dataIndex: "remarks", ellipsis: true, render: (v) => (v ? <span className="u-muted" style={{ fontSize: 12 }}>{v}</span> : <span className="u-muted">—</span>) },
            ]}
          />
        </Spin>
      </div>
    </div>
  );
};

export default MyAttendancePage;
