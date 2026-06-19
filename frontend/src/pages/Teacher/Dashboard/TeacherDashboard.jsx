import React, { useEffect, useMemo, useState } from "react";
import {
  Row, Col, List, Button, Space, Progress, Empty, Spin,
} from "antd";
import {
  UserOutlined, BookOutlined, CalendarOutlined,
  FileTextOutlined, DashboardOutlined, CalendarFilled,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { fetchMyAttendance } from "../../../features/attendanceSlice";
import { getExams } from "../../../features/examSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid, pill } from "../../../styles/pageStyles";

const STAT_COLORS = ["#2563EB", "#14B8A6", "#22C55E", "#F59E0B"];
const STAT_ACCENT_BARS = ["#DBEAFE", "rgba(20,184,166,0.15)", "#DCFCE7", "#FEF3C7"];
const STAT_BG = [
  "rgba(219,234,254,0.12)",
  "rgba(20,184,166,0.12)",
  "rgba(220,252,231,0.12)",
  "rgba(254,243,199,0.15)",
];

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((state) => state.class || {});
  const { myAttendance = [], loading: attendanceLoading } = useSelector((state) => state.attendance || {});
  const { exams = [], loading: examLoading } = useSelector((state) => state.exams || {});
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
    dispatch(fetchMyAttendance({ academicYearId: selectedAcademicYear._id, limit: 31 }));
    dispatch(getExams({ academicYearId: selectedAcademicYear._id, limit: 20 }));
    apiClient.get("/student-portal/teacher/homework", { params: { academicYearId: selectedAcademicYear._id } })
      .then((res) => setAssignmentCount((res.data?.data || []).length))
      .catch(() => {});
  }, [dispatch, selectedAcademicYear?._id]);

  const dashboardData = useMemo(() => {
    const totalClasses = classAssignTeacher.length;
    const totalStudents = classAssignTeacher.reduce((sum, cls) => sum + Number(cls?.studentCount || 0), 0);
    const today = dayjs();
    const normalizedExams = Array.isArray(exams) ? exams : [];

    const todayExams = normalizedExams.filter((exam) => {
      const examDate = exam?.date || exam?.examDate || exam?.startDate;
      return examDate && dayjs(examDate).isValid() && dayjs(examDate).isSame(today, "day");
    });

    const upcomingExams = normalizedExams
      .filter((exam) => {
        const examDate = exam?.date || exam?.examDate || exam?.startDate;
        return examDate && dayjs(examDate).isValid() && !dayjs(examDate).isBefore(today, "day");
      })
      .sort((a, b) => dayjs(a?.date || a?.examDate || a?.startDate).valueOf() - dayjs(b?.date || b?.examDate || b?.startDate).valueOf())
      .slice(0, 5)
      .map((exam) => ({
        name: exam?.title || exam?.name || "Untitled Exam",
        className: exam?.classId?.name || exam?.className || "Class",
        date: exam?.date || exam?.examDate || exam?.startDate,
      }));

    const presentCount = myAttendance.filter((item) => item?.status === "present").length;
    const totalAttendanceRecords = myAttendance.length;
    const attendancePercent = totalAttendanceRecords
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    const sections = classAssignTeacher.flatMap((cls) =>
      (cls?.sections || []).map((section) => ({
        className: cls?.name || "Class",
        sectionName: section?.sectionId?.name || "Section",
        role: section?.isClassTeacher ? "Class Teacher" : "Subject Teacher",
      }))
    );

    return {
      totalClasses,
      totalStudents,
      todayExamsCount: todayExams.length,
      pendingTasks: normalizedExams.filter((exam) => exam?.status && exam.status !== "published").length,
      attendancePercent,
      upcomingExams,
      sections: sections.slice(0, 6),
    };
  }, [classAssignTeacher, exams, myAttendance]);

  const stats = [
    { title: "Assigned Classes", value: dashboardData.totalClasses,    icon: <BookOutlined /> },
    { title: "Students",          value: dashboardData.totalStudents,   icon: <UserOutlined /> },
    { title: "Assignments",       value: assignmentCount,               icon: <FileTextOutlined /> },
    { title: "Today Exams",       value: dashboardData.todayExamsCount, icon: <CalendarOutlined /> },
  ];

  const isLoading = classLoading || attendanceLoading || examLoading;

  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Welcome back, ${user?.name || "Teacher"} · ${selectedAcademicYear?.name ?? ""}`}
        icon={<DashboardOutlined />}
      />
      <div style={pageWrapper}>
        <Spin spinning={isLoading}>
          {/* KPI stats */}
          <div className="stat-grid" style={statGrid(180)}>
            {stats.map((item, i) => (
              <div key={item.title} style={statCard({ color: STAT_COLORS[i], bg: "#ffffff", accentBar: STAT_ACCENT_BARS[i] })}>
                <div>
                  <div style={statLabel(STAT_COLORS[i])}>{item.title}</div>
                  <div style={statValue(STAT_COLORS[i])}>{item.value}</div>
                </div>
                <div style={{
                  fontSize: 22,
                  color: STAT_COLORS[i],
                  background: STAT_BG[i],
                  borderRadius: 12,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>{item.icon}</div>
              </div>
            ))}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Upcoming Exams</div>
                {dashboardData.upcomingExams.length ? (
                  <List
                    dataSource={dashboardData.upcomingExams}
                    renderItem={(item) => (
                      <List.Item style={{ padding: "10px 0", borderBottom: "1px solid var(--border-muted)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.className}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {item.date ? dayjs(item.date).format("DD MMM YYYY") : "N/A"}
                        </span>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No upcoming exams" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Col>

            <Col xs={24} md={10}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Quick Actions</div>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button type="primary" block onClick={() => navigate("/dashboard/teacher/attendance/students")}>
                    Mark Attendance
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/assignments")}>
                    Assignments
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/resources")}>
                    Upload Resources
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/lesson-plans")}>
                    Lesson Plans
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/leave")}>
                    Apply Leave
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/students")}>
                    View Students
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 8 }}>My Attendance</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Present days from last {myAttendance.length} records</div>
                <Progress
                  percent={dashboardData.attendancePercent}
                  status="active"
                  strokeColor={{
                    from: "#DBEAFE",
                    to: "#DCFCE7",
                  }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Assigned Sections</div>
                {dashboardData.sections.length ? (
                  <List
                    dataSource={dashboardData.sections}
                    renderItem={(item, index) => (
                      <List.Item key={`${item.className}-${item.sectionName}-${index}`} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-muted)" }}>
                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.className} — {item.sectionName}</span>
                        <span style={pill(
                          item.role === "Class Teacher" ? "#15803D" : "#2E6A9A",
                          item.role === "Class Teacher" ? "rgba(220,252,231,0.25)" : "rgba(219,234,254,0.22)"
                        )}>
                          {item.role}
                        </span>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No sections assigned yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Col>
          </Row>
        </Spin>
      </div>
    </>
  );
};

export default TeacherDashboard;
