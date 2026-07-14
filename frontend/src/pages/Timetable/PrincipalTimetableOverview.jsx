import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
<<<<<<< HEAD
import { Select, Skeleton, Empty, Tag } from "antd";
import {
  CalendarClock,
  Users,
  BookOpen,
  LayoutGrid,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
=======
import { Select, Skeleton, Empty, Button, App } from "antd";
import {
  CalendarOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  TeamOutlined,
  BookOutlined,
  ApartmentOutlined,
  FilterOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
>>>>>>> 25f649612820593646436c4bbf49f790346031e0
import {
  fetchTimetable,
  fetchTimetableMasterData,
} from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getId, getName, schoolIdFromUser } from "./timetableUi";
<<<<<<< HEAD
import { useTheme } from "../../context/ThemeContext";
import PageHeader from "../../components/layout/PageHeader";
=======
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, statGrid, sectionPanel, iconWell } from "../../styles/pageStyles";

/* ── KPI card ─────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, color, sub }) => (
  <div
    style={{
      background: "var(--surface)",
      borderRadius: 14,
      border: "1px solid var(--border-muted)",
      borderLeft: `4px solid ${color}`,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);
>>>>>>> 25f649612820593646436c4bbf49f790346031e0

/* ── Tokens ─────────────────────────────────────────────────── */
const tk = (isDark) => ({
  bg:         isDark ? "#0F1623" : "#F8FAFF",
  card:       isDark ? "#141C2E" : "#FFFFFF",
  cardBorder: isDark ? "#1E2A3B" : "#E2E8F0",
  statBg:     isDark ? "#1A2438" : "#FFFFFF",
  accent:     "#6366F1",
  accent2:    "#14B8A6",
  accent3:    "#F59E0B",
  accent4:    "#22C55E",
  textPri:    isDark ? "#E8EDF7" : "#0F172A",
  textSec:    isDark ? "#64748B" : "#64748B",
  shadow:     isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(37,99,235,0.07)",
  inputBg:    isDark ? "#1A2438" : "#F1F5F9",
  inputBorder:isDark ? "#2A3550" : "#E2E8F0",
});

/* ── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, bg, isDark }) => {
  const t = tk(isDark);
  return (
    <div style={{
      background: t.statBg,
      border: `1px solid ${t.cardBorder}`,
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
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: t.textPri, lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
};

/* ── Filter Select ──────────────────────────────────────────── */
const FilterSelect = ({ placeholder, options, onChange, value, isDark }) => {
  const t = tk(isDark);
  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      suffixIcon={<ChevronDown size={13} color={t.textSec} />}
      style={{ width: "100%", minWidth: 160 }}
      styles={{
        popup: { root: { borderRadius: 10 } }
      }}
    />
  );
};

/* ── Main ───────────────────────────────────────────────────── */
export default function PrincipalTimetableOverview() {
  const dispatch  = useDispatch();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const {
    timeSlots, entries, loading,
    schoolClasses, sections: allSections, teachers,
  } = useSelector((s) => s.timetable);

  const [filters, setFilters] = useState({});
  const schoolId     = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;

<<<<<<< HEAD
  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchTimetableMasterData({
      schoolId, academicYearId,
      includeRooms: false, includeTeachers: true,
    }));
  }, [dispatch, schoolId, academicYearId]);
=======
  const loadMasterData = () => {
    if (!schoolId || !academicYearId) return;
    dispatch(
      fetchTimetableMasterData({
        schoolId,
        academicYearId,
        includeRooms: true,
        includeTeachers: true,
      }),
    )
      .unwrap()
      .catch(message.error);
  };

  useEffect(() => {
    loadMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, schoolId, academicYearId, message]);
>>>>>>> 25f649612820593646436c4bbf49f790346031e0

  useEffect(() => {
    if (schoolId && academicYearId)
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
  }, [dispatch, schoolId, academicYearId, filters]);

