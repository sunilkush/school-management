import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { App, Button, Empty, Select, Skeleton } from "antd";
import {
  BookOutlined, CalendarOutlined,
  ReloadOutlined, ScheduleOutlined,
} from "@ant-design/icons";
import {
  fetchChildTimetable,
  fetchTimetableMasterData,
} from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getName, schoolIdFromUser, DAYS } from "./timetableUi";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel,
  statCard, statLabel, statValue, statGrid,
} from "../../styles/pageStyles";

const STAT_COLORS = ["var(--primary)", "var(--accent)", "var(--success)", "var(--warning)"];

const today = DAYS[new Date().getDay() - 1] || "";

export default function ParentChildTimetablePage() {
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const { user }               = useSelector((s) => s.auth);
  const selectedAcademicYear   = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const { timeSlots, childTimetable, loading, children } = useSelector(
    (s) => s.timetable,
  );

  const [studentId, setStudentId] = useState("");

  const schoolId      = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;

  /* ── Fetch children + master data on mount ──
     Only schoolId is required here: the children list doesn't depend on
     an academic year existing, so it must not be blocked by a school
     that hasn't had one activated yet (timeSlots alone needs it, and is
     fetched conditionally inside fetchTimetableMasterData). */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(
      fetchTimetableMasterData({
        schoolId,
        academicYearId,
        parentId: user?._id,
        includeClasses: false,
        includeSections: false,
        includeChildren: true,
      }),
    ).unwrap().catch(() => {});
  }, [dispatch, schoolId, academicYearId, user?._id]);

  /* ── Auto-select first child ── */
  useEffect(() => {
    if (!studentId && children.length) {
      setStudentId(children[0]._id);
    }
  }, [children, studentId]);

  /* ── Auto-load timetable when child changes ── */
  useEffect(() => {
    if (!studentId || !academicYearId) return;
    dispatch(fetchChildTimetable({ studentId, academicYearId }))
      .unwrap()
      .catch(() => {});
  }, [dispatch, studentId, academicYearId]);

  const handleRefresh = () => {
    if (!studentId || !academicYearId) {
      message.warning("Select a child first");
      return;
    }
    dispatch(fetchChildTimetable({ studentId, academicYearId }))
      .unwrap()
      .catch(() => message.error("Failed to load timetable"));
  };

  /* ── Stats from timetable data ── */
  const stats = useMemo(() => {
    const totalSlots    = timeSlots.length * DAYS.length;
    const filledPeriods = childTimetable.length;
    const subjects      = new Set(
      childTimetable
        .filter((e) => !["break", "lunch", "assembly"].includes(e.type))
        .map((e) => getName(e.subjectId, null))
        .filter(Boolean),
    ).size;
    const todayPeriods = childTimetable.filter((e) => e.dayOfWeek === today).length;

    return { filledPeriods, subjects, todayPeriods, totalSlots };
  }, [childTimetable, timeSlots]);

  const statMeta = [
    { key: "periods",  label: "Total Periods / Week", value: stats.filledPeriods, icon: <CalendarOutlined /> },
    { key: "subjects", label: "Subjects",             value: stats.subjects,      icon: <BookOutlined />     },
    { key: "today",    label: "Today's Classes",      value: stats.todayPeriods,  icon: <ScheduleOutlined /> },
    { key: "free",     label: "Free Slots / Week",    value: Math.max(0, stats.totalSlots - stats.filledPeriods), icon: <CalendarOutlined /> },
  ];

  return (
    <>
      <PageHeader
        title="Child Timetable"
        subtitle="View your child's active weekly class schedule."
        icon={<ScheduleOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              placeholder="Select child"
              value={studentId || undefined}
              onChange={setStudentId}
              loading={loading && !childTimetable.length}
              style={{ minWidth: 220 }}
              options={children.map((c) => ({
                value: c._id,
                label: c.name || getName(c.userId, "Student"),
              }))}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={handleRefresh}
              disabled={!studentId}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div style={pageWrapper}>
        {/* Stats — only show when data is loaded */}
        {childTimetable.length > 0 && (
          <div className="stat-grid" style={statGrid(160)}>
            {statMeta.map(({ key, label, value, icon }, i) => (
              <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
                <div>
                  <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                  <div style={statValue(STAT_COLORS[i])}>{value}</div>
                </div>
                <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}>{icon}</div>
              </div>
            ))}
          </div>
        )}

        {/* Timetable grid */}
        <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <CalendarOutlined style={{ color: "var(--primary)", fontSize: 16 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              Weekly Schedule
            </span>
            {today && (
              <span style={{
                marginLeft: "auto",
                fontSize: 11, fontWeight: 700,
                color: "var(--primary)",
                background: "var(--primary-light)",
                border: "1px solid var(--primary-light)",
                borderRadius: 20,
                padding: "2px 10px",
              }}>
                Today: {today.charAt(0).toUpperCase() + today.slice(1)}
              </span>
            )}
          </div>

          <div style={{ padding: 16 }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : !studentId ? (
              <Empty description="Select a child to view the timetable" />
            ) : !childTimetable.length && !timeSlots.length ? (
              <Empty description="No timetable data available for this child" />
            ) : (
              <TimetableGrid
                timeSlots={timeSlots}
                entries={childTimetable}
                readOnly
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
