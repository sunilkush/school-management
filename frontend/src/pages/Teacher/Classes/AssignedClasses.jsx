import React, { useEffect, useMemo } from "react";
import { Button, Spin, Tooltip } from "antd";
import {
  ReloadOutlined, EyeOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import {
  BookOpen, Users, GraduationCap, ClipboardCheck, Layers,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper, statGrid, statCard, statLabel, statValue, emptyState, pill,
} from "../../../styles/pageStyles.js";

/* ── Per-card accent palette (cycles) ──────────────────────────────── */
const ACCENTS = [
  { color: "#6366f1", bg: "#6366f115", bar: "#6366f1" },
  { color: "#0ea5e9", bg: "#0ea5e915", bar: "#0ea5e9" },
  { color: "#10b981", bg: "#10b98115", bar: "#10b981" },
  { color: "#f59e0b", bg: "#f59e0b15", bar: "#f59e0b" },
  { color: "#ec4899", bg: "#ec489915", bar: "#ec4899" },
  { color: "#8b5cf6", bg: "#8b5cf615", bar: "#8b5cf6" },
];
const accent = (i) => ACCENTS[i % ACCENTS.length];

/* ── Stat card ──────────────────────────────────────────────────────── */
const Stat = ({ icon: Icon, label, value, color }) => (
  <div style={statCard({ color, bg: "var(--surface)", accentBar: color })}>
    <div>
      <div style={statLabel(color)}>{label}</div>
      <div style={statValue(color)}>{value}</div>
    </div>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={20} color={color} strokeWidth={1.8} />
    </div>
  </div>
);

/* ── Class card ─────────────────────────────────────────────────────── */
const ClassCard = ({ cls, index, navigate }) => {
  const a = accent(index);
  const sections = (cls?.sections || [])
    .map((s) => s?.sectionId?.name)
    .filter(Boolean);
  const subjects = (cls?.subjects || [])
    .map((s) => s?.subjectId?.name)
    .filter(Boolean);

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-muted)",
      borderRadius: 18,
      overflow: "hidden",
      transition: "box-shadow 0.2s, transform 0.2s",
      display: "flex",
      flexDirection: "column",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${a.color}25`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: a.color }} />

      <div style={{ padding: "20px 20px 16px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: a.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={22} color={a.color} strokeWidth={1.8} />
            </div>
            {/* Name */}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {cls?.name || "Class"}
              </div>
              {sections.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                  Sections: <span style={{ color: a.color, fontWeight: 600 }}>{sections.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active badge */}
          <span style={{
            ...pill("#10b981", "#10b98118"),
            fontSize: 11, whiteSpace: "nowrap", marginTop: 2,
          }}>
            ● Active
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-muted)", margin: "16px 0 14px" }} />

        {/* Subjects */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
          }}>
            Subjects
          </div>
          {subjects.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {subjects.map((s, i) => (
                <span key={i} style={pill(a.color, a.bg)}>{s}</span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No subjects assigned</span>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: "10px 14px",
          background: "var(--surface-soft)",
          borderRadius: 10,
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Users size={14} color={a.color} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {cls?.studentCount ?? 0}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Students</span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--border-muted)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Layers size={14} color={a.color} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {sections.length || "—"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {sections.length === 1 ? "Section" : "Sections"}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--border-muted)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <GraduationCap size={14} color={a.color} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {subjects.length}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Subjects</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => cls?._id && navigate(`/dashboard/teacher/classes/${cls._id}`)}
            style={{
              flex: 1, padding: "8px 0",
              background: a.color, color: "#fff",
              border: "none", borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <EyeOutlined style={{ fontSize: 13 }} /> View Class
          </button>
          <button
            onClick={() =>
              cls?._id &&
              navigate(
                `/dashboard/teacher/attendance/students?classId=${cls._id}&className=${encodeURIComponent(cls?.name || "")}`
              )
            }
            style={{
              flex: 1, padding: "8px 0",
              background: "var(--surface-soft)", color: a.color,
              border: `1.5px solid ${a.color}40`, borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = a.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
          >
            <ClipboardCheck size={13} strokeWidth={2.2} /> Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────────── */
const AssignedClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { classAssignTeacher = [], loading = false } = useSelector((s) => s.class || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(fetchAssignedClasses({ academicYearId }));
  }, [dispatch, academicYearId]);

  /* Aggregate stats */
  const stats = useMemo(() => {
    const totalSubjects = new Set(
      classAssignTeacher.flatMap((c) =>
        (c.subjects || []).map((s) => s?.subjectId?._id || s?.subjectId?.name)
      )
    ).size;
    const totalStudents = classAssignTeacher.reduce(
      (sum, c) => sum + (c.studentCount || 0), 0
    );
    return {
      classes:  classAssignTeacher.length,
      subjects: totalSubjects,
      students: totalStudents,
    };
  }, [classAssignTeacher]);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Assigned Classes"
        subtitle="Manage your classes, subjects and students"
        icon={<BookOpen size={20} />}
        extra={
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchAssignedClasses({ academicYearId }))}
            />
          </Tooltip>
        }
      />

      {/* ── Stats row ── */}
      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <Stat icon={GraduationCap} label="Classes Assigned" value={stats.classes}  color="#6366f1" />
        <Stat icon={BookOpen}      label="Subjects"          value={stats.subjects} color="#0ea5e9" />
        <Stat icon={Users}         label="Total Students"    value={stats.students} color="#10b981" />
      </div>

      {/* ── Cards ── */}
      <Spin spinning={loading}>
        {!loading && classAssignTeacher.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              No Classes Assigned Yet
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Contact your school admin to get classes assigned to you.
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
            gap: 16,
          }}>
            {classAssignTeacher.map((cls, i) => (
              <ClassCard key={cls?._id || i} cls={cls} index={i} navigate={navigate} />
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
