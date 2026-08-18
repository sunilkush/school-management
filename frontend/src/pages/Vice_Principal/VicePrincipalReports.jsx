import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Skeleton, Empty, Tag } from "antd";
import {
  Users, GraduationCap, BookOpen, UserCheck,
  FileBarChart2, TrendingUp, ChevronDown, BarChart3,
} from "lucide-react";
import { fetchAllAcademicYears, fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { fetchSchoolReports } from "../../features/reportSlice";
import PageHeader from "../../components/layout/PageHeader";
import { CATEGORICAL_COLORS } from "../../utils/colorPalette";

/* ── Tokens ─────────────────────────────────────────────────── */
const tk = {
  card:       "var(--surface)",
  cardBorder: "var(--border)",
  sectionBg:  "var(--surface-soft)",
  textPri:    "var(--text-primary)",
  textSec:    "var(--text-secondary)",
  shadow:     "var(--shadow-soft)",
  divider:    "var(--border)",
  rowHover:   "var(--surface-soft)",
  barBg:      "var(--surface-soft)",
};

/* ── KPI Card ───────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, color, bg }) => {
  const t = tk;
  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: t.shadow,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: bg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: t.textPri, lineHeight: 1.2 }}>
          {value ?? "—"}
        </div>
        <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
};

/* ── Horizontal bar chart ───────────────────────────────────── */
const BarList = ({ title, rows, colorFn }) => {
  const t = tk;
  const maxVal = Math.max(...rows.map((r) => r.count || 0), 1);
  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 14,
      padding: "20px",
      boxShadow: t.shadow,
      height: "100%",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri, marginBottom: 16 }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row, i) => {
            const pct = Math.round((row.count / maxVal) * 100);
            const color = colorFn(i);
            return (
              <div key={row._id || i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: t.textPri, fontWeight: 500 }}>{row._id || "Unknown"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{row.count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: t.barBg, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 53%, transparent), ${color})`,
                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Gender donut-style card ────────────────────────────────── */
const GenderCard = ({ genderStats }) => {
  const t = tk;
  const male   = genderStats?.male   || 0;
  const female = genderStats?.female || 0;
  const other  = genderStats?.other  || 0;
  const total  = male + female + other || 1;

  const slices = [
    { label: "Male",   value: male,   color: "var(--purple)" },
    { label: "Female", value: female, color: "var(--pink)" },
    { label: "Other",  value: other,  color: "var(--warning)" },
  ].filter((s) => s.value > 0);

  return (
    <div style={{
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: t.shadow,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri, marginBottom: 16 }}>
        Gender Distribution
      </div>
      {/* Progress-bar style */}
      <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", marginBottom: 16 }}>
        {slices.map((s) => (
          <div key={s.label} style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
            transition: "width 0.8s ease",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 12, color: t.textSec }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.textPri }}>
              {s.value} ({Math.round((s.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Section table ──────────────────────────────────────────── */
const SectionTable = ({ rows }) => {
  const t = tk;
  if (!rows?.length) return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 14, padding: 20, boxShadow: t.shadow,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri, marginBottom: 16 }}>Section Breakdown</div>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No section data" />
    </div>
  );

  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 14, padding: 20, boxShadow: t.shadow,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri, marginBottom: 16 }}>Section Breakdown</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Section", "Students"].map((h) => (
                <th key={h} style={{
                  fontSize: 11, fontWeight: 600, color: t.textSec,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  padding: "8px 12px", borderBottom: `1px solid ${t.divider}`,
                  textAlign: "left",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row._id || i} style={{ transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "10px 12px", fontSize: 13, color: t.textPri, borderBottom: `1px solid ${t.divider}` }}>
                  {row._id || "—"}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.divider}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 4, width: Math.min((row.count / 40) * 80, 80), borderRadius: 99, background: "var(--purple)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>{row.count}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────── */
const VicePrincipalReports = () => {
  const dispatch  = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const { schoolReports, loading } = useSelector((state) => state.reports || {});
  const { academicYears = [], activeYear } = useSelector((state) => state.academicYear || {});

  const schoolId = user?.school?._id;
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState();

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (activeYear?._id && !selectedAcademicYearId)
      setSelectedAcademicYearId(activeYear._id);
  }, [activeYear, selectedAcademicYearId]);

  useEffect(() => {
    if (!schoolId || !selectedAcademicYearId) return;
    dispatch(fetchSchoolReports({ schoolId, academicYearId: selectedAcademicYearId }));
  }, [dispatch, schoolId, selectedAcademicYearId]);

  const summary    = schoolReports?.summary || {};
  const roleWise   = schoolReports?.roleWise || [];
  const classWise  = schoolReports?.classWise || [];
  const sectionWise= schoolReports?.sectionWise || [];
  // Backend returns genderStats as an aggregate array ([{ _id: "Male", count }, ...]),
  // same shape as roleWise/classWise — not a { male, female, other } object.
  const genderStatsList = schoolReports?.genderStats || [];
  const genderStats = {
    male: genderStatsList.find((g) => g._id === "Male")?.count || 0,
    female: genderStatsList.find((g) => g._id === "Female")?.count || 0,
    other: genderStatsList.find((g) => g._id === "Other")?.count || 0,
  };

  const kpis = [
    { icon: Users,       label: "Total Students",  value: summary.studentCount, color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.12)" },
    { icon: GraduationCap, label: "Teachers",      value: summary.teacherCount, color: "var(--accent)", bg: "rgba(var(--accent-rgb), 0.12)" },
    { icon: UserCheck,   label: "Parents",          value: summary.parentCount,  color: "var(--warning)", bg: "rgba(var(--warning-rgb), 0.12)" },
    { icon: BookOpen,    label: "Admin Staff",      value: summary.adminCount,   color: "var(--success)", bg: "rgba(var(--success-rgb), 0.12)" },
  ];

  const selectedYear = academicYears.find((y) => y._id === selectedAcademicYearId);

  return (
    <>
      <PageHeader
        title="VP Reports"
        subtitle="Academic and operational snapshot for the selected year"
        icon={<FileBarChart2 size={18} />}
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {selectedYear && (
              <Tag color="purple" style={{ borderRadius: 99, padding: "3px 10px", fontSize: 11 }}>
                {selectedYear.name}
              </Tag>
            )}
            <Select
              style={{ width: 220 }}
              placeholder="Select Academic Year"
              value={selectedAcademicYearId}
              onChange={setSelectedAcademicYearId}
              suffixIcon={<ChevronDown size={13} />}
              options={academicYears.map((y) => ({
                value: y._id,
                label: `${y.name}${activeYear?._id === y._id ? " ★" : ""}`,
              }))}
            />
          </div>
        }
      />

      <div style={{ padding: "clamp(12px,3vw,24px)", display: "flex", flexDirection: "column", gap: 16 }}>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              {[1,2,3,4].map((i) => <Skeleton.Button key={i} active style={{ flex: 1, height: 80, borderRadius: 14 }} />)}
            </div>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : !schoolReports?.academicYear ? (
          <div style={{
            background: tk.card,
            border: `1px solid ${tk.cardBorder}`,
            borderRadius: 14,
            padding: 40,
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: tk.textSec }}>
                  No report data available for the selected academic year
                </span>
              }
            />
          </div>
        ) : (
          <>
            {/* ── KPI row ── */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Gender ── */}
            <GenderCard genderStats={genderStats} />

            {/* ── Role-wise + Class-wise ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <BarList
                title="Users by Role"
                rows={roleWise}
                colorFn={(i) => CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}
              />
              <BarList
                title="Students by Class"
                rows={classWise}
                colorFn={(i) => CATEGORICAL_COLORS[(i + 3) % CATEGORICAL_COLORS.length]}
              />
            </div>

            {/* ── Section breakdown ── */}
            <SectionTable rows={sectionWise} />
          </>
        )}
      </div>
    </>
  );
};

export default VicePrincipalReports;
