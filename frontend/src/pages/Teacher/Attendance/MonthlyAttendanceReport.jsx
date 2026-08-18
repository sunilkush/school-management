import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker, Spin, Empty, Table } from "antd";
import {
  CalendarOutlined, TeamOutlined, CheckCircleOutlined,
  CloseCircleOutlined, TrophyOutlined, WarningOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchMonthlyAttendance } from "../../../features/attendanceSlice";
import { fetchAssignedClasses }   from "../../../features/classSlice";
import PageHeader                 from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles";
import { categoricalColorFor } from "../../../utils/colorPalette";

const TABLE_CLS = "teacher-monthly-tbl";

/* ── theme (shared design tokens — see index.css) ── */
const C = {
  primary:      "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  success:      "var(--success)", successLight: "var(--success-light)",
  warning:      "var(--warning)", warningLight: "var(--warning-light)",
  danger:       "var(--danger)",  dangerLight:  "var(--danger-light)",
  purple:       "var(--purple)",  purpleLight:  "rgba(var(--purple-rgb),0.12)",
  cyan:         "var(--cyan)",    cyanLight:    "rgba(6,182,212,0.15)",
  accent:       "var(--accent)",  accentLight:  "var(--accent-light)",
  border:       "var(--border)",  text:         "var(--text)",
  textSub:      "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface:      "var(--surface)", surfaceSoft:  "var(--surface-soft)",
};

// RGB triples for every token above (+ the shared categorical palette) keyed by their
// var(--x) string. Used by tint() to build alpha-tinted backgrounds/borders from a CSS
// custom property — the old `${color}NN` hex-alpha-suffix concatenation used throughout
// this file doesn't work once these are var() values, so we go through rgba() instead.
const RGB = {
  "var(--primary)": "var(--primary-rgb)",
  "var(--accent)":  "var(--accent-rgb)",
  "var(--purple)":  "var(--purple-rgb)",
  "var(--success)": "var(--success-rgb)",
  "var(--warning)": "var(--warning-rgb)",
  "var(--danger)":  "var(--danger-rgb)",
  "var(--pink)":    "236,72,153",
  "var(--cyan)":    "6,182,212",
  "var(--info)":    "59,130,246",
  "var(--orange)":  "249,115,22",
};
const tint = (color, alpha) => `rgba(${RGB[color] || "100,116,139"}, ${alpha})`;

/* ── status config ── */
const STATUS = {
  present: { color: C.success, bg: C.successLight, border: "var(--success-light)", label: "Present",  short: "P"  },
  absent:  { color: C.danger,  bg: C.dangerLight,  border: "var(--danger-light)", label: "Absent",   short: "A"  },
  late:    { color: C.warning, bg: C.warningLight,  border: "var(--warning-light)", label: "Late",     short: "L"  },
  halfday: { color: C.purple,  bg: C.purpleLight,  border: "rgba(var(--purple-rgb),0.35)", label: "Half Day", short: "H"  },
  leave:   { color: C.cyan,    bg: C.cyanLight,    border: "rgba(6,182,212,0.35)", label: "On Leave", short: "Lv" },
};

/* ── helpers ── */
const FL = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
    {children}
  </div>
);

const pctColor = (n) => n >= 90 ? C.success : n >= 75 ? C.warning : C.danger;
const pctBg    = (n) => n >= 90 ? C.successLight : n >= 75 ? C.warningLight : C.dangerLight;
const pctBdr   = (n) => n >= 90 ? "var(--success-light)" : n >= 75 ? "var(--warning-light)" : "var(--danger-light)";

// Per-student avatar color, sourced from the shared categorical palette (see
// utils/colorPalette.js) instead of a locally-duplicated array, so avatars use the
// same color sequence as every other page.
const avatarColor = (name = "") => {
  const color = categoricalColorFor(name);
  return { bg: tint(color, 0.15), color };
};

