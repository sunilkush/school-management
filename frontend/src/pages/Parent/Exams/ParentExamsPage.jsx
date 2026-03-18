import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { getExams } from "../../../features/examSlice.js";

const { Title, Text } = Typography;

const ParentExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], loading } = useSelector((state) => state.exams || {});

  const selectedAcademicYear = useMemo(() => {
    const stored = localStorage.getItem("selectedAcademicYear");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const academicYearId = selectedAcademicYear?._id || null;
  const schoolId = selectedAcademicYear?.schoolId || null;

  useEffect(() => {
    if (schoolId) {
      dispatch(getExams({ schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  const visibleExams = useMemo(
    () => exams.filter((exam) => ["published", "completed"].includes(exam?.status)),
    [exams]
  );

  const stats = useMemo(
    () => ({
      total: visibleExams.length,
      upcoming: visibleExams.filter((exam) => exam?.status === "published").length,
      archived: visibleExams.filter((exam) => exam?.status === "completed").length,
    }),
    [visibleExams]
  );

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
      title: "Date",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record?.examDate ? new Date(record.examDate).toLocaleDateString() : "-"}</Text>
          <Text type="secondary">
            {record?.durationMinutes ? `${record.durationMinutes} mins` : "Duration not set"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "completed" ? "purple" : "green"}>{status?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Result Access",
      render: (_, record) => (
        <Button icon={<BarChartOutlined />} onClick={() => navigate("/dashboard/parent/reports") }>
          {record?.status === "completed" ? "View Result" : "View Exam Updates"}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          👨‍👩‍👧 Parent Exam Module
        </Title>
        <Text type="secondary">
          Child ke upcoming exams aur completed exam updates ek jagah dekho, aur reports section se result follow karo.
        </Text>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Visible Exams</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.total}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Upcoming / Active</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.upcoming}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Completed</Text>
            <Title level={3} style={{ margin: 0 }}>{stats.archived}</Title>
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={visibleExams}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <Empty
                description="No exam updates found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
};

export default ParentExamsPage;