<<<<<<< HEAD
  const workload = useMemo(() =>
    entries.reduce((m, e) => {
      const k = getId(e.teacherId);
      if (k) m[k] = (m[k] || 0) + 1;
      return m;
    }, {}),
  [entries]);

  const sections = allSections.filter(
    (s) => !filters.schoolClassId || getId(s.schoolClassId) === filters.schoolClassId,
  );

  const stats = [
    { icon: CalendarClock, label: "Scheduled Periods", value: entries.length, color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
    { icon: Users,         label: "Teachers Scheduled", value: Object.keys(workload).length, color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
    { icon: BookOpen,      label: "Classes",            value: schoolClasses.length, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    { icon: AlertCircle,   label: "Conflicts",          value: 0, color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  ];

  return (
    <>
      <PageHeader
        title="Timetable Overview"
        subtitle="View class, section, and teacher schedules across the school"
        icon={<LayoutGrid size={18} />}
        extra={
          selectedAcademicYear && (
            <Tag color="purple" style={{ borderRadius: 99, padding: "3px 10px", fontSize: 11 }}>
              {selectedAcademicYear.name}
            </Tag>
          )
        }
      />

      <div style={{ padding: "clamp(12px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {stats.map((s) => (
            <StatCard key={s.label} {...s} isDark={isDark} />
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          boxShadow: t.shadow,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.textSec, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Filter by
          </div>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 160px" }}>
              <FilterSelect
                placeholder="All Classes"
                isDark={isDark}
                onChange={(v) => setFilters({ schoolClassId: v, sectionId: undefined })}
                options={schoolClasses.map((c) => ({ value: c._id, label: getName(c) }))}
              />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <FilterSelect
                placeholder="All Sections"
                isDark={isDark}
                value={filters.sectionId}
                onChange={(v) => setFilters((f) => ({ ...f, sectionId: v }))}
                options={sections.map((s) => ({ value: s._id, label: getName(s) }))}
              />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <FilterSelect
                placeholder="All Teachers"
                isDark={isDark}
                onChange={(v) => setFilters((f) => ({ ...f, teacherId: v }))}
                options={teachers.map((t) => ({ value: t._id, label: getName(t) }))}
              />
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 14,
          padding: 20,
          boxShadow: t.shadow,
          overflowX: "auto",
        }}>
          {!academicYearId ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: t.textSec }}>Select an academic year to view the timetable</span>
=======
  const loadAll = () => {
    loadMasterData();
    if (schoolId && academicYearId)
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
  };

  const workload = useMemo(
    () =>
      entries.reduce((m, e) => {
        const k = getId(e.teacherId);
        if (k) m[k] = (m[k] || 0) + 1;
        return m;
      }, {}),
    [entries],
  );

  const masters = useMemo(
    () => ({ classes: schoolClasses, sections: allSections, teachers }),
    [schoolClasses, allSections, teachers],
  );
  const sectionOptions = masters.sections.filter(
    (s) =>
      !filters.schoolClassId ||
      getId(s.schoolClassId) === filters.schoolClassId,
  );
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Timetable Overview"
        subtitle="View class, section, and teacher schedules with workload summaries"
        icon={<CalendarOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadAll} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "20px" }}>
        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <div style={statGrid(180)}>
          <KpiCard
            label="Scheduled Periods" value={entries.length}
            icon={<ScheduleOutlined />} color="#2563EB"
          />
          <KpiCard
            label="Classes" value={masters.classes.length}
            icon={<BookOutlined />} color="#14B8A6"
          />
          <KpiCard
            label="Sections" value={masters.sections.length}
            icon={<ApartmentOutlined />} color="#F59E0B"
          />
          <KpiCard
            label="Teachers Scheduled" value={Object.keys(workload).length}
            icon={<TeamOutlined />} color="#7C3AED"
            sub={`of ${masters.teachers.length} total`}
          />
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div style={{ ...sectionPanel, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={iconWell("#2563EB", 28)}><FilterOutlined style={{ fontSize: 12 }} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Filter Schedule</span>
            {hasFilters && (
              <Button
                type="text" size="small" icon={<CloseCircleOutlined />}
                onClick={() => setFilters({})}
                style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}
              >
                Clear
              </Button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Class"
              value={filters.schoolClassId}
              onChange={(v) =>
                setFilters({ schoolClassId: v, sectionId: undefined })
>>>>>>> 25f649612820593646436c4bbf49f790346031e0
              }
              style={{ padding: "40px 0" }}
            />
<<<<<<< HEAD
          ) : loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} active title={false} paragraph={{ rows: 1, width: "100%" }} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: t.textSec }}>No timetable entries found for the selected filters</span>
              }
              style={{ padding: "40px 0" }}
            />
=======
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Section"
              value={filters.sectionId}
              onChange={(v) => setFilters((f) => ({ ...f, sectionId: v }))}
              options={sectionOptions.map((s) => ({
                value: s._id,
                label: getName(s),
              }))}
            />
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Teacher"
              value={filters.teacherId}
              onChange={(v) => setFilters((f) => ({ ...f, teacherId: v }))}
              options={masters.teachers.map((t) => ({
                value: t._id,
                label: getName(t),
              }))}
            />
          </div>
        </div>

        {/* ── Weekly Grid ────────────────────────────────────────── */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={iconWell("#14B8A6", 28)}><ScheduleOutlined style={{ fontSize: 12 }} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Weekly Schedule</span>
          </div>
          {!academicYearId ? (
            <Empty description="Select an academic year to view the timetable" />
          ) : loading ? (
            <Skeleton active />
>>>>>>> 25f649612820593646436c4bbf49f790346031e0
          ) : (
            <TimetableGrid timeSlots={timeSlots} entries={entries} readOnly />
          )}
        </div>
<<<<<<< HEAD

      </div>
    </>
=======
      </div>
    </div>
>>>>>>> 25f649612820593646436c4bbf49f790346031e0
  );
}
