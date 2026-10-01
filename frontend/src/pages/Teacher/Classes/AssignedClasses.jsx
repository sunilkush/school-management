import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Segmented, Spin, Tag, Tooltip } from "antd";
import { CalendarOutlined, ReadOutlined, RightOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import { getRoleName, getRolePath } from "../../../utils/roles";

// "Class 2" before "Class 10": compare the number in the name, then the name.
const classOrder = (a, b) => {
  const n = (s) => { const m = /\d+/.exec(s || ""); return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER; };
  return n(a.name) - n(b.name) || String(a.name).localeCompare(String(b.name));
};

const Chip = ({ value, label, color = "var(--primary)" }) => (
  <span style={{
    fontSize: 12, padding: "3px 11px", borderRadius: 20, color: "var(--text-secondary)",
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, background: `color-mix(in srgb, ${color} 7%, transparent)`,
  }}>
    <b style={{ color, fontSize: 14 }}>{value}</b> {label}
  </span>
);

/**
 * The classes a teacher is assigned to this year. Each class is one compact card listing its
 * sections: how many students, which subjects they teach there, whether they are its class teacher,
 * and a button straight to that section's attendance.
 *
 * It used to show one tall card per class with a raw role string ("class_teacher": the check for
 * "class teacher" never matched, so the tag was never the class-teacher one) and nothing about the
 * individual sections, although the API sends all of it.
 */
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

  const openClass = (cls) => navigate(`/dashboard/${rolePath}/classes/${cls._id}`);
  const takeAttendance = (cls, sec) => {
    const params = new URLSearchParams({ classId: cls._id, className: cls.name || "" });
    if (sec?.sectionId?._id) params.set("sectionId", sec.sectionId._id);
    navigate(`/dashboard/${rolePath}/attendance/students?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Classes"
        subtitle={selectedAcademicYear?.name ? `The classes and sections you teach in ${selectedAcademicYear.name}` : "The classes and sections you teach"}
        icon={<ReadOutlined />}
        extra={
          <Input
            allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search class, section or subject" prefix={<SearchOutlined className="u-muted" />}
            style={{ width: 240 }}
          />
        }
      />

      <div className="section-panel" style={{ marginTop: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Chip value={stats.classes} label="classes" />
          <Chip value={stats.sections} label="sections" color="var(--warning)" />
          <Chip value={stats.students} label="students" color="var(--success)" />
          <Chip value={stats.subjects} label="subjects" color="var(--purple)" />
          {stats.classTeacherOf.length > 0 && (
            <span className="u-muted" style={{ fontSize: 12 }}>Class teacher of {stats.classTeacherOf.join(", ")}</span>
          )}
        </div>
        <Segmented
          size="small" value={filter} onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "ct", label: "Class teacher" },
            { value: "subject", label: "Subject teacher" },
          ]}
        />
      </div>

      <Spin spinning={loading}>
        {!loading && shown.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={classes.length
                ? "No classes match"
                : "No classes assigned to you yet. The school admin assigns teachers to sections and subjects under Classes."}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 12, marginTop: 12, alignItems: "start" }}>
            {shown.map((cls) => (
              <div key={cls._id} className="section-panel" style={{ margin: 0, padding: 0, overflow: "hidden" }}>
                {/* Class line */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{cls.name || "Class"}</div>
                    <div className="u-muted" style={{ fontSize: 12 }}>
                      <TeamOutlined /> {cls.studentCount ?? 0} students · {cls.sections.length} section{cls.sections.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Button size="small" type="primary" onClick={() => openClass(cls)}>
                    Open <RightOutlined />
                  </Button>
                </div>

                {/* One line per section */}
                {cls.sections.map((sec) => {
                  const subjects = (sec.subjects || []).map((s) => s.subjectId?.name).filter(Boolean);
                  return (
                    <div key={sec.sectionId?._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid var(--border-muted)" }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 13, color: "var(--primary)", background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                      }}>{sec.sectionId?.name}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <b>{sec.studentCount ?? 0}</b> <span className="u-muted">students</span>
                          {sec.isClassTeacher && <Tag color="purple" style={{ marginLeft: 6, marginRight: 0 }}>Class teacher</Tag>}
                        </div>
                        <div className="u-muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={subjects.join(", ")}>
                          {subjects.length ? subjects.join(", ") : "No subject assigned"}
                        </div>
                      </div>
                      <Tooltip title={`Take attendance for ${cls.name}-${sec.sectionId?.name}`}>
                        <Button size="small" icon={<CalendarOutlined />} onClick={() => takeAttendance(cls, sec)}>Attendance</Button>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
