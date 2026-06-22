import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Statistic, Space, Table, Tag, Typography, Button, Spin, Alert } from "antd";
import {
  FileTextOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  PlusOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { getExams } from "../../features/examSlice";
import apiClient from "../../api/httpClient";
import { useState } from "react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ExamCoordinatorDashboard = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { exams, loading, error } = useSelector((s) => s.exams || { exams: [], loading: false });
  const [qCount, setQCount] = useState(null);

  useEffect(() => {
    dispatch(getExams({}));
    apiClient
      .get("/questions/getQuestions", { params: { limit: 100 } })
      .then((r) => {
        const d = r.data?.data;
        setQCount(d?.pagination?.total ?? d?.questions?.length ?? 0);
      })
      .catch(() => setQCount(0));
  }, [dispatch]);

  const now = dayjs();

  const upcoming  = useMemo(() => exams.filter((e) => dayjs(e.examDate).isAfter(now)), [exams]);
  const completed = useMemo(() => exams.filter((e) => dayjs(e.examDate).isBefore(now)), [exams]);
  const pending   = useMemo(() => completed.filter((e) => !e.isPublished && !e.resultPublished), [completed]);

  const stats = [
    { title: "Upcoming Exams",     value: upcoming.length,  color: "#7C3AED", icon: <ScheduleOutlined /> },
    { title: "Questions in Bank",  value: qCount ?? "—",    color: "#2563EB", icon: <QuestionCircleOutlined />, loading: qCount === null },
    { title: "Pending Evaluation", value: pending.length,   color: "#F59E0B", icon: <ClockCircleOutlined /> },
    { title: "Exams Completed",    value: completed.length, color: "#10B981", icon: <CheckCircleOutlined /> },
  ];

  const upcomingRows = useMemo(
    () =>
      [...upcoming]
        .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
        .slice(0, 8)
        .map((e, i) => ({
          key: e._id || i,
          exam:  e.title || e.name || "Exam",
          class: e.schoolClass?.name || e.schoolClassId?.name || "—",
          subject: e.subject?.name || e.subjectId?.name || "—",
          date:  dayjs(e.examDate).format("DD MMM YYYY"),
          type:  e.type || "Written",
        })),
    [upcoming]
  );

  const columns = [
    { title: "Exam",    dataIndex: "exam",    key: "exam",    ellipsis: true },
    { title: "Class",   dataIndex: "class",   key: "class"   },
    { title: "Subject", dataIndex: "subject", key: "subject" },
    { title: "Date",    dataIndex: "date",    key: "date"    },
    { title: "Type",    dataIndex: "type",    key: "type",   render: (v) => <Tag color="purple">{v}</Tag> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>Exam Coordinator Dashboard</Title>
            <Text type="secondary">Exam operations — scheduling, question bank, and evaluation status.</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate("exams/create")}>
                Create Exam
              </Button>
              <Button icon={<BarChartOutlined />} onClick={() => navigate("exams/analytics")}>
                Analytics
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" message={`Failed to load exams: ${error}`} showIcon />}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stats.map((s) => (
            <Col xs={24} sm={12} md={6} key={s.title}>
              <Card style={{ borderTop: `4px solid ${s.color}` }} loading={s.loading}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  prefix={s.icon}
                  valueStyle={{ color: s.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Upcoming Exams"
            extra={
              <Button size="small" onClick={() => navigate("exams")}>View All</Button>
            }
          >
            <Table
              size="small"
              loading={loading}
              pagination={false}
              dataSource={upcomingRows}
              columns={columns}
              locale={{ emptyText: "No upcoming exams scheduled" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title="Quick Actions">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button block onClick={() => navigate("exams/question-bank")}>
                  <QuestionCircleOutlined /> Question Bank
                </Button>
                <Button block onClick={() => navigate("exams/schedule")}>
                  <ScheduleOutlined /> Exam Schedule
                </Button>
                <Button block onClick={() => navigate("exams/grades")}>
                  <FileTextOutlined /> Grade Entry
                </Button>
                <Button block onClick={() => navigate("exams/admit-card")}>
                  <FileTextOutlined /> Admit Cards
                </Button>
                <Button block onClick={() => navigate("exams/seat-plan")}>
                  <FileTextOutlined /> Seat Planning
                </Button>
                <Button block onClick={() => navigate("reports")}>
                  <BarChartOutlined /> Exam Reports
                </Button>
              </Space>
            </Card>

            <Card title="Evaluation Status">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row justify="space-between">
                  <Text>Completed Exams</Text>
                  <Tag color="green">{completed.length}</Tag>
                </Row>
                <Row justify="space-between">
                  <Text>Pending Results</Text>
                  <Tag color="orange">{pending.length}</Tag>
                </Row>
                <Row justify="space-between">
                  <Text>Results Published</Text>
                  <Tag color="blue">{completed.length - pending.length}</Tag>
                </Row>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
};

export default ExamCoordinatorDashboard;