/* ── Stat Card ── */
const StatCard = ({ label, value, sub, color, bg, icon }) => (
  <div style={{
    background: bg, borderRadius: 14, padding: "16px 18px",
    border: `1px solid ${tint(color, 0.19)}`, display: "flex", alignItems: "center", gap: 12,
    flex: 1, minWidth: 120, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
      background: tint(color, 0.13), display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 18, color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Status dot cell ── */
const DotCell = ({ val }) => {
  const cfg = STATUS[val];
  if (!cfg) return <span style={{ color: C.border, fontSize: 14, fontWeight: 300 }}>·</span>;
  return (
    <div
      title={cfg.label}
      style={{
        width: 22, height: 22, borderRadius: "50%",
        background: cfg.color, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: val === "leave" ? 7 : 8, fontWeight: 800, margin: "0 auto",
        flexShrink: 0,
      }}
    >
      {cfg.short}
    </div>
  );
};

/* ── Attendance % cell with progress ── */
const PctCell = ({ val }) => {
  const n   = Number(val || 0);
  const col = pctColor(n);
  const bg  = pctBg(n);
  const bdr = pctBdr(n);
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 20,
        background: bg, color: col, border: `1px solid ${bdr}`,
        fontWeight: 800, fontSize: 11, marginBottom: 4,
        whiteSpace: "nowrap",
      }}>
        {n.toFixed(1)}%
      </div>
      <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.min(n, 100)}%`,
          background: col, borderRadius: 99, transition: "width 0.3s",
        }} />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════ */
const MonthlyAttendanceReport = () => {
  const dispatch = useDispatch();

  const { monthlyAttendance = [], loading: attendanceLoading } = useSelector((s) => s.attendance || {});
  const { classAssignTeacher = [], loading: classLoading }     = useSelector((s) => s.class || {});
  const { user: currentUser }     = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }  = useSelector((s) => s.academicYear || {});

  const schoolId       = currentUser?.school?._id || null;
  const academicYearId = selectedAcademicYear?._id || null;
  const teacherId      = currentUser?._id || null;

  const [selectedKey, setSelectedKey] = useState(null);
  const [month,       setMonth]       = useState(dayjs());

  /* fetch assigned classes */
  useEffect(() => {
    if (!schoolId || !academicYearId || !teacherId) return;
    dispatch(fetchAssignedClasses({ schoolId, academicYearId, teacherId }));
  }, [dispatch, schoolId, academicYearId, teacherId]);

  /* class-section list */
  const classSections = useMemo(() => {
    if (!Array.isArray(classAssignTeacher)) return [];
    return classAssignTeacher
      .flatMap((cls) =>
        (cls.sections || []).map((sec) => ({
          key:          `${cls._id}_${sec.sectionId?._id}`,
          classId:      cls._id,
          className:    cls.name,
          sectionId:    sec.sectionId?._id,
          sectionName:  sec.sectionId?.name,
          isClassTeacher: !!sec?.isClassTeacher,
          studentCount: sec?.studentCount ?? cls?.studentCount ?? 0,
        }))
      )
      .filter((item) => item.classId && item.sectionId);
  }, [classAssignTeacher]);

  /* auto-select first */
  useEffect(() => {
    if (!selectedKey && classSections.length > 0) setSelectedKey(classSections[0].key);
  }, [selectedKey, classSections]);

  const selected = useMemo(() => classSections.find((c) => c.key === selectedKey) || null, [classSections, selectedKey]);

  /* fetch attendance */
  useEffect(() => {
    if (!selected || !month || !schoolId) return;
    dispatch(fetchMonthlyAttendance({
      schoolId,
      classId:   selected.classId,
      sectionId: selected.sectionId,
      role:      "student",
      month:     month.format("MM"),
      year:      month.format("YYYY"),
    }));
  }, [dispatch, selected, month, schoolId]);

  const daysInMonth = useMemo(() => month.daysInMonth(), [month]);

  /* table rows */
  const tableData = useMemo(() => {
    if (!Array.isArray(monthlyAttendance)) return [];
    return monthlyAttendance.map((item, idx) => {
      const present = Number(item.present || 0);
      const absent  = Number(item.absent  || 0);
      const total   = present + absent;
      const pct     = total ? ((present / total) * 100).toFixed(1) : "0.0";
      const row     = {
        ...item,
        key:        item.userId || item._id || `student-${idx}`,
        totalDays:  total,
        pct,
      };
      for (let d = 1; d <= daysInMonth; d++) {
        row[`day_${d}`] = item.dailyStatus?.[String(d)] || null;
      }
      return row;
    });
  }, [monthlyAttendance, daysInMonth]);

  /* summary */
  const summary = useMemo(() => {
    const total = tableData.length;
    let present = 0, absent = 0;
    tableData.forEach((r) => { present += Number(r.present || 0); absent += Number(r.absent || 0); });
    const days    = present + absent;
    const avg     = days ? ((present / days) * 100).toFixed(1) : "0.0";
    const low     = tableData.filter((r) => Number(r.pct) < 75).length;
    const perfect = tableData.filter((r) => Number(r.pct) >= 90).length;
    return { total, present, absent, avg, low, perfect };
  }, [tableData]);

  /* day column headers with weekend detection */
  const dateColumns = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day      = i + 1;
      const date     = dayjs(new Date(month.year(), month.month(), day));
      const dow      = date.day(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      const dayLabel = date.format("dd").charAt(0); // M T W T F S S

      return {
        title: (
          <div style={{ textAlign: "center", lineHeight: 1.3 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isWeekend ? C.textMuted : C.textSub }}>{day}</div>
            <div style={{ fontSize: 9, color: isWeekend ? C.textMuted : C.border, fontWeight: 600 }}>{dayLabel}</div>
          </div>
        ),
        dataIndex: `day_${day}`,
        width: 34,
        align: "center",
        onHeaderCell: () => ({
          style: {
            background: isWeekend ? C.surfaceSoft : C.surface,
            padding: "6px 4px",
          },
        }),
        onCell: () => ({
          style: {
            background: isWeekend ? C.surfaceSoft : "transparent",
            padding: "6px 4px",
          },
        }),
        render: (val) => <DotCell val={val} />,
      };
    });
  }, [daysInMonth, month]);

  /* full columns */
  const columns = [
    {
      title: "#",
      width: 44,
      fixed: "left",
      render: (_, __, i) => <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>{i + 1}</span>,
    },
    {
      title:    "Student",
      fixed:    "left",
      width:    200,
      render:   (_, row) => {
        const name = row?.student?.name || "—";
        const { bg, color } = avatarColor(name);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: bg, color, fontWeight: 800, fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {name[0]?.toUpperCase() || "?"}
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{name}</span>
          </div>
        );
      },
    },
    ...dateColumns,
    {
      title:     "P",
      dataIndex: "present",
      fixed:     "right",
      width:     46,
      align:     "center",
      render:    (v) => <span style={{ fontWeight: 800, color: C.success, fontSize: 13 }}>{v || 0}</span>,
    },
    {
      title:     "A",
      dataIndex: "absent",
      fixed:     "right",
      width:     46,
      align:     "center",
      render:    (v) => <span style={{ fontWeight: 800, color: v > 0 ? C.danger : C.textMuted, fontSize: 13 }}>{v || 0}</span>,
    },
    {
      title:     "Attendance %",
      dataIndex: "pct",
      fixed:     "right",
      width:     110,
      sorter:    (a, b) => Number(a.pct) - Number(b.pct),
      render:    (v) => <PctCell val={v} />,
    },
  ];

  const loading = classLoading || attendanceLoading;

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Monthly Attendance Report"
        subtitle={`Day-wise attendance matrix · ${selected ? `${selected.className} – ${selected.sectionName}` : "Select a class"} · ${month.format("MMMM YYYY")}`}
        icon={<CalendarOutlined />}
      />

      {/* ── Filter Panel ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>

          <div>
            <FL>Class & Section</FL>
            <Select
              placeholder="Select assigned class & section"
              style={{ width: "100%" }}
              value={selectedKey}
              onChange={setSelectedKey}
              loading={classLoading}
              options={classSections.map((item) => ({
                label: `${item.className} – ${item.sectionName}${item.isClassTeacher ? " ★" : ""}`,
                value: item.key,
              }))}
            />
            {selected?.isClassTeacher && (
              <div style={{ fontSize: 11, color: C.success, marginTop: 4, fontWeight: 600 }}>
                ★ You are the class teacher
              </div>
            )}
          </div>

          <div>
            <FL>Month</FL>
            <DatePicker
              picker="month" style={{ width: "100%" }}
              value={month}
              onChange={(v) => setMonth(v || dayjs())}
            />
          </div>
        </div>

        {/* No classes warning */}
        {!loading && classSections.length === 0 && (
          <div style={{
            marginTop: 14, padding: "12px 16px", borderRadius: 10,
            background: C.warningLight, border: `1px solid var(--warning-light)`,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <WarningOutlined style={{ color: C.warning, fontSize: 16, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--warning-hover)", fontSize: 13 }}>No assigned classes found</div>
              <div style={{ fontSize: 12, color: "var(--warning-hover)", marginTop: 2 }}>
                You have not been assigned any class/section yet. Please contact the admin to get classes assigned.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      {tableData.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 0, marginBottom: 14, flexWrap: "wrap" }}>
          <StatCard
            label="Students"
            value={summary.total}
            color={C.primary} bg={C.primaryLighter}
            icon={<TeamOutlined />}
            sub={selected ? `${selected.className} – ${selected.sectionName}` : ""}
          />
          <StatCard
            label="Avg. Attendance"
            value={`${summary.avg}%`}
            color={C.accent} bg={C.accentLight}
            icon={<CalendarOutlined />}
            sub="class average"
          />
          <StatCard
            label="Excellent ≥90%"
            value={summary.perfect}
            color={C.success} bg={C.successLight}
            icon={<TrophyOutlined />}
            sub="students"
          />
          <StatCard
            label="At Risk <75%"
            value={summary.low}
            color={C.danger} bg={C.dangerLight}
            icon={<WarningOutlined />}
            sub="need attention"
          />
        </div>
      )}

      {/* ── Legend ── */}
      {tableData.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center",
          marginBottom: 10, padding: "10px 14px",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Legend:
          </span>
          {Object.entries(STATUS).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSub }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: cfg.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 7, fontWeight: 800,
              }}>
                {cfg.short}
              </div>
              {cfg.label}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSub }}>
            <span style={{ color: C.border, fontSize: 14, fontWeight: 300, lineHeight: 1 }}>·</span>
            Not marked
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: C.surfaceSoft, color: C.textMuted, border: `1px solid ${C.border}` }}>
              Shaded columns = Weekend
            </span>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        <Spin spinning={loading}>
          {!selected && !loading ? (
            <div style={{ padding: 40 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: C.textMuted }}>
                    {classSections.length === 0
                      ? "No classes assigned — contact admin"
                      : "Select a class and section to view the attendance matrix"}
                  </span>
                }
              />
            </div>
          ) : tableData.length === 0 && !loading ? (
            <div style={{ padding: 40 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: C.textMuted }}>No attendance data for {month.format("MMMM YYYY")}</span>}
              />
            </div>
          ) : (
            <>
              {/* Table header bar */}
              <div style={{
                padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {selected?.className} – {selected?.sectionName} ·{" "}
                  <span style={{ color: C.primary }}>{tableData.length}</span>{" "}
                  <span style={{ color: C.textSub, fontWeight: 400 }}>students</span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
                    {month.format("MMMM YYYY")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "≥90%", color: C.success, count: summary.perfect },
                    { label: "<75%", color: C.danger,  count: summary.low     },
                  ].map(({ label, color, count }) => (
                    <span key={label} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99,
                      background: tint(color, 0.09), color, fontWeight: 700,
                      border: `1px solid ${tint(color, 0.19)}`,
                    }}>
                      {label} · {count}
                    </span>
                  ))}
                </div>
              </div>

              <Table
                className={TABLE_CLS}
                rowKey="key"
                columns={columns}
                dataSource={tableData}
                pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} students` }}
                scroll={{ x: "max-content" }}
                size="small"
                rowClassName={(record) => {
                  const n = Number(record.pct || 0);
                  if (n < 75)  return "row-at-risk";
                  if (n >= 90) return "row-excellent";
                  return "";
                }}
              />
            </>
          )}
        </Spin>
      </div>

      {/* Row tint styles */}
      <style>{`
        .${TABLE_CLS} .row-at-risk > td { background: ${tint(C.danger, 0.024)} !important; }
        .${TABLE_CLS} .row-at-risk:hover > td { background: ${tint(C.danger, 0.07)} !important; }
        .${TABLE_CLS} .row-excellent > td { background: ${tint(C.success, 0.024)} !important; }
        .${TABLE_CLS} .row-excellent:hover > td { background: ${tint(C.success, 0.07)} !important; }
        .${TABLE_CLS} .ant-table-thead > tr > th { padding: 8px 6px !important; }
        .${TABLE_CLS} .ant-table-tbody > tr > td { padding: 8px 6px !important; }
        .${TABLE_CLS} .ant-table-fixed-left .ant-table-cell,
        .${TABLE_CLS} .ant-table-fixed-right .ant-table-cell { background: ${C.surface} !important; }
        .${TABLE_CLS} .ant-table-tbody > tr.row-at-risk .ant-table-cell-fix-left,
        .${TABLE_CLS} .ant-table-tbody > tr.row-at-risk .ant-table-cell-fix-right { background: var(--danger-light) !important; }
        .${TABLE_CLS} .ant-table-tbody > tr.row-excellent .ant-table-cell-fix-left,
        .${TABLE_CLS} .ant-table-tbody > tr.row-excellent .ant-table-cell-fix-right { background: var(--success-light) !important; }
      `}</style>
    </div>
  );
};

export default MonthlyAttendanceReport;
