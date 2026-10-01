import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Empty, Row, Space, Spin, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  AppstoreOutlined,
  BookOutlined,
  CalendarOutlined,
  CrownOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { getRoleName, getRolePath } from "../../../utils/roles";
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell, pill } from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div className="section-panel is-header-strip">
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div className="u-title-lg">{value}</div>
    </div>
  </div>
);

// A subject is the teacher's own when the API says so; an older API that sends no flag only ever
// listed their own subjects outside the sections they are class teacher of.
const isMine = (sub, sec) => (sub?.isMine !== undefined ? sub.isMine : !sec?.isClassTeacher);

const SectionCard = ({ section, onAttendance }) => {
  const name = section?.sectionId?.name || "Section";
  const subjects = section?.subjects || [];
  const own = subjects.filter((s) => isMine(s, section));
  const others = subjects.filter((s) => !isMine(s, section));

  return (
    <div className="section-panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
          <div style={iconWell("var(--primary)", 40)}>
            <AppstoreOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="u-title-sm">{name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <TeamOutlined /> {section?.studentCount ?? 0} Students
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {section?.isClassTeacher && (
            <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>
              <CrownOutlined style={{ marginRight: 4 }} /> Class Teacher
            </span>
          )}
          {own.length > 0 && (
            <span style={pill("var(--primary-hover)", "rgba(219,234,254,0.4)")}>Subject Teacher</span>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-muted)" }} />

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          You teach
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {own.length ? (
            own.map((sub, i) => (
              <span key={sub?.subjectId?._id || i} style={pill("#fff", "var(--primary)")}>
                {sub?.subjectId?.name || "Subject"}
              </span>
            ))
          ) : (
            <span className="u-meta">No subject of your own in this section</span>
          )}
        </div>
      </div>

      {/* A class teacher also sees who takes the rest of the section's subjects. */}
      {others.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Other subjects and their teachers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {others.map((sub, i) => (
              <div key={sub?.subjectId?._id || i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{sub?.subjectId?.name || "Subject"}</span>
                <span style={{ color: sub?.teacherName ? "var(--text-secondary)" : "var(--danger)" }}>{sub?.teacherName || "No teacher yet"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAttendance}
        style={{
          marginTop: "auto",
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
  );
};

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { classAssignTeacher = [], loading } = useSelector((state) => state.class || {});

  // From the app's own state, and fetched every time the page opens. This read the user and the
  // academic year out of a side storage and fetched only when the list was empty and that storage
  // had a school id: opened directly it said "Class details not found", and after the office
  // assigned a subject it kept showing the list loaded before.
  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;
  const rolePath = getRolePath(getRoleName(user));

  useEffect(() => {
    if (academicYearId) dispatch(fetchAssignedClasses({ academicYearId }));
  }, [dispatch, academicYearId]);

  const classData = useMemo(
    () => classAssignTeacher.find((item) => item?._id === classId),
    [classAssignTeacher, classId]
  );

  const isClassTeacherOverall = classData?.role?.includes("class_teacher");
  const mySubjects = useMemo(() => {
    const names = new Set();
    (classData?.sections || []).forEach((sec) => (sec.subjects || []).forEach((sub) => { if (isMine(sub, sec) && sub?.subjectId?.name) names.add(sub.subjectId.name); }));
    return [...names];
  }, [classData]);
  const classTeacherSectionCount = useMemo(
    () => (classData?.sections || []).filter((s) => s?.isClassTeacher).length,
    [classData]
  );

  const handleAttendance = (sectionId) =>
    classData?._id &&
    navigate(
      `/dashboard/${rolePath}/attendance/students?classId=${classData._id}` +
        (sectionId ? `&sectionId=${sectionId}` : "") +
        `&className=${encodeURIComponent(classData?.name || "")}`
    );

  if (!loading && !classData && (classAssignTeacher.length > 0 || !academicYearId)) {
    return (
      <div className="page-wrapper">
        <PageHeader
          title="Class Details"
          subtitle="Class not found"
          icon={<ReadOutlined />}
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/dashboard/${rolePath}/classes`)}>
              Back to Classes
            </Button>
          }
        />
        <div className="empty-state u-mt-5">
          <Empty description="Class details not found" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        title={classData?.name || "Class"}
        subtitle={isClassTeacherOverall
          ? `Class Teacher${mySubjects.length ? " and Subject Teacher" : ""} · your sections in this class`
          : "Subject Teacher · your sections in this class"}
        icon={<ReadOutlined />}
        extra={
          <Space wrap>
            <Tooltip title="Back to Classes">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/dashboard/${rolePath}/classes`)} />
            </Tooltip>
            <Button type="primary" icon={<CalendarOutlined />} onClick={() => handleAttendance()}>
              Take Attendance
            </Button>
          </Space>
        }
      />

      <Spin spinning={loading}>
        <div style={{ ...statGrid(170), marginTop: 20 }}>
          <StatCard icon={<TeamOutlined />} label="Students" value={classData?.studentCount || 0} color="var(--accent)" />
          <StatCard icon={<AppstoreOutlined />} label="Sections" value={classData?.sections?.length || 0} color="var(--warning)" />
          <StatCard icon={<BookOutlined />} label="Subjects you teach" value={mySubjects.length} color="var(--purple)" />
          <StatCard icon={<CrownOutlined />} label="Class Teacher Of" value={classTeacherSectionCount} color="var(--primary)" />
        </div>

        <div className="section-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={iconWell("var(--purple)", 34)}>
              <BookOutlined />
            </div>
            <div className="u-title-sm">Subjects you teach in this class</div>
          </div>
          <div className="u-row-wrap">
            {mySubjects.length ? (
              mySubjects.map((name) => (
                <span key={name} style={pill("#fff", "var(--primary)")}>{name}</span>
              ))
            ) : (
              <span className="u-meta-md">
                {isClassTeacherOverall
                  ? "You are the class teacher here but have no subject of your own. The office assigns subjects under Classes → Subject Teachers."
                  : "No subject assigned to you in this class yet."}
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Sections
        </div>
        {classData?.sections?.length ? (
          <Row gutter={[16, 16]}>
            {classData.sections.map((section) => (
              <Col xs={24} sm={12} lg={8} key={section?.sectionId?._id || section?.sectionId?.name}>
                <SectionCard section={section} onAttendance={() => handleAttendance(section?.sectionId?._id)} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state">
            <Empty description="No sections assigned" />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default ClassDetails;
