import React, { useEffect, useMemo } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Avatar,
  List,
  Button,
  Space,
  Progress,
  Empty,
  Spin,
  Tag,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { fetchMyAttendance } from "../../../features/attendanceSlice";
import { getExams } from "../../../features/examSlice";

const { Content } = Layout;
const { Title, Text } = Typography;

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((state) => state.class || {});
  const { myAttendance = [], loading: attendanceLoading } = useSelector((state) => state.attendance || {});
  const { exams = [], loading: examLoading } = useSelector((state) => state.exams || {});

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;

    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
    dispatch(fetchMyAttendance({ academicYearId: selectedAcademicYear._id, limit: 31 }));
    dispatch(getExams({ academicYearId: selectedAcademicYear._id, limit: 20 }));
  }, [dispatch, selectedAcademicYear?._id]);

  const dashboardData = useMemo(() => {
    const totalClasses = classAssignTeacher.length;

    const totalStudents = classAssignTeacher.reduce(
      (sum, cls) => sum + Number(cls?.studentCount || 0),
      0
    );

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
      .sort((a, b) => {
        const firstDate = dayjs(a?.date || a?.examDate || a?.startDate).valueOf();
        const secondDate = dayjs(b?.date || b?.examDate || b?.startDate).valueOf();
        return firstDate - secondDate;
      })
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
    {
      title: "Assigned Classes",
      value: dashboardData.totalClasses,
      icon: <BookOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Students",
      value: dashboardData.totalStudents,
      icon: <UserOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Today Exams",
      value: dashboardData.todayExamsCount,
      icon: <CalendarOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Pending Tasks",
      value: dashboardData.pendingTasks,
      icon: <FileTextOutlined style={{ fontSize: 22 }} />,
    },
  ];

  const isLoading = classLoading || attendanceLoading || examLoading;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <Content style={{ padding: "24px" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Teacher Dashboard
            </Title>
            <Text type="secondary">Welcome back, {user?.name || "Teacher"} 👋</Text>
          </Col>

          <Col>
            <Space>
              <Avatar size={45} icon={<UserOutlined />} src={user?.avatar} />
            </Space>
          </Col>
        </Row>

        <Spin spinning={isLoading}>
          <Row gutter={[16, 16]}>
            {stats.map((item) => (
              <Col xs={24} sm={12} md={6} key={item.title}>
                <Card bordered={false} style={{ borderRadius: 12 }}>
                  <Space align="start">
                    <Avatar size={48} style={{ background: "#1677ff" }} icon={item.icon} />
                    <div>
                      <Text type="secondary">{item.title}</Text>
                      <Title level={3} style={{ margin: 0 }}>
                        {item.value}
                      </Title>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={14}>
              <Card title="Upcoming Exams" bordered={false} style={{ borderRadius: 12 }}>
                {dashboardData.upcomingExams.length ? (
                  <List
                    dataSource={dashboardData.upcomingExams}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<BookOutlined />} />}
                          title={`${item.name} - ${item.className}`}
                          description={`Date: ${item.date ? dayjs(item.date).format("DD MMM YYYY") : "N/A"}`}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No upcoming exams" />
                )}
              </Card>
            </Col>

            <Col xs={24} md={10}>
              <Card title="Quick Actions" bordered={false} style={{ borderRadius: 12 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button type="primary" block onClick={() => navigate("/dashboard/teacher/attendance")}>
                    Mark Attendance
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/assignments")}>
                    Upload Homework
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/exams/list")}>
                    Enter Marks
                  </Button>
                  <Button block onClick={() => navigate("/dashboard/teacher/students")}>
                    View Students
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="My Attendance" bordered={false} style={{ borderRadius: 12 }}>
                <Text>Present Days (Last records)</Text>
                <Progress
                  percent={dashboardData.attendancePercent}
                  status="active"
                  strokeColor="#52c41a"
                  style={{ marginTop: 10 }}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Assigned Sections" bordered={false} style={{ borderRadius: 12 }}>
                {dashboardData.sections.length ? (
                  <List
                    dataSource={dashboardData.sections}
                    renderItem={(item, index) => (
                      <List.Item key={`${item.className}-${item.sectionName}-${index}`}>
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Text>{item.className} - {item.sectionName}</Text>
                          <Tag color={item.role === "Class Teacher" ? "green" : "blue"}>{item.role}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No sections assigned yet" />
                )}
              </Card>
            </Col>
          </Row>
        </Spin>
      </Content>
    </Layout>
  );
};

export default TeacherDashboard;