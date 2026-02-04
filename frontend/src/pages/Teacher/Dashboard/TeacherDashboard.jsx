import React from "react";
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
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const TeacherDashboard = () => {
  /* ===== Dummy Data ===== */
  const stats = [
    {
      title: "Total Classes",
      value: 24,
      icon: <BookOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Today Classes",
      value: 5,
      icon: <CalendarOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Attendance %",
      value: "92%",
      icon: <CheckCircleOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Pending Tasks",
      value: 3,
      icon: <FileTextOutlined style={{ fontSize: 22 }} />,
    },
  ];

  const todaySchedule = [
    { subject: "Mathematics", class: "10-A", time: "09:00 AM" },
    { subject: "Science", class: "9-B", time: "10:30 AM" },
    { subject: "Physics", class: "11-C", time: "12:00 PM" },
  ];

  const announcements = [
    "Unit Test starts from 10 Feb",
    "Upload Attendance before 4 PM",
    "Staff Meeting on Friday",
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <Content style={{ padding: "24px" }}>
        {/* ===== Header ===== */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Teacher Dashboard
            </Title>
            <Text type="secondary">Welcome back, Teacher 👋</Text>
          </Col>

          <Col>
            <Space>
              <Avatar size={45} icon={<UserOutlined />} />
            </Space>
          </Col>
        </Row>

        {/* ===== Stats Cards ===== */}
        <Row gutter={[16, 16]}>
          {stats.map((item, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card bordered={false} style={{ borderRadius: 12 }}>
                <Space align="start">
                  <Avatar
                    size={48}
                    style={{ background: "#1677ff" }}
                    icon={item.icon}
                  />
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

        {/* ===== Middle Section ===== */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* ===== Today Schedule ===== */}
          <Col xs={24} md={14}>
            <Card title="Today's Schedule" bordered={false} style={{ borderRadius: 12 }}>
              <List
                dataSource={todaySchedule}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<BookOutlined />} />}
                      title={`${item.subject} - ${item.class}`}
                      description={`Time : ${item.time}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* ===== Quick Actions ===== */}
          <Col xs={24} md={10}>
            <Card title="Quick Actions" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" block>
                  Mark Attendance
                </Button>
                <Button block>Upload Homework</Button>
                <Button block>Enter Marks</Button>
                <Button block>View Students</Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* ===== Bottom Section ===== */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* ===== Performance ===== */}
          <Col xs={24} md={12}>
            <Card title="Class Performance" bordered={false} style={{ borderRadius: 12 }}>
              <Text>Overall Student Performance</Text>
              <Progress percent={78} style={{ marginTop: 10 }} />
            </Card>
          </Col>

          {/* ===== Announcements ===== */}
          <Col xs={24} md={12}>
            <Card title="Announcements" bordered={false} style={{ borderRadius: 12 }}>
              <List
                dataSource={announcements}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default TeacherDashboard;
