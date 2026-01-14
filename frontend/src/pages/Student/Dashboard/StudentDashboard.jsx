import React from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  List,
  Avatar,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  BellOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const StudentDashboard = () => {
  /* Dummy data – API se replace hoga */
  const student = {
    name: "Aarav Sharma",
    class: "Class 5 - A",
    attendance: 92,
    subjects: 6,
    pendingFees: 1200,
  };

  const attendanceData = [
    { key: 1, subject: "Maths", percentage: 95 },
    { key: 2, subject: "Science", percentage: 90 },
    { key: 3, subject: "English", percentage: 88 },
  ];

  return (
    <>
      {/* Header */}
      <Space direction="vertical" size={0}>
        <Title level={3}>👋 Welcome, {student.name}</Title>
        <Text type="secondary">
          {student.class} • Track your academic progress
        </Text>
      </Space>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Attendance"
              value={student.attendance}
              suffix="%"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Subjects"
              value={student.subjects}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Fees"
              value={student.pendingFees}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Notifications"
              value={4}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Attendance Overview */}
        <Col xs={24} lg={14}>
          <Card title="Attendance Overview">
            <Table
              pagination={false}
              dataSource={attendanceData}
              rowKey="key"
              columns={[
                {
                  title: "Subject",
                  dataIndex: "subject",
                },
                {
                  title: "Attendance %",
                  dataIndex: "percentage",
                  render: (val) => <Progress percent={val} size="small" />,
                },
                {
                  title: "Status",
                  render: (_, record) =>
                    record.percentage >= 75 ? (
                      <Tag color="green">Good</Tag>
                    ) : (
                      <Tag color="red">Low</Tag>
                    ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right Panel */}
        <Col xs={24} lg={10}>
          {/* Upcoming Exams */}
          <Card title="Upcoming Exams">
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: "Maths Unit Test", date: "25 Jan 2026" },
                { title: "Science Practical", date: "30 Jan 2026" },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} />}
                    title={item.title}
                    description={item.date}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Assignments */}
          <Card title="Pending Assignments" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={[
                "Maths Homework – Chapter 6",
                "English Essay Submission",
                "Science Lab Record",
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <FileTextOutlined />
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary">View Attendance</Button>
              <Button>View Results</Button>
              <Button>Assignments</Button>
              <Button>Messages</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default StudentDashboard;
