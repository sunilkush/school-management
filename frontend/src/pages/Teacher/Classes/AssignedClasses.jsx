<<<<<<< HEAD
import React, { useEffect, useMemo } from "react";
import { Button, Spin, Tooltip } from "antd";
import {
  ReloadOutlined, EyeOutlined, CheckCircleOutlined,
=======
import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Empty, Spin, Input } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  EyeOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReadOutlined,
  AppstoreOutlined,
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
} from "@ant-design/icons";
import {
  BookOpen, Users, GraduationCap, ClipboardCheck, Layers,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";
<<<<<<< HEAD
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
=======
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  pill,
  emptyState,
} from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const ClassCard = ({ cls, onView, onAttendance }) => {
  const sectionNames = cls?.sections?.length
    ? cls.sections.map((sec) => sec?.sectionId?.name).filter(Boolean).join(", ")
    : "N/A";
  const roleLabel = cls?.role?.[0] || "Teacher";
  const isClassTeacher = /class teacher/i.test(roleLabel);

  return (
    <div
      style={{
        ...sectionPanel,
        marginBottom: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: "100%",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
          <div style={iconWell("var(--primary)", 44)}>
            <BookOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              {cls?.name || "Class"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Sections: {sectionNames}
            </div>
          </div>
        </div>
        <span style={pill(
          isClassTeacher ? "#15803D" : "#2E6A9A",
          isClassTeacher ? "rgba(220,252,231,0.5)" : "rgba(219,234,254,0.4)"
        )}>
          {roleLabel}
        </span>
      </div>

      <div style={{ borderTop: "1px solid var(--border-muted)" }} />

      {/* Subjects */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Subjects
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cls?.subjects?.length ? (
            cls.subjects.map((sub, i) => (
              <span key={i} style={pill("#2563EB", "rgba(219,234,254,0.4)")}>
                {sub?.subjectId?.name || "Subject"}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No subjects assigned</span>
          )}
        </div>
      </div>

      {/* Students */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
          <TeamOutlined style={{ color: "var(--text-muted)" }} />
          <span style={{ fontWeight: 700, fontSize: 13 }}>{cls?.studentCount ?? 0} Students</span>
        </div>
        <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>Active</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          onClick={() => onView(cls)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 10,
            border: "none",
            background: "var(--primary)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <EyeOutlined /> View Class
        </button>
        <button
          onClick={() => onAttendance(cls)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid var(--border-muted)",
            background: "var(--surface)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <CalendarOutlined /> Take Attendance
        </button>
      </div>
    </div>
  );
};
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d

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
  const [searchText, setSearchText] = useState("");

<<<<<<< HEAD
  const { classAssignTeacher = [], loading = false } = useSelector((s) => s.class || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
=======
  const { classAssignTeacher = [], loading = false } = useSelector(
    (state) => state.class || {}
  );

  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );

>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(fetchAssignedClasses({ academicYearId }));
  }, [dispatch, academicYearId]);

<<<<<<< HEAD
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
=======
  const stats = useMemo(() => {
    const totalClasses = classAssignTeacher.length;
    const totalStudents = classAssignTeacher.reduce((sum, cls) => sum + Number(cls?.studentCount || 0), 0);
    const totalSections = classAssignTeacher.reduce((sum, cls) => sum + (cls?.sections?.length || 0), 0);
    const totalSubjects = classAssignTeacher.reduce((sum, cls) => sum + (cls?.subjects?.length || 0), 0);
    return { totalClasses, totalStudents, totalSections, totalSubjects };
  }, [classAssignTeacher]);

  const filteredClasses = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return classAssignTeacher;
    return classAssignTeacher.filter((cls) => {
      const name = (cls?.name || "").toLowerCase();
      const sections = (cls?.sections || []).map((sec) => sec?.sectionId?.name || "").join(" ").toLowerCase();
      const subjects = (cls?.subjects || []).map((sub) => sub?.subjectId?.name || "").join(" ").toLowerCase();
      return name.includes(keyword) || sections.includes(keyword) || subjects.includes(keyword);
    });
  }, [classAssignTeacher, searchText]);

  const handleView = (cls) => cls?._id && navigate(`/dashboard/teacher/classes/${cls._id}`);
  const handleAttendance = (cls) =>
    cls?._id &&
    navigate(
      `/dashboard/teacher/attendance/students?classId=${cls._id}&className=${encodeURIComponent(cls?.name || "")}`
    );
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Assigned Classes"
<<<<<<< HEAD
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
=======
        subtitle="Manage your classes, subjects & students easily"
        icon={<ReadOutlined />}
        extra={
          <Input
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by class, section or subject"
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            style={{ width: 260 }}
          />
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<AppstoreOutlined />} label="Classes"  value={stats.totalClasses}  color="#2563EB" />
        <StatCard icon={<TeamOutlined />}      label="Students" value={stats.totalStudents} color="#14B8A6" />
        <StatCard icon={<BookOutlined />}      label="Sections" value={stats.totalSections} color="#F59E0B" />
        <StatCard icon={<ReadOutlined />}       label="Subjects" value={stats.totalSubjects} color="#8B5CF6" />
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
      </div>

      {/* ── Cards ── */}
      <Spin spinning={loading}>
<<<<<<< HEAD
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
=======
        {!loading && filteredClasses.length === 0 ? (
          <div style={emptyState}>
            <Empty
              description={
                searchText
                  ? "No classes match your search"
                  : "No Classes Assigned Yet"
              }
            />
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {filteredClasses.map((cls) => (
              <Col xs={24} sm={12} lg={8} key={cls?._id}>
                <ClassCard cls={cls} onView={handleView} onAttendance={handleAttendance} />
              </Col>
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
