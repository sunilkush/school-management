import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker, Button, Spin, Empty, message } from "antd";
import {
  BankOutlined, FileTextOutlined, DownloadOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  MinusCircleOutlined, TeamOutlined, TrophyOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchMonthlyReport } from "../../features/attendanceSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { fetchSchools }       from "../../features/schoolSlice";
import PageHeader             from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles";
import { CATEGORICAL_COLORS } from "../../utils/colorPalette";

/* ── theme ── */
const C = {
  primary:      "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  success:      "var(--success)", successLight: "var(--success-light)",
  warning:      "var(--warning)", warningLight: "var(--warning-light)",
  danger:       "var(--danger)", dangerLight:  "var(--danger-light)",
  purple:       "var(--purple)", purpleLight:  "rgba(var(--purple-rgb), 0.12)",
  cyan:         "var(--cyan)", cyanLight:    "#CFFAFE", // no design token exists for this cyan-100 tint; left as-is
  accent:       "var(--accent)", accentLight:  "var(--accent-light)",
  border:       "var(--border)", text:         "var(--text)",
  textSub:      "var(--text-secondary)", textMuted:    "var(--text-muted)",
  surface:      "var(--surface)", surfaceSoft:  "var(--surface-soft)",
};

const ROLE_OPTIONS = [
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Staff",    value: "staff"   },
];

const PAGE_SIZE = 15;

/* ── helpers ── */
const FL = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
    {children}
  </div>
);

const avatarColor = (name = "") => {
  const color = CATEGORICAL_COLORS[(name.charCodeAt(0) || 65) % CATEGORICAL_COLORS.length];
  return { bg: `color-mix(in srgb, ${color} 15%, transparent)`, color };
};

const pctColor = (n) => {
  if (n >= 90) return C.success;
  if (n >= 75) return C.warning;
  return C.danger;
};

const pctBg = (n) => {
  if (n >= 90) return C.successLight;
  if (n >= 75) return C.warningLight;
  return C.dangerLight;
};

const pctBorder = (n) => {
  if (n >= 90) return "var(--success-light)";
  if (n >= 75) return "var(--warning)";
  return "var(--danger-light)";
};

