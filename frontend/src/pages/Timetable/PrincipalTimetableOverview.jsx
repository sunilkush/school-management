import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import {
  fetchTimetable,
  fetchTimetableMasterData,
} from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getId, getName, schoolIdFromUser } from "./timetableUi";
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

export default function PrincipalTimetableOverview() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const {
    timeSlots,
    entries,
    loading,
    schoolClasses,
    sections: allSections,
    teachers,
  } = useSelector((s) => s.timetable);
  const [filters, setFilters] = useState({});
  const schoolId = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;

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

  useEffect(() => {
    if (schoolId && academicYearId)
      dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
  }, [dispatch, schoolId, academicYearId, filters]);

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
              }
              options={masters.classes.map((c) => ({
                value: c._id,
                label: getName(c),
              }))}
            />
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
          ) : (
            <TimetableGrid timeSlots={timeSlots} entries={entries} readOnly />
          )}
        </div>
      </div>
    </div>
  );
}
