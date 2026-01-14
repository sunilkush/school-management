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
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ParentDashboard = () => {
  /* Dummy data – API se replace hoga */
  const students = [
    {
      key: 1,
      name: "Aarav Sharma",
      class: "Class 5 - A",
      attendance: 92,
      status: "Active",
    },
    {
      key: 2,
      name: "Anaya Sharma",
      class: "Class 2 - B",
      attendance: 88,
      status: "Active",
    },
  ];

  const attendanceColumns = [
    {
      title: "Student",
      dataIndex: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Class",
      dataIndex: "class",
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      render: (val) => <Progress percent={val} size="small" />,
    },
    {
      title: "Status",
      render: () => <Tag color="green">Present</Tag>,
    },
  ];

  return (
    <>
      {/* Header */}
      <Title level={3}>👋 Welcome, Parent</Title>
      <Text type="secondary">
        Here’s a quick overview of your child’s academic progress
      </Text>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Children"
              value={students.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Attendance"
              value={90}
              suffix="%"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Fees"
              value={2500}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Notifications"
              value={3}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* My Children */}
        <Col xs={24} lg={14}>
          <Card title="My Children">
            <Table
              columns={attendanceColumns}
              dataSource={students}
              pagination={false}
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
                {
                  title: "Maths Unit Test",
                  date: "25 Jan 2026",
                },
                {
                  title: "Science Practical",
                  date: "30 Jan 2026",
                },
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

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary">View Attendance</Button>
              <Button>View Results</Button>
              <Button>Pay Fees</Button>
              <Button>Messages</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ParentDashboard;
