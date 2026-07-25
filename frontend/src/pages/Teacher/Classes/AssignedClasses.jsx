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
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  pill,
  emptyState,
} from "../../../styles/pageStyles";
import { getRoleName, getRolePath } from "../../../utils/roles";

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeamOutlined style={{ color: "var(--text-muted)" }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{cls?.studentCount ?? 0} Students</span>
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

/* ── Main page ──────────────────────────────────────────────────────── */
const AssignedClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const { classAssignTeacher = [], loading = false } = useSelector(
    (state) => state.class || {}
  );

  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );
  const { user } = useSelector((state) => state.auth || {});
  const rolePath = getRolePath(getRoleName(user));

  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    dispatch(fetchAssignedClasses({ academicYearId }));
  }, [dispatch, academicYearId]);

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

  const handleView = (cls) => cls?._id && navigate(`/dashboard/${rolePath}/classes/${cls._id}`);
  const handleAttendance = (cls) =>
    cls?._id &&
    navigate(
      `/dashboard/${rolePath}/attendance/students?classId=${cls._id}&className=${encodeURIComponent(cls?.name || "")}`
    );

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Assigned Classes"
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
        <StatCard icon={<ReadOutlined />}      label="Subjects" value={stats.totalSubjects} color="#8B5CF6" />
      </div>

      {/* ── Cards ── */}
      <Spin spinning={loading}>
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
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
