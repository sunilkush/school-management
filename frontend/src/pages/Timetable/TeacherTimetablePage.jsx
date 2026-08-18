import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { App, Empty, Select, Skeleton } from "antd";
import {
  ScheduleOutlined, InfoCircleOutlined, UserOutlined, CalendarOutlined,
} from "@ant-design/icons";
import {
  fetchMyTeacherTimetable, fetchTimetable, fetchTimetableMasterData,
} from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getName, schoolIdFromUser } from "./timetableUi";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles";

const C = {
  primary: "var(--primary)", primaryLight: "var(--primary-light)", primaryLighter: "var(--primary-light)",
  accent: "var(--accent)", accentLight: "var(--accent-light)",
  border: "var(--border)", text: "var(--text)", textSub: "var(--text-secondary)", textMuted: "var(--text-muted)",
  surface: "var(--surface)",
};

const getRoleName = (user) => {
  const role = user?.roleId || user?.role;
  return (role?.name || role || "").toString().toLowerCase();
};

const getTeacherName = (t = {}) => t?.name || t?.fullName || t?.email || "Unnamed Teacher";

export default function TeacherTimetablePage() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const { timeSlots, myTeacherTimetable, teacherTimetable, loading, teachers } =
    useSelector((s) => s.timetable);
  const schoolId      = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;
  const isSchoolAdmin  = getRoleName(user) === "school admin";
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(
      fetchTimetableMasterData({
        schoolId, academicYearId,
        includeClasses: false, includeSections: false,
        includeTeachers: isSchoolAdmin,
      }),
    ).unwrap().catch(message.error);
  }, [dispatch, schoolId, academicYearId, isSchoolAdmin, message]);

  useEffect(() => {
    if (!isSchoolAdmin || selectedTeacherId || !teachers.length) return;
    setSelectedTeacherId(teachers[0]?._id || "");
  }, [isSchoolAdmin, selectedTeacherId, teachers]);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    if (isSchoolAdmin) {
      if (!selectedTeacherId) return;
      dispatch(fetchTimetable({ schoolId, academicYearId, teacherId: selectedTeacherId }));
      return;
    }
    dispatch(fetchMyTeacherTimetable({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId, isSchoolAdmin, selectedTeacherId]);

  const entries = isSchoolAdmin ? teacherTimetable : myTeacherTimetable;
  const selectedTeacher = useMemo(
    () => teachers.find((t) => t._id === selectedTeacherId),
    [teachers, selectedTeacherId],
  );

  const periodCount = entries.filter((e) => e.type === "regular").length;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title={isSchoolAdmin ? "Teacher Timetable" : "My Teaching Timetable"}
        subtitle={
          isSchoolAdmin
            ? "View weekly teaching schedules for any teacher in your school"
            : "Readonly weekly timetable with today's session highlighted"
        }
        icon={<ScheduleOutlined />}
      />

      {/* Teacher selector panel — admin only */}
      {isSchoolAdmin && (
        <div style={{ ...sectionPanel, margin: "20px 0 16px" }}>
          {/* Info banner */}
          <div style={{
            padding: "11px 14px", borderRadius: 10, marginBottom: 16,
            background: C.primaryLighter, border: "1px solid " + C.primaryLight,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <InfoCircleOutlined style={{ color: C.primary, marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>Read-only view</div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}>
                To modify schedules, use the <strong>Timetable Planner</strong> page.
              </div>
            </div>
          </div>

          {/* Teacher select */}
          <div style={{ marginBottom: selectedTeacher ? 12 : 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7,
            }}>
              Select Teacher
            </div>
            <Select
              value={selectedTeacherId || undefined}
              placeholder="Search and select a teacher…"
              style={{ width: "100%", maxWidth: 400 }}
              onChange={setSelectedTeacherId}
              showSearch
              optionFilterProp="label"
              options={teachers.map((t) => ({
                value: t._id,
                label: getTeacherName(t),
              }))}
              size="large"
            />
          </div>

          {/* Selected teacher chip */}
          {selectedTeacher && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 20,
                background: C.accentLight, border: "1px solid rgba(var(--accent-rgb), 0.5)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: C.accent, color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {getTeacherName(selectedTeacher).charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-hover)" }}>
                  {getName(selectedTeacher, getTeacherName(selectedTeacher))}
                </span>
              </div>
              {periodCount > 0 && (
                <span style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 20,
                  background: "var(--background)", border: "1px solid " + C.border,
                  color: C.textSub, fontWeight: 600,
                }}>
                  {periodCount} period{periodCount !== 1 ? "s" : ""} this week
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timetable grid card */}
      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
        {/* Card header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid " + C.border,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Weekly Schedule</span>
          </div>
          {selectedAcademicYear && (
            <span style={{
              fontSize: 12, padding: "3px 12px", borderRadius: 20,
              background: C.primaryLighter, color: C.primary,
              border: "1px solid " + C.primaryLight, fontWeight: 600,
            }}>
              {selectedAcademicYear.name || selectedAcademicYear.year}
            </span>
          )}
        </div>

        <div style={{ padding: 16 }}>
          {!academicYearId ? (
            <Empty description="Select an academic year first" />
          ) : isSchoolAdmin && !selectedTeacherId ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: C.textSub }}>Select a teacher above to view their timetable</span>
              }
            />
          ) : loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <TimetableGrid timeSlots={timeSlots} entries={entries} readOnly showClass />
          )}
        </div>
      </div>
    </div>
  );
}
