import React from "react";
import {
  Row,
  Col,
  Card,
  Avatar,
  Progress,
  Table,
  List,
  Badge,
  Button,
  Typography,
  Calendar,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  BellOutlined,
  SmileOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

/* 🔹 Helper component for equal-height cards */
const DashboardCol = ({ children, ...props }) => (
  <Col {...props} style={{ display: "flex" }}>
    <Card hoverable style={{ flex: 1 }}>{children}</Card>
  </Col>
);

const StudentDashboard = () => {
  const attendance = { present: 20, absent: 2, leave: 1 };

  const subjects = [
    { key: 1, name: "Math", score: 95 },
    { key: 2, name: "Science", score: 88 },
    { key: 3, name: "English", score: 92 },
  ];

  const exams = [
    { key: 1, subject: "Math", date: "10 Jan 2026" },
    { key: 2, subject: "Science", date: "12 Jan 2026" },
  ];

  const notifications = [
    { key: 1, title: "Library closed tomorrow", type: "info" },
    { key: 2, title: "Submit assignment by 15th Jan", type: "warning" },
  ];

  const activities = ["Chess Club", "Football Team", "Science Fair"];

  const totalFees = 30000;
  const paidFees = 25000;

  const attendancePercent = Math.round(
    (attendance.present /
      (attendance.present + attendance.absent + attendance.leave)) *
      100
  );

  return (
    <div style={{ padding: 5, maxWidth:"100%", margin: "auto" }}>
      {/* 🔹 Header */}
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar size={72} icon={<UserOutlined />} />
          </Col>
          <Col>
            <Title level={3} style={{ marginBottom: 0 }}>
              Welcome, John Doe
            </Title>
            <Text type="secondary">Class 10-A | Roll No: 23</Text>
          </Col>
        </Row>
      </Card>

      {/* 🔹 Summary Cards */}
      <Row gutter={[16, 16]}>
        <DashboardCol xs={24} sm={12} md={6}>
          <BookOutlined style={{ fontSize: 26, color: "#1677ff" }} />
          <Title level={4}>Attendance</Title>
          <Progress percent={attendancePercent} />
          <Text>P: {attendance.present} | A: {attendance.absent} | L: {attendance.leave}</Text>
        </DashboardCol>

        <DashboardCol xs={24} sm={12} md={6}>
          <DollarCircleOutlined style={{ fontSize: 26, color: "#52c41a" }} />
          <Title level={4}>Fees</Title>
          <Text>Paid: ₹{paidFees}</Text><br />
          <Text>Pending: ₹{totalFees - paidFees}</Text>
          <Progress percent={(paidFees / totalFees) * 100} />
        </DashboardCol>

        <DashboardCol xs={24} sm={12} md={6}>
          <CalendarOutlined style={{ fontSize: 26, color: "#faad14" }} />
          <Title level={4}>Upcoming Exams</Title>
          <Text>{exams.length} Scheduled</Text>
        </DashboardCol>

        <DashboardCol xs={24} sm={12} md={6}>
          <BellOutlined style={{ fontSize: 26, color: "#f5222d" }} />
          <Title level={4}>Notifications</Title>
          <Text>{notifications.length} New</Text>
        </DashboardCol>
      </Row>

      {/* 🔹 Academic + Exams */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <DashboardCol xs={24} md={12}>
          <Title level={4}>📊 Academic Performance</Title>
          <Table
            dataSource={subjects}
            pagination={false}
            columns={[
              { title: "Subject", dataIndex: "name" },
              { title: "Score", dataIndex: "score" },
            ]}
          />
        </DashboardCol>

        <DashboardCol xs={24} md={12}>
          <Title level={4}>📝 Upcoming Exams</Title>
          <List
            dataSource={exams}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.subject}
                  description={`Date: ${item.date}`}
                />
                <Badge status="processing" text="Upcoming" />
              </List.Item>
            )}
          />
        </DashboardCol>
      </Row>

      {/* 🔹 Notifications + Activities */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <DashboardCol xs={24} md={12}>
          <Title level={4}>🔔 Notifications</Title>
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <Badge status={item.type === "info" ? "success" : "warning"} />
                <Text style={{ marginLeft: 8 }}>{item.title}</Text>
              </List.Item>
            )}
          />
        </DashboardCol>

        <DashboardCol xs={24} md={12}>
          <Title level={4}>🏅 Activities</Title>
          <List
            dataSource={activities}
            renderItem={(item) => (
              <List.Item>
                <SmileOutlined style={{ marginRight: 8 }} /> {item}
              </List.Item>
            )}
          />
        </DashboardCol>
      </Row>

      {/* 🔹 Calendar + Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <DashboardCol xs={24} md={16}>
          <Title level={4}>📅 Academic Calendar</Title>
          <Calendar fullscreen={false} />
        </DashboardCol>

        <DashboardCol xs={24} md={8}>
          <Title level={4}>⚡ Quick Actions</Title>
          <Button block type="primary" style={{ marginBottom: 8 }}>View Profile</Button>
          <Button block>Submit Assignment</Button>
          <Button block style={{ marginTop: 8 }}>Pay Fees</Button>
          <Button block type="link">Contact Teacher</Button>
        </DashboardCol>
      </Row>
    </div>
  );
};

export default StudentDashboard;
