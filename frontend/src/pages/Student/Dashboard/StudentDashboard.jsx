import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Card, Col, Empty, List, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import dayjs from "dayjs";
import {
  fetchStudentEnrollment,
  fetchStudentGrades,
  fetchStudentLibraryBooks,
  fetchStudentTimetable,
  fetchStudentTransport,
} from "../../../features/studentPortalSlice";

const { Text, Title } = Typography;

const getGradeScore = (grade = {}) => {
  const numeric = [grade?.percentage, grade?.marks, grade?.score, grade?.obtainedMarks]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value));

  return Number.isFinite(numeric) ? numeric : null;
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { enrollment, grades, timetable, transportAssignment, libraryBooks, loading, error } =
    useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentEnrollment());
    dispatch(fetchStudentGrades());
    dispatch(fetchStudentTimetable());
    dispatch(fetchStudentLibraryBooks());
    dispatch(fetchStudentTransport());
  }, [dispatch]);

  const stats = useMemo(() => {
    const gradeScores = (grades || []).map(getGradeScore).filter((value) => value !== null);
    const averageScore = gradeScores.length
      ? Math.round((gradeScores.reduce((sum, value) => sum + value, 0) / gradeScores.length) * 10) / 10
      : null;

    return {
      subjects: grades?.length || 0,
      weeklyClasses: timetable?.length || 0,
      issuedBooks: libraryBooks?.length || 0,
      avgScore: averageScore,
    };
  }, [grades, timetable, libraryBooks]);

  if (loading && !enrollment) {
    return <Skeleton active paragraph={{ rows: 7 }} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 0 }}>
          Welcome back, {user?.name || "Student"} 👋
        </Title>
        <Text type="secondary">
          {enrollment?.schoolClass?.name
            ? `Class ${enrollment.schoolClass.name}${enrollment?.section?.name ? ` - ${enrollment.section.name}` : ""}`
            : "Your dashboard updates automatically as your records change."}
        </Text>
      </Card>

      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Subjects" value={stats.subjects} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Weekly Classes" value={stats.weeklyClasses} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Issued Books" value={stats.issuedBooks} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Average Score" value={stats.avgScore ?? "-"} suffix={stats.avgScore !== null ? "%" : ""} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Latest Results">
            {(grades || []).length ? (
              <List
                dataSource={grades.slice(0, 5)}
                renderItem={(grade) => (
                  <List.Item>
                    <List.Item.Meta
                      title={grade?.subjectName || grade?.subject?.name || "Subject"}
                      description={grade?.examName || grade?.exam?.title || "Assessment"}
                    />
                    <Tag color="blue">{getGradeScore(grade) ?? "NA"}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No result data found" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Transport Status">
            {transportAssignment ? (
              <Space direction="vertical">
                <Text>
                  Route: <strong>{transportAssignment?.route?.routeName || transportAssignment?.routeName || "-"}</strong>
                </Text>
                <Text>
                  Vehicle: <strong>{transportAssignment?.vehicle?.vehicleNumber || transportAssignment?.vehicleNumber || "-"}</strong>
                </Text>
                <Text>
                  Stop: <strong>{transportAssignment?.stopName || transportAssignment?.pickupPoint || "-"}</strong>
                </Text>
              </Space>
            ) : (
              <Empty description="No transport assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Today at a Glance">
        {(timetable || []).length ? (
          <List
            dataSource={timetable.slice(0, 4)}
            renderItem={(session) => (
              <List.Item>
                <List.Item.Meta
                  title={session?.subjectName || session?.subject?.name || "Class"}
                  description={`${session?.teacherName || session?.teacher?.name || "Teacher TBA"} • ${
                    session?.startTime ? dayjs(session.startTime, "HH:mm").format("hh:mm A") : "Time TBA"
                  }`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No timetable entries available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </Space>
  );
};

export default StudentDashboard;