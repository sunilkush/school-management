import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Col, Empty, List, Row, Skeleton, Space, Progress } from "antd";
import {
  BookOutlined, CalendarOutlined, ReloadOutlined, TrophyOutlined, UserOutlined,
  CheckCircleOutlined, PercentageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  fetchStudentEnrollment,
  fetchStudentGrades,
  fetchStudentTimetable,
  fetchStudentTransport,
} from "../../../features/studentPortalSlice";
import { fetchMyAttendance } from "../../../features/attendanceSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid, pill } from "../../../styles/pageStyles";

const getGradeScore = (grade = {}) => {
  const numeric = [grade?.percentage, grade?.marks, grade?.score, grade?.obtainedMarks]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value));
  return Number.isFinite(numeric) ? numeric : null;
};

const STAT_COLORS     = ["var(--primary)", "var(--accent)", "var(--warning)", "var(--success)"];
const STAT_BARS       = ["var(--primary-light)", "rgba(var(--accent-rgb),0.15)", "var(--warning-light)", "var(--success-light)"];
const STAT_BG         = [
  "rgba(var(--primary-rgb),0.12)",
  "rgba(var(--accent-rgb),0.12)",
  "rgba(var(--warning-rgb),0.15)",
  "rgba(var(--success-rgb),0.12)",
];

const StudentDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((state) => state.auth);
  const { enrollment, grades, timetable, transportAssignment, loading, error } =
    useSelector((state) => state.studentPortal);
  const { myAttendance = [] } = useSelector((state) => state.attendance || {});
  const [pendingHomework, setPendingHomework] = useState(0);

  const loadDashboardData = useCallback(() => {
    dispatch(fetchStudentEnrollment());
    dispatch(fetchStudentGrades());
    dispatch(fetchStudentTimetable());
    dispatch(fetchStudentTransport());
    dispatch(fetchMyAttendance({ month: dayjs().month() + 1, year: dayjs().year() }));
    apiClient.get("/student-portal/me/homework")
      .then((res) => {
        const hw = res.data?.data?.homework || [];
        setPendingHomework(hw.filter((h) => !h.submission).length);
      })
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const attendancePercent = useMemo(() => {
    if (!myAttendance.length) return null;
    const present = myAttendance.filter((a) => a.status === "present").length;
    return Math.round((present / myAttendance.length) * 100);
  }, [myAttendance]);

  const stats = useMemo(() => {
    const gradeScores = (grades || []).map(getGradeScore).filter((value) => value !== null);
    const averageScore = gradeScores.length
      ? Math.round((gradeScores.reduce((sum, value) => sum + value, 0) / gradeScores.length) * 10) / 10
      : null;
    return {
      subjects: grades?.length || 0,
      weeklyClasses: timetable?.length || 0,
      pendingHw: pendingHomework,
      avgScore: averageScore,
    };
  }, [grades, timetable, pendingHomework]);

  const todayClasses = useMemo(() => {
    const todayName = dayjs().format("dddd").toLowerCase();
    return (timetable || [])
      .filter((session) => {
        const sessionDay = session?.day || session?.dayName || session?.weekday;
        return !sessionDay || String(sessionDay).toLowerCase() === todayName;
      })
      .sort((a, b) => String(a?.startTime || "").localeCompare(String(b?.startTime || "")));
  }, [timetable]);

  const statMeta = [
    { key: "subjects",     label: "Subjects",         icon: <BookOutlined /> },
    { key: "weeklyClasses",label: "Weekly Classes",   icon: <CalendarOutlined /> },
    { key: "pendingHw",    label: "Pending Homework", icon: <CheckCircleOutlined /> },
    { key: "avgScore",     label: "Average Score",    icon: <TrophyOutlined />, suffix: stats.avgScore !== null ? "%" : "" },
  ];

  if (loading && !enrollment) {
    return (
      <div style={pageWrapper}>
        <Skeleton active paragraph={{ rows: 7 }} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || "Student"}`}
        subtitle={enrollment?.schoolClass?.name
          ? `Class ${enrollment.schoolClass.name}${enrollment?.section?.name ? ` — ${enrollment.section.name}` : ""}`
          : "Your dashboard updates automatically as your records change."}
        icon={<UserOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDashboardData}>
            Refresh
          </Button>
        }
      />
      <div style={pageWrapper}>
        {error && <Alert type="warning" showIcon message={error} style={{ borderRadius: 10, marginBottom: 16 }} />}

        {/* KPI stats */}
        <div className="stat-grid" style={statGrid(180)}>
          {statMeta.map(({ key, label, icon, suffix }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i], bg: "var(--surface)", accentBar: STAT_BARS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>
                  {stats[key] ?? "—"}{suffix && stats[key] !== null ? suffix : ""}
                </div>
              </div>
              <div style={{
                fontSize: 20,
                color: STAT_COLORS[i],
                background: STAT_BG[i],
                borderRadius: 12,
                padding: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{icon}</div>
            </div>
          ))}
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Latest Results</div>
              {(grades || []).length ? (
                <List
                  dataSource={grades.slice(0, 5)}
                  renderItem={(grade) => (
                    <List.Item style={{ padding: "10px 0", borderBottom: "1px solid var(--border-muted)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
                          {grade?.subjectName || grade?.subject?.name || "Subject"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {grade?.examName || grade?.exam?.title || "Assessment"}
                        </div>
                      </div>
                      <span style={pill("var(--accent)", "rgba(var(--accent-rgb),0.22)")}>{getGradeScore(grade) ?? "NA"}</span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No result data found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Transport Status</div>
              {transportAssignment ? (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Route</div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                      {transportAssignment?.route?.routeName || transportAssignment?.routeName || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Vehicle</div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                      {transportAssignment?.vehicle?.vehicleNumber || transportAssignment?.vehicleNumber || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Stop</div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                      {transportAssignment?.stopName || transportAssignment?.pickupPoint || "—"}
                    </div>
                  </div>
                </Space>
              ) : (
                <Empty description="No transport assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Col>
        </Row>

        {/* Attendance Progress */}
        {attendancePercent !== null && (
          <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 8 }}>
                  <PercentageOutlined style={{ marginRight: 8 }} />Monthly Attendance
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  {myAttendance.filter((a) => a.status === "present").length} present out of {myAttendance.length} days
                </div>
                <Progress
                  percent={attendancePercent}
                  strokeColor={
                    attendancePercent >= 75
                      ? { from: "var(--primary-light)", to: "var(--success-light)" }
                      : attendancePercent >= 60
                        ? { from: "var(--warning-light)", to: "var(--warning-light)" }
                        : { from: "var(--danger-light)", to: "var(--danger-light)" }
                  }
                  status="active"
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={sectionPanel}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>Quick Links</div>
                <Space wrap>
                  <Button size="small" onClick={() => navigate("/dashboard/student/homework")}>Homework</Button>
                  <Button size="small" onClick={() => navigate("/dashboard/student/study-materials")}>Study Materials</Button>
                  <Button size="small" onClick={() => navigate("/dashboard/student/leave")}>Apply Leave</Button>
                  <Button size="small" onClick={() => navigate("/dashboard/student/calendar")}>Calendar</Button>
                  <Button size="small" onClick={() => navigate("/dashboard/student/fees")}>Fee Status</Button>
                  <Button size="small" onClick={() => navigate("/dashboard/student/exams")}>My Exams</Button>
                </Space>
              </div>
            </Col>
          </Row>
        )}

        <div style={{ ...sectionPanel, marginTop: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>Today at a Glance</div>
          {todayClasses.length ? (
            <List
              dataSource={todayClasses.slice(0, 4)}
              renderItem={(session) => (
                <List.Item style={{ padding: "10px 0", borderBottom: "1px solid var(--border-muted)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
                      {session?.subjectName || session?.subject?.name || "Class"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {session?.teacherName || session?.teacher?.name || "Teacher TBA"}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {session?.startTime ? dayjs(session.startTime, "HH:mm").format("hh:mm A") : "Time TBA"}
                  </span>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No classes scheduled for today" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
