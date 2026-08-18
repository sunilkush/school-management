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
import memoryStorage from "../../../utils/memoryStorage";
import { getRoleName, getRolePath } from "../../../utils/roles";
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

const SectionCard = ({ section, onAttendance }) => {
  const name = section?.sectionId?.name || "Section";
  const subjects = section?.subjects || [];

  return (
    <div style={{ ...sectionPanel, marginBottom: 0, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
          <div style={iconWell("var(--primary)", 40)}>
            <AppstoreOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <TeamOutlined /> {section?.studentCount ?? 0} Students
            </div>
          </div>
        </div>
        {section?.isClassTeacher ? (
          <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>
            <CrownOutlined style={{ marginRight: 4 }} /> Class Teacher
          </span>
        ) : (
          <span style={pill("var(--primary-hover)", "rgba(219,234,254,0.4)")}>Subject Teacher</span>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border-muted)" }} />

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Subjects Taught Here
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {subjects.length ? (
            subjects.map((sub, i) => (
              <span key={sub?.subjectId?._id || i} style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>
                {sub?.subjectId?.name || "Subject"}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No subjects assigned</span>
          )}
        </div>
      </div>

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

  const user = JSON.parse(memoryStorage.getItem("user") || "{}");
  const academic = JSON.parse(memoryStorage.getItem("selectedAcademicYear") || "{}");

  const teacherId = user?._id;
  const schoolId = academic?.schoolId;
  const academicYearId = academic?._id;
  const rolePath = getRolePath(getRoleName(user));

  useEffect(() => {
    if (!classAssignTeacher.length && teacherId && schoolId && academicYearId) {
      dispatch(fetchAssignedClasses({ teacherId, schoolId, academicYearId }));
    }
  }, [dispatch, classAssignTeacher.length, teacherId, schoolId, academicYearId]);

  const classData = useMemo(
    () => classAssignTeacher.find((item) => item?._id === classId),
    [classAssignTeacher, classId]
  );

  const isClassTeacherOverall = classData?.role?.includes("class_teacher");
  const classTeacherSectionCount = useMemo(
    () => (classData?.sections || []).filter((s) => s?.isClassTeacher).length,
    [classData]
  );

  const handleAttendance = () =>
    classData?._id &&
    navigate(`/dashboard/${rolePath}/attendance/students?classId=${classData._id}&className=${encodeURIComponent(classData?.name || "")}`);

  if (!loading && !classData) {
    return (
      <div style={pageWrapper}>
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
        <div style={{ ...emptyState, marginTop: 20 }}>
          <Empty description="Class details not found" />
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader
        title={classData?.name || "Class"}
        subtitle={isClassTeacherOverall ? "You are the Class Teacher for one or more sections here" : "Subject Teacher · Overview of your assigned sections"}
        icon={<ReadOutlined />}
        extra={
          <Space wrap>
            <Tooltip title="Back to Classes">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/dashboard/${rolePath}/classes`)} />
            </Tooltip>
            <Button type="primary" icon={<CalendarOutlined />} onClick={handleAttendance}>
              Take Attendance
            </Button>
          </Space>
        }
      />

      <Spin spinning={loading}>
        <div style={{ ...statGrid(170), marginTop: 20 }}>
          <StatCard icon={<TeamOutlined />} label="Students" value={classData?.studentCount || 0} color="var(--accent)" />
          <StatCard icon={<AppstoreOutlined />} label="Sections" value={classData?.sections?.length || 0} color="var(--warning)" />
          <StatCard icon={<BookOutlined />} label="Subjects" value={classData?.subjects?.length || 0} color="var(--purple)" />
          <StatCard icon={<CrownOutlined />} label="Class Teacher Of" value={classTeacherSectionCount} color="var(--primary)" />
        </div>

        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={iconWell("var(--purple)", 34)}>
              <BookOutlined />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>All Subjects</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {classData?.subjects?.length ? (
              classData.subjects.map((sub, i) => (
                <span key={sub?.subjectId?._id || i} style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>
                  {sub?.subjectId?.name || "Subject"}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No subjects assigned</span>
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
                <SectionCard section={section} onAttendance={handleAttendance} />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={emptyState}>
            <Empty description="No sections assigned" />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default ClassDetails;
