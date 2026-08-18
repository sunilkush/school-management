import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Button, DatePicker, Empty,
  Select, Skeleton, Table, Tag, Tooltip,
} from "antd";
import {
  CalendarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import { fetchMyChildren } from "../../features/studentPortalSlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel,
  statCard, statLabel, statValue, statGrid, tableHeadCss,
} from "../../styles/pageStyles";

/* ─── constants ─────────────────────────────────────────────────────── */
const STAT_COLORS = ["var(--accent)", "var(--success)", "var(--danger)", "var(--warning)", "var(--primary)"];
const TABLE_CLS   = "child-att-tbl";

const STATUS_CFG = {
  present: { color: "var(--success)", bg: "var(--success-light)", border: "var(--success-light)", label: "Present",  tagColor: "success" },
  absent:  { color: "var(--danger)", bg: "var(--danger-light)", border: "var(--danger-light)", label: "Absent",   tagColor: "error"   },
  late:    { color: "var(--warning)", bg: "var(--warning-light)", border: "var(--warning)", label: "Late",     tagColor: "warning" },
  halfday: { color: "var(--orange)", bg: "rgba(var(--warning-rgb), 0.08)", border: "var(--orange)", label: "Half Day", tagColor: "orange"  },
  leave:   { color: "var(--cyan)", bg: "#ECFEFF", border: "#67E8F9", label: "Leave",    tagColor: "cyan"    }, // no cyan-tint tokens exist; left as-is
};