/* ── CSV export ── */
const exportCSV = (data, filename) => {
  if (!data?.length) return message.warning("No data to export");
  const headers = ["#", "Name", "Email", "Present", "Absent", "Late", "Half Day", "Leave", "Total", "Attendance %"];
  const rows = data.map((r, i) => [
    i + 1, r.name || "", r.email || "",
    r.presentDays ?? 0,
    r.statusBreakdown?.absent  ?? 0,
    r.statusBreakdown?.late    ?? 0,
    r.statusBreakdown?.halfday ?? 0,
    r.statusBreakdown?.leave   ?? 0,
    r.totalDays ?? 0,
    Number(r.attendancePercentage || 0).toFixed(1),
  ]);
  const csv  = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ── Stat Card ── */
const StatCard = ({ label, value, subtext, color, bg, icon }) => (
  <div style={{
    background: bg, borderRadius: 14, padding: "18px 20px",
    border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    flex: 1, minWidth: 130,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: `color-mix(in srgb, ${color} 13%, transparent)`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 20, color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
      {subtext && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{subtext}</div>}
    </div>
  </div>
);

/* ── Attendance mini progress bar ── */
const AttPct = ({ pct }) => {
  const n   = Number(pct || 0);
  const col = pctColor(n);
  const bg  = pctBg(n);
  const bdr = pctBorder(n);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{
          display: "inline-block", padding: "2px 9px", borderRadius: 20,
          background: bg, color: col, border: `1px solid ${bdr}`,
          fontWeight: 800, fontSize: 12,
        }}>
          {n.toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden", width: 90 }}>
        <div style={{
          height: "100%", width: `${Math.min(n, 100)}%`,
          background: col, borderRadius: 99,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
};

/* ── Status number cell ── */
const Num = ({ value, color }) => (
  <span style={{ fontWeight: 700, fontSize: 13, color: value > 0 ? color : C.textMuted }}>
    {value ?? 0}
  </span>
);

/* ════════════════════════════════════════════ */
const MonthlyReportPage = () => {
  const dispatch = useDispatch();

  const { monthlyReport = [], reportLoading } = useSelector((s) => s.attendance || {});
  const { schoolClasses = [] }               = useSelector((s) => s.schoolClass || {});
  const { schools = [] }                     = useSelector((s) => s.school || {});
  const { user }                             = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }             = useSelector((s) => s.academicYear || {});

  const isSuperAdmin = user?.role?.name === "Super Admin";
  const [saSchoolId,  setSaSchoolId]  = useState(null);
  const schoolId = isSuperAdmin ? saSchoolId : (user?.school?._id || null);

  const [month,     setMonth]     = useState(dayjs());
  const [role,      setRole]      = useState("student");
  const [classId,   setClassId]   = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [page,      setPage]      = useState(1);
  const [sortAsc,   setSortAsc]   = useState(null); // null | true | false

  const academicYearId = selectedAcademicYear?._id || null;

  const schoolOptions = useMemo(
    () => schools.map((s) => ({ value: s._id, label: s.name })).filter((s) => s.label),
    [schools],
  );

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  const selectedClass  = classes.find((c) => c._id === classId);
  const classOptions   = classes.map((c) => ({ value: c._id, label: c.name }));
  const sectionOptions = selectedClass?.sections?.map((s) => ({ value: s._id, label: s.name })) || [];

  useEffect(() => { if (isSuperAdmin) dispatch(fetchSchools()); }, [isSuperAdmin, dispatch]);

  useEffect(() => {
    if (role === "student" && schoolId) {
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    }
  }, [role, schoolId, academicYearId, dispatch]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    const total = monthlyReport.length;
    const avg   = total > 0
      ? (monthlyReport.reduce((a, b) => a + (b.attendancePercentage || 0), 0) / total).toFixed(1)
      : 0;
    const low    = monthlyReport.filter((r) => (r.attendancePercentage || 0) < 75).length;
    const high   = monthlyReport.filter((r) => (r.attendancePercentage || 0) >= 90).length;
    const absent = monthlyReport.reduce((a, b) => a + (b.statusBreakdown?.absent || 0), 0);
    return { total, avg, low, high, absent };
  }, [monthlyReport]);

  /* ── Sorted & paginated data ── */
  const sorted = useMemo(() => {
    if (sortAsc === null) return monthlyReport;
    return [...monthlyReport].sort((a, b) => {
      const diff = (a.attendancePercentage || 0) - (b.attendancePercentage || 0);
      return sortAsc ? diff : -diff;
    });
  }, [monthlyReport, sortAsc]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleGenerate = () => {
    if (!schoolId) return message.error("Please select a school first");
    setPage(1);
    setSortAsc(null);
    dispatch(fetchMonthlyReport({
      schoolId,
      month:         month.month() + 1,
      year:          month.year(),
      role,
      schoolClassId: role === "student" ? classId    : undefined,
      sectionId:     role === "student" ? sectionId  : undefined,
    }));
  };

  const toggleSort = () => {
    setSortAsc((prev) => (prev === null ? false : prev === false ? true : null));
    setPage(1);
  };

  const sortLabel = sortAsc === null ? "↕" : sortAsc ? "↑" : "↓";

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Monthly Attendance Report"
        subtitle={`${role.charAt(0).toUpperCase() + role.slice(1)} attendance summary for ${month.format("MMMM YYYY")}`}
        icon={<FileTextOutlined />}
        extra={
          monthlyReport.length > 0 && (
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportCSV(monthlyReport, `attendance_${role}_${month.format("YYYY-MM")}.csv`)}
              style={{ borderColor: C.border, borderRadius: 8 }}
            >
              Export CSV
            </Button>
          )
        }
      />

      {/* ── Filter Panel ── */}
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>

          {isSuperAdmin && (
            <div>
              <FL>School</FL>
              <Select
                showSearch placeholder="Select school" style={{ width: "100%" }}
                value={saSchoolId || undefined} options={schoolOptions} allowClear
                filterOption={(inp, opt) => opt.label.toLowerCase().includes(inp.toLowerCase())}
                onChange={(val) => { setSaSchoolId(val || null); setClassId(null); setSectionId(null); }}
                suffixIcon={<BankOutlined />}
              />
            </div>
          )}

          <div>
            <FL>Month</FL>
            <DatePicker picker="month" style={{ width: "100%" }} value={month} onChange={(v) => setMonth(v || dayjs())} />
          </div>

          <div>
            <FL>Role</FL>
            <Select
              style={{ width: "100%" }} value={role} options={ROLE_OPTIONS}
              onChange={(v) => { setRole(v); setClassId(null); setSectionId(null); }}
            />
          </div>

          <div>
            <FL>Class</FL>
            <Select
              placeholder="All classes" style={{ width: "100%" }} allowClear
              disabled={role !== "student" || !schoolId}
              value={classId || undefined} options={classOptions}
              onChange={(v) => { setClassId(v || null); setSectionId(null); }}
            />
          </div>

          <div>
            <FL>Section</FL>
            <Select
              placeholder="All sections" style={{ width: "100%" }} allowClear
              disabled={!classId || role !== "student"}
              value={sectionId || undefined} options={sectionOptions}
              onChange={(v) => setSectionId(v || null)}
            />
          </div>

          <div>
            <FL>&nbsp;</FL>
            <Button
              type="primary" icon={<SearchOutlined />} style={{ width: "100%" }}
              loading={reportLoading} disabled={!schoolId}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {monthlyReport.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <StatCard
            label="Total"
            value={summary.total}
            color={C.primary} bg={C.primaryLighter}
            icon={<TeamOutlined />}
            subtext={`${role}s`}
          />
          <StatCard
            label="Avg. Attendance"
            value={`${summary.avg}%`}
            color={C.accent} bg={C.accentLight}
            icon={<FileTextOutlined />}
            subtext="class average"
          />
          <StatCard
            label="Excellent (≥90%)"
            value={summary.high}
            color={C.success} bg={C.successLight}
            icon={<TrophyOutlined />}
            subtext="high performers"
          />
          <StatCard
            label="At Risk (<75%)"
            value={summary.low}
            color={C.danger} bg={C.dangerLight}
            icon={<WarningOutlined />}
            subtext="need attention"
          />
          <StatCard
            label="Total Absences"
            value={summary.absent}
            color={C.warning} bg={C.warningLight}
            icon={<CloseCircleOutlined />}
            subtext="across all"
          />
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ ...sectionPanel, marginTop: 14, overflow: "hidden", padding: 0 }}>
        {!schoolId && !reportLoading ? (
          <div style={{ padding: 40 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: C.textMuted }}>
                  {isSuperAdmin
                    ? "Select a school, pick a month and click Generate"
                    : "Pick a month and click Generate to view the report"}
                </span>
              }
            />
          </div>
        ) : (
          <Spin spinning={reportLoading}>

            {/* Table header bar */}
            {monthlyReport.length > 0 && (
              <div style={{
                padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {month.format("MMMM YYYY")} ·{" "}
                  <span style={{ color: C.primary }}>{monthlyReport.length}</span>{" "}
                  <span style={{ color: C.textSub, fontWeight: 400 }}>records</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "≥90%",  color: C.success, count: summary.high },
                    { label: "75-89%", color: C.warning, count: summary.total - summary.high - summary.low },
                    { label: "<75%",  color: C.danger,  count: summary.low  },
                  ].map(({ label, color, count }) => (
                    <span key={label} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99,
                      background: `color-mix(in srgb, ${color} 9%, transparent)`, color, fontWeight: 700, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
                    }}>
                      {label} · {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surfaceSoft }}>
                    {[
                      { label: "#",          w: 44 },
                      { label: "Student",    w: undefined },
                      { label: "Present",    w: 80, color: C.success },
                      { label: "Absent",     w: 80, color: C.danger  },
                      { label: "Late",       w: 70, color: C.warning },
                      { label: "Half Day",   w: 80, color: C.purple  },
                      { label: "Leave",      w: 70, color: C.cyan    },
                      { label: "Total",      w: 65 },
                      { label: "Attendance", w: 130, sortable: true },
                    ].map(({ label, w, color, sortable }) => (
                      <th
                        key={label}
                        onClick={sortable ? toggleSort : undefined}
                        style={{
                          padding: "11px 14px", textAlign: "left",
                          fontSize: 11, fontWeight: 700,
                          color: color || C.textSub,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          borderBottom: `2px solid ${C.border}`,
                          whiteSpace: "nowrap", width: w,
                          cursor: sortable ? "pointer" : "default",
                          userSelect: "none",
                        }}
                      >
                        {label}
                        {sortable && (
                          <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 13 }}>{sortLabel}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 && !reportLoading ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "40px 0", textAlign: "center" }}>
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span style={{ color: C.textMuted }}>
                              No records found — try different filters
                            </span>
                          }
                        >
                          <Button type="primary" onClick={handleGenerate} loading={reportLoading}>
                            Generate Report
                          </Button>
                        </Empty>
                      </td>
                    </tr>
                  ) : pageData.map((row, idx) => {
                    const n          = Number(row.attendancePercentage || 0);
                    const isLow      = n < 75;
                    const isHigh     = n >= 90;
                    const rowBg      = isLow ? `color-mix(in srgb, ${C.danger} 2%, transparent)` : isHigh ? `color-mix(in srgb, ${C.success} 2%, transparent)` : "transparent";
                    const { bg, color } = avatarColor(row.name || "?");
                    const initial    = (row.name || "?")[0].toUpperCase();
                    const globalIdx  = (page - 1) * PAGE_SIZE + idx + 1;

                    return (
                      <tr
                        key={row.userId || idx}
                        style={{ borderBottom: `1px solid ${C.border}`, background: rowBg, transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceSoft)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                      >
                        {/* # */}
                        <td style={{ padding: "11px 14px", color: C.textMuted, fontSize: 12, fontWeight: 600 }}>
                          {globalIdx}
                        </td>

                        {/* Name */}
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                              background: bg, color, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontWeight: 800, fontSize: 13,
                            }}>
                              {initial}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{row.name || "—"}</div>
                              {row.email && <div style={{ fontSize: 11, color: C.textMuted }}>{row.email}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Present */}
                        <td style={{ padding: "11px 14px" }}>
                          <Num value={row.presentDays} color={C.success} />
                        </td>

                        {/* Absent */}
                        <td style={{ padding: "11px 14px" }}>
                          <Num value={row.statusBreakdown?.absent} color={C.danger} />
                        </td>

                        {/* Late */}
                        <td style={{ padding: "11px 14px" }}>
                          <Num value={row.statusBreakdown?.late} color={C.warning} />
                        </td>

                        {/* Half Day */}
                        <td style={{ padding: "11px 14px" }}>
                          <Num value={row.statusBreakdown?.halfday} color={C.purple} />
                        </td>

                        {/* Leave */}
                        <td style={{ padding: "11px 14px" }}>
                          <Num value={row.statusBreakdown?.leave} color={C.cyan} />
                        </td>

                        {/* Total */}
                        <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 13, color: C.textSub }}>
                          {row.totalDays ?? 0}
                        </td>

                        {/* Attendance % with progress bar */}
                        <td style={{ padding: "11px 14px" }}>
                          <AttPct pct={n} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: "12px 20px", borderTop: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    size="small" disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{ borderRadius: 6 }}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} style={{ padding: "0 4px", lineHeight: "24px", color: C.textMuted, fontSize: 12 }}>…</span>
                      ) : (
                        <Button
                          key={p}
                          size="small"
                          type={p === page ? "primary" : "default"}
                          onClick={() => setPage(p)}
                          style={{ borderRadius: 6, minWidth: 28 }}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    size="small" disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ borderRadius: 6 }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Spin>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
