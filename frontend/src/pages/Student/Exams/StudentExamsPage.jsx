import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";
import { PlayCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { getExams } from "../../../features/examSlice.js";
import memoryStorage from "../../../utils/memoryStorage";

const { Title, Text } = Typography;

const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], loading } = useSelector((state) => state.exams || {});

  const selectedAcademicYear = useMemo(() => {
    const stored = memoryStorage.getItem("selectedAcademicYear");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const academicYearId = selectedAcademicYear?._id || null;
  const schoolId = selectedAcademicYear?.schoolId || null;

  useEffect(() => {
    if (schoolId) {
      dispatch(getExams({ schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  const publishedExams = useMemo(
    () => exams.filter((exam) => ["published", "completed"].includes(exam?.status)),
    [exams]
  );

  const stats = useMemo(
    () => ({
      total: publishedExams.length,
      live: publishedExams.filter((exam) => exam?.status === "published").length,
      completed: publishedExams.filter((exam) => exam?.status === "completed").length,
    }),
    [publishedExams]
  );

  const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

  const columns = [
    {
      title: "Exam",
      dataIndex: "title",
      render: (title, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary">{record?.subjectId?.name || "Subject not assigned"}</Text>
        </Space>
      ),
    },
    {
      title: "Schedule",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{formatDate(record?.startTime)}</Text>
          <Text type="secondary">Ends: {formatDate(record?.endTime)}</Text>
        </Space>
      ),
    },
    {
      title: "Marks",
      render: (_, record) => (
        <Text>
          {record?.passingMarks ?? 0}/{record?.totalMarks ?? 0}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color = status === "completed" ? "purple" : "green";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={record?.status !== "published"}
            onClick={() => navigate("/dashboard/student/exams/exam-live")}
          >
            Start
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate("/dashboard/student/exams/attempt-review")}
          >
            Review
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          📝 Student Exam Module
        </Title>
        <Text type="secondary">
          Apne published exams dekho, live attempt start karo, aur review page se performance check karo.
        </Text>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Available Exams</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.total}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Live Now</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.live}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Completed</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.completed}</Title>
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={publishedExams}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <Empty
                description="No published exams found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
};

export default StudentExamsPage;
