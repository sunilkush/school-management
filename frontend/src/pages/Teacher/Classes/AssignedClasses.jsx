import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Empty, Input, Row, Segmented, Spin, Tag, Tooltip } from "antd";
import {
  AppstoreOutlined, BookOutlined, CalendarOutlined, EyeOutlined, ReadOutlined, SearchOutlined,
  StarFilled, TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell, pill } from "../../../styles/pageStyles";
import { getRoleName, getRolePath } from "../../../utils/roles";

// "Class 2" before "Class 10": compare the number in the name, then the name.
const classOrder = (a, b) => {
  const n = (s) => { const m = /\d+/.exec(s || ""); return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER; };
  return n(a.name) - n(b.name) || String(a.name).localeCompare(String(b.name));
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="section-panel is-header-strip">
    <div style={iconWell(color, 42)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div className="u-title-lg">{value}</div>
      {sub ? <div className="u-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div> : null}
    </div>
  </div>
);

/**
 * The classes a teacher is assigned to this year. Each class card lists its sections: how many
 * students, which subjects they teach there, whether they are its class teacher, and a button
 * straight to that section's attendance.
 *
 * The card used to print a raw role string ("class_teacher": the check for "class teacher" never
 * matched, so the tag was never the class-teacher one), an "Active" pill that meant nothing, and
 * nothing about the individual sections, although the API sends all of it.
 */
const ClassCard = ({ cls, onView, onAttendance }) => (
  <div
    className="section-panel"
    style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 16, height: "100%", transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
  >
    {/* Header */}
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
        <div style={iconWell("var(--primary)", 46)}><BookOutlined /></div>
        <div style={{ minWidth: 0 }}>
          <div className="u-title">{cls.name || "Class"}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            <TeamOutlined /> {cls.studentCount ?? 0} students · {cls.sections.length} section{cls.sections.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <span style={pill(
        cls.isClassTeacher ? "var(--purple)" : "var(--primary-hover)",
        cls.isClassTeacher ? "rgba(var(--purple-rgb), 0.12)" : "rgba(219,234,254,0.4)",
      )}>
        {cls.isClassTeacher ? <><StarFilled style={{ fontSize: 10 }} /> Class Teacher</> : "Subject Teacher"}
      </span>
    </div>

    {/* Sections */}
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Sections
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cls.sections.map((sec) => {
          const subjects = (sec.subjects || []).map((s) => s.subjectId?.name).filter(Boolean);
          return (
            <div key={sec.sectionId?._id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 12,
              border: "1px solid var(--border-muted)", background: "var(--surface-soft)",
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 15, color: "var(--primary)", background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              }}>{sec.sectionId?.name}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
                  <span><b>{sec.studentCount ?? 0}</b> <span className="u-muted">students</span></span>
                  {sec.isClassTeacher && <Tag color="purple" style={{ margin: 0 }}>Class teacher</Tag>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {subjects.length ? subjects.map((name) => (
                    <span key={name} style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>{name}</span>
                  )) : <span className="u-meta">No subject assigned</span>}
                </div>
              </div>
              <Tooltip title={`Take attendance for ${cls.name}-${sec.sectionId?.name}`}>
                <Button icon={<CalendarOutlined />} onClick={() => onAttendance(cls, sec)} aria-label={`Attendance for section ${sec.sectionId?.name}`} />
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>

    {/* Actions */}
    <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
      <Button type="primary" size="large" block icon={<EyeOutlined />} onClick={() => onView(cls)} style={{ borderRadius: 10, fontWeight: 600 }}>
        View Class
      </Button>
      <Button size="large" block icon={<CalendarOutlined />} onClick={() => onAttendance(cls, cls.sections.length === 1 ? cls.sections[0] : null)} style={{ borderRadius: 10, fontWeight: 600 }}>
        Take Attendance
      </Button>
    </div>
  </div>
);

/* ── Main page ──────────────────────────────────────────────────────── */
const AssignedClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all");

  const { classAssignTeacher = [], loading = false } = useSelector((state) => state.class || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { user } = useSelector((state) => state.auth || {});
  const rolePath = getRolePath(getRoleName(user));
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (academicYearId) dispatch(fetchAssignedClasses({ academicYearId }));
  }, [dispatch, academicYearId]);

  const classes = useMemo(() => [...classAssignTeacher].sort(classOrder).map((cls) => ({
    ...cls,
    sections: [...(cls.sections || [])].sort((a, b) => String(a.sectionId?.name).localeCompare(String(b.sectionId?.name))),
    isClassTeacher: (cls.sections || []).some((s) => s.isClassTeacher),
  })), [classAssignTeacher]);

  const stats = useMemo(() => {
    const sections = classes.flatMap((c) => c.sections.map((s) => ({ ...s, className: c.name })));
    const subjects = new Set(classes.flatMap((c) => (c.subjects || []).map((s) => s.subjectId?.name)).filter(Boolean));
    return {
      classes: classes.length,
      sections: sections.length,
      students: classes.reduce((sum, c) => sum + Number(c.studentCount || 0), 0),
      subjects: subjects.size,
      classTeacherOf: sections.filter((s) => s.isClassTeacher).map((s) => `${s.className}-${s.sectionId?.name}`),
    };
  }, [classes]);

  const shown = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    return classes
      .filter((c) => (filter === "ct" ? c.isClassTeacher : filter === "subject" ? !c.isClassTeacher : true))
      .filter((c) => !kw || [
        c.name,
        ...c.sections.map((s) => s.sectionId?.name),
        ...(c.subjects || []).map((s) => s.subjectId?.name),
      ].join(" ").toLowerCase().includes(kw));
  }, [classes, filter, searchText]);

  const handleView = (cls) => navigate(`/dashboard/${rolePath}/classes/${cls._id}`);
  const handleAttendance = (cls, sec) => {
    const params = new URLSearchParams({ classId: cls._id, className: cls.name || "" });
    if (sec?.sectionId?._id) params.set("sectionId", sec.sectionId._id);
    navigate(`/dashboard/${rolePath}/attendance/students?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Assigned Classes"
        subtitle={selectedAcademicYear?.name ? `Your classes, sections and subjects for ${selectedAcademicYear.name}` : "Your classes, sections and subjects"}
        icon={<ReadOutlined />}
        extra={
          <Input
            allowClear size="large" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by class, section or subject" prefix={<SearchOutlined className="u-muted" />}
            style={{ width: 280 }}
          />
        }
      />

      <div style={{ ...statGrid(190), marginTop: 20 }}>
        <StatCard icon={<AppstoreOutlined />} label="Classes" value={stats.classes} color="var(--primary)"
          sub={stats.classTeacherOf.length ? `Class teacher of ${stats.classTeacherOf.join(", ")}` : undefined} />
        <StatCard icon={<BookOutlined />} label="Sections" value={stats.sections} color="var(--warning)" />
        <StatCard icon={<TeamOutlined />} label="Students" value={stats.students} color="var(--accent)" />
        <StatCard icon={<ReadOutlined />} label="Subjects" value={stats.subjects} color="var(--purple)" />
      </div>

      {classes.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "4px 0 16px" }}>
          <div className="u-title">{shown.length} class{shown.length === 1 ? "" : "es"}</div>
          <Segmented
            value={filter} onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "ct", label: "Class teacher" },
              { value: "subject", label: "Subject teacher" },
            ]}
          />
        </div>
      )}

      <Spin spinning={loading}>
        {!loading && shown.length === 0 ? (
          <div className="empty-state">
            <Empty
              description={classes.length
                ? "No classes match your search"
                : "No classes assigned to you yet. The school admin assigns teachers to sections and subjects under Classes."}
            />
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {shown.map((cls) => (
              <Col xs={24} md={12} xl={8} key={cls._id}>
                <ClassCard cls={cls} onView={handleView} onAttendance={handleAttendance} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