/* ─── mini calendar ──────────────────────────────────────────────────── */
const AttendanceCalendar = ({ records, month, year }) => {
  const statusMap = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (r.date) map[dayjs(r.date).format("YYYY-MM-DD")] = String(r.status || "").toLowerCase();
    });
    return map;
  }, [records]);

  const firstOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const daysInMonth  = firstOfMonth.daysInMonth();
  const startOffset  = (firstOfMonth.day() + 6) % 7; // Mon = 0
  const totalCells   = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayStr     = dayjs().format("YYYY-MM-DD");
  const DAY_LABELS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* day-of-week header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, fontWeight: 700,
            color: i === 6 ? "var(--danger)" : "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth)
            return <div key={idx} style={{ minHeight: 38 }} />;

          const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
          const status  = statusMap[dateStr];
          const cfg     = STATUS_CFG[status];
          const isToday = dateStr === todayStr;
          const isSun   = idx % 7 === 6;

          return (
            <Tooltip
              key={idx}
              title={
                cfg
                  ? `${dayjs(dateStr).format("DD MMM")} — ${cfg.label}`
                  : isSun ? "Sunday" : "No record"
              }
            >
              <div style={{
                minHeight: 38, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: isToday ? 800 : 600,
                background: cfg ? cfg.bg : isSun ? "transparent" : "var(--surface-soft)",
                color:      cfg ? cfg.color : isSun ? "var(--text-disabled)" : "var(--text-muted)",
                border: isToday
                  ? `2px solid ${cfg ? cfg.color : "var(--primary)"}`
                  : cfg
                    ? `1px solid color-mix(in srgb, ${cfg.border} 38%, transparent)`
                    : `1px solid ${isSun ? "transparent" : "var(--border-muted)"}`,
                cursor: "default",
              }}>
                {dayNum}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
            }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
              {cfg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── page ───────────────────────────────────────────────────────────── */
const ChildAttendancePage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const requestedChildId = searchParams.get("childId");

  const { children = [], loading: childLoading }          = useSelector((s) => s.studentPortal || {});
  const { myAttendance = [], loading: attendanceLoading } = useSelector((s) => s.attendance    || {});

  const [childId,       setChildId]       = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  /* fetch children once */
  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  /* select child requested via ?childId= (e.g. from the dashboard), else first child */
  useEffect(() => {
    if (childId || !children.length) return;
    const requested = requestedChildId && children.some((c) => c.userId === requestedChildId);
    setChildId(requested ? requestedChildId : children[0].userId);
  }, [children, childId, requestedChildId]);

  /* load attendance whenever child or month changes */
  const loadAttendance = useCallback((id, month) => {
    if (!id) return;
    dispatch(fetchMyAttendance({
      childId: id,
      month:   month.month() + 1,
      year:    month.year(),
    }));
  }, [dispatch]);

  useEffect(() => {
    loadAttendance(childId, selectedMonth);
  }, [loadAttendance, childId, selectedMonth]);

  /* summary stats */
  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    myAttendance.forEach((r) => {
      const s = String(r.status || "").toLowerCase();
      if (s === "present")                present++;
      else if (s === "absent")            absent++;
      else if (s === "late" || s === "halfday") late++;
    });
    const total   = myAttendance.length;
    const percent = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, percent };
  }, [myAttendance]);

  const pctColor = summary.percent >= 75 ? "var(--success)" : summary.percent >= 50 ? "var(--warning)" : "var(--danger)";

  const statMeta = [
    { key: "total",   label: "Total Days",   value: summary.total,        icon: <CalendarOutlined />,    color: STAT_COLORS[0] },
    { key: "present", label: "Present",      value: summary.present,      icon: <CheckCircleOutlined />, color: STAT_COLORS[1] },
    { key: "absent",  label: "Absent",       value: summary.absent,       icon: <CloseCircleOutlined />, color: STAT_COLORS[2] },
    { key: "late",    label: "Late / Half",  value: summary.late,         icon: <ClockCircleOutlined />, color: STAT_COLORS[3] },
    { key: "pct",     label: "Attendance %", value: `${summary.percent}%`,icon: <CalendarOutlined />,    color: pctColor       },
  ];

  /* table columns */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      width: 150,
      defaultSortOrder: "descend",
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v) => v ? (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {dayjs(v).format("DD MMM YYYY")}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {dayjs(v).format("dddd")}
          </div>
        </div>
      ) : "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      filters: Object.entries(STATUS_CFG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (val, r) => String(r.status || "").toLowerCase() === val,
      render: (s) => {
        const n   = String(s || "").toLowerCase();
        const cfg = STATUS_CFG[n];
        return (
          <Tag color={cfg?.tagColor || "default"} style={{ fontWeight: 600 }}>
            {cfg?.label || n.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Check In",
      dataIndex: "checkInAt",
      width: 110,
      render: (v) => v
        ? <span style={{ fontWeight: 600, color: "var(--success)" }}>{dayjs(v).format("hh:mm A")}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Check Out",
      dataIndex: "checkOutAt",
      width: 110,
      render: (v) => v
        ? <span style={{ fontWeight: 600, color: "var(--primary)" }}>{dayjs(v).format("hh:mm A")}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (v) => v || <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
  ];

  /* ─── render ─────────────────────────────────────────────────────── */
  return (
    <>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Child Attendance"
        subtitle="View your child's monthly attendance with calendar and statistics."
        icon={<CalendarOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              placeholder="Select child"
              value={childId}
              onChange={setChildId}
              loading={childLoading}
              showSearch
              optionFilterProp="label"
              disabled={!children.length}
              style={{ minWidth: 180 }}
              options={children.map((c) => ({
                label: c?.name || "Child",
                value: c?.userId,
              }))}
            />
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(m) => m && setSelectedMonth(m)}
              allowClear={false}
              format="MMM YYYY"
              style={{ width: 140 }}
              disabledDate={(d) => d && d.isAfter(dayjs(), "month")}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={attendanceLoading}
              disabled={!childId}
              onClick={() => loadAttendance(childId, selectedMonth)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div style={pageWrapper}>

        {/* no-child alert */}
        {!children.length && !childLoading && (
          <Alert
            type="info"
            showIcon
            message="No child linked with this parent account."
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* ── stat cards ── */}
        <div className="stat-grid" style={statGrid(150)}>
          {statMeta.map(({ key, label, value, icon, color }) => (
            <div key={key} style={statCard({ color })}>
              <div>
                <div style={statLabel(color)}>{label}</div>
                <div style={{
                  ...statValue(color),
                  color: key === "pct" ? pctColor : "var(--text)",
                }}>
                  {value}
                </div>
              </div>
              <div style={{ fontSize: 26, color, opacity: 0.45 }}>{icon}</div>
            </div>
          ))}
        </div>

        {/* ── main content ── */}
        {!childId ? (
          <div style={sectionPanel}>
            <Empty description="Select a child to view attendance" />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}>

            {/* ── calendar panel ── */}
            <div style={{ ...sectionPanel, minWidth: 0 }}>
              {/* panel header */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 16,
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                  {selectedMonth.format("MMMM YYYY")}
                </span>

                {/* inline progress bar */}
                {summary.total > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 80, height: 6, borderRadius: 3,
                      background: "var(--border-muted)", overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${summary.percent}%`, height: "100%",
                        background: pctColor, borderRadius: 3,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pctColor }}>
                      {summary.percent}%
                    </span>
                  </div>
                )}
              </div>

              {attendanceLoading
                ? <Skeleton active paragraph={{ rows: 5 }} />
                : (
                  <AttendanceCalendar
                    records={myAttendance}
                    month={selectedMonth.month() + 1}
                    year={selectedMonth.year()}
                  />
                )
              }

              {/* breakdown pills */}
              {!attendanceLoading && myAttendance.length > 0 && (
                <div style={{
                  display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap",
                  paddingTop: 16, borderTop: "1px solid var(--border-muted)",
                }}>
                  {[
                    { label: "Present", value: summary.present, color: "var(--success)", bg: "var(--success-light)" },
                    { label: "Absent",  value: summary.absent,  color: "var(--danger)", bg: "var(--danger-light)" },
                    { label: "Late",    value: summary.late,    color: "var(--warning)", bg: "var(--warning-light)" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 20,
                      background: bg, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                    }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color }}>{value}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── records table ── */}
            <div style={{ ...sectionPanel, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: 13,
                color: "var(--text-primary)", marginBottom: 14,
              }}>
                Daily Records
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
                  ({myAttendance.length} entries)
                </span>
              </div>

              {!myAttendance.length && !attendanceLoading ? (
                <Empty description="No attendance records for this month" />
              ) : (
                <Table
                  className={TABLE_CLS}
                  rowKey="_id"
                  columns={columns}
                  dataSource={myAttendance}
                  loading={attendanceLoading}
                  pagination={{ pageSize: 12, showSizeChanger: false, size: "small" }}
                  scroll={{ x: 480 }}
                  size="small"
                />
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default ChildAttendancePage;
