import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, DatePicker, Empty, Select, Skeleton, Table, Tag, Tooltip } from "antd";
import {
  CalendarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyAttendance } from "../../../features/attendanceSlice.js";
import { fetchMyChildren } from "../../../features/studentPortalSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel,
  statCard, statLabel, statValue, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const STAT_COLORS = ["#14B8A6", "#22C55E", "#EF4444", "#F59E0B", "#2563EB"];
const TABLE_CLS   = "child-att-tbl";

const STATUS_CFG = {
  present:  { color: "#22C55E", bg: "#DCFCE7", border: "#86EFAC", label: "Present",  tagColor: "success" },
  absent:   { color: "#EF4444", bg: "#FEE2E2", border: "#FCA5A5", label: "Absent",   tagColor: "error"   },
  late:     { color: "#F59E0B", bg: "#FEF3C7", border: "#FCD34D", label: "Late",     tagColor: "warning" },
  halfday:  { color: "#F97316", bg: "#FFF7ED", border: "#FDBA74", label: "Half Day", tagColor: "orange"  },
  leave:    { color: "#0891B2", bg: "#ECFEFF", border: "#67E8F9", label: "Leave",    tagColor: "cyan"    },
};

/* ── Mini attendance calendar ── */
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
  const startOffset  = (firstOfMonth.day() + 6) % 7; // Mon=0 … Sun=6
  const totalCells   = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayStr     = dayjs().format("YYYY-MM-DD");

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Day-of-week header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={d} style={{
            textAlign: "center",
            fontSize: 10, fontWeight: 700,
            color: i === 6 ? "#EF4444" : "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "3px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} style={{ minHeight: 36 }} />;

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const status  = statusMap[dateStr];
          const cfg     = STATUS_CFG[status];
          const isToday = dateStr === todayStr;
          const isSun   = idx % 7 === 6;

          return (
            <Tooltip
              key={idx}
              title={cfg ? `${dayjs(dateStr).format("DD MMM")} — ${cfg.label}` : (isSun ? "Sunday" : "No record")}
            >
              <div style={{
                minHeight: 36,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: isToday ? 800 : 600,
                background: cfg ? cfg.bg : isSun ? "transparent" : "var(--surface-soft)",
                color: cfg ? cfg.color : isSun ? "#CBD5E1" : "var(--text-muted)",
                border: isToday
                  ? `2px solid ${cfg ? cfg.color : "var(--primary)"}`
                  : cfg
                    ? `1px solid ${cfg.border}60`
                    : `1px solid ${isSun ? "transparent" : "var(--border-muted)"}`,
                cursor: "default",
                transition: "transform 0.1s",
              }}>
                {dayNum}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 11, height: 11, borderRadius: 3,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
            }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Page ── */
const ChildAttendancePage = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading }          = useSelector((s) => s.studentPortal || {});
  const { myAttendance = [], loading: attendanceLoading } = useSelector((s) => s.attendance || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedMonth,   setSelectedMonth]   = useState(dayjs());

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const loadAttendance = useCallback((childId, month) => {
    if (!childId) return;
    dispatch(fetchMyAttendance({
      childId,
      month: month.month() + 1,
      year:  month.year(),
    }));
  }, [dispatch]);

  useEffect(() => {
    loadAttendance(selectedChildId, selectedMonth);
  }, [loadAttendance, selectedChildId, selectedMonth]);

  /* ── Stats ── */
  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0, leave = 0;
    myAttendance.forEach((r) => {
      const s = String(r.status || "").toLowerCase();
      if (s === "present")              present++;
      else if (s === "absent")          absent++;
      else if (s === "late" || s === "halfday") late++;
      else if (s === "leave")           leave++;
    });
    const total = myAttendance.length;
    const pct   = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, pct };
  }, [myAttendance]);

  const pctColor = summary.pct >= 75 ? "#22C55E" : summary.pct >= 50 ? "#F59E0B" : "#EF4444";

  const statMeta = [
    { key: "total",   label: "Total Days",   value: summary.total,     icon: <CalendarOutlined />,    color: STAT_COLORS[0] },
    { key: "present", label: "Present",      value: summary.present,   icon: <CheckCircleOutlined />, color: STAT_COLORS[1] },
    { key: "absent",  label: "Absent",       value: summary.absent,    icon: <CloseCircleOutlined />, color: STAT_COLORS[2] },
    { key: "late",    label: "Late / Half",  value: summary.late,      icon: <ClockCircleOutlined />, color: STAT_COLORS[3] },
    { key: "pct",     label: "Attendance %", value: `${summary.pct}%`, icon: <CalendarOutlined />,    color: pctColor       },
  ];

  /* ── Table columns ── */
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
        ? <span style={{ fontWeight: 600, color: "#22C55E" }}>{dayjs(v).format("hh:mm A")}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Check Out",
      dataIndex: "checkOutAt",
      width: 110,
      render: (v) => v
        ? <span style={{ fontWeight: 600, color: "#2563EB" }}>{dayjs(v).format("hh:mm A")}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (v) => v || <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Child Attendance"
        subtitle="View your child's monthly attendance records with calendar and statistics."
        icon={<CalendarOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childLoading}
              style={{ minWidth: 180 }}
              options={children.map((c) => ({ label: c.name || "Unnamed Child", value: c.userId }))}
              showSearch
              optionFilterProp="label"
              disabled={!children.length}
            />
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(m) => m && setSelectedMonth(m)}
              allowClear={false}
              style={{ width: 140 }}
              disabledDate={(d) => d && d.isAfter(dayjs(), "month")}
              format="MMM YYYY"
            />
            <Button
              icon={<ReloadOutlined />}
              loading={attendanceLoading}
              onClick={() => loadAttendance(selectedChildId, selectedMonth)}
              disabled={!selectedChildId}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div style={pageWrapper}>
        <style>{tableHeadCss(TABLE_CLS)}</style>

        {!children.length && !childLoading && (
          <Alert
            type="info"
            showIcon
            message="No linked child found for this parent account."
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Stat Cards */}
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
              <div style={{ fontSize: 26, color, opacity: 0.5 }}>{icon}</div>
            </div>
          ))}
        </div>

        {!selectedChildId ? (
          <div style={sectionPanel}><Empty description="Select a child to view attendance" /></div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}>
            {/* ── Calendar panel ── */}
            <div style={{ ...sectionPanel, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                  {selectedMonth.format("MMMM YYYY")}
                </span>
                {/* Inline attendance bar */}
                {summary.total > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, fontWeight: 700, color: pctColor,
                  }}>
                    <div style={{
                      width: 80, height: 6, borderRadius: 3,
                      background: "var(--border-muted)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${summary.pct}%`, height: "100%",
                        background: pctColor, borderRadius: 3,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    {summary.pct}%
                  </div>
                )}
              </div>

              {attendanceLoading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <AttendanceCalendar
                  records={myAttendance}
                  month={selectedMonth.month() + 1}
                  year={selectedMonth.year()}
                />
              )}

              {/* Monthly breakdown pills */}
              {!attendanceLoading && myAttendance.length > 0 && (
                <div style={{
                  display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap",
                  paddingTop: 16, borderTop: "1px solid var(--border-muted)",
                }}>
                  {[
                    { label: "Present", value: summary.present, color: "#22C55E", bg: "#DCFCE7" },
                    { label: "Absent",  value: summary.absent,  color: "#EF4444", bg: "#FEE2E2" },
                    { label: "Late",    value: summary.late,    color: "#F59E0B", bg: "#FEF3C7" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 20,
                      background: bg, border: `1px solid ${color}40`,
                    }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color }}>{value}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Table panel ── */}
            <div style={{ ...sectionPanel, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>
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
