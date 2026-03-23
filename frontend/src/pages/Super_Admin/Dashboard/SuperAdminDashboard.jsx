import React from "react";
import { Card, Row, Col, Statistic, Progress, List, Tag } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const SuperAdminDashboard = () => {
  const stats = [
    {
      title: "Total Schools",
      value: 28,
      icon: <BankOutlined style={{ fontSize: 22 }} />,
      color: "#1677ff",
    },
    {
      title: "Active Schools",
      value: 24,
      icon: <CheckCircleOutlined style={{ fontSize: 22 }} />,
      color: "#52c41a",
    },
    {
      title: "Total Students",
      value: 12540,
      icon: <TeamOutlined style={{ fontSize: 22 }} />,
      color: "#722ed1",
    },
    {
      title: "Revenue",
      value: "₹4,85,000",
      icon: <DollarOutlined style={{ fontSize: 22 }} />,
      color: "#fa8c16",
    },
    {
      title: "Expiring Subscriptions",
      value: 6,
      icon: <ClockCircleOutlined style={{ fontSize: 22 }} />,
      color: "#f5222d",
    },
    {
      title: "System Health",
      value: "98%",
      icon: <ThunderboltOutlined style={{ fontSize: 22 }} />,
      color: "#13c2c2",
    },
  ];

  const activities = [
    "New school 'Green Valley School' registered",
    "Subscription renewed for 'DPS Noida'",
    "Admin 'Rahul Sharma' added to Sunrise School",
    "System backup completed successfully",
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
        Super Admin Dashboard
      </h2>

      {/* Widgets */}
      <Row gutter={[16, 16]}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={8} key={index}>
            <Card bordered={false}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={
                  <span style={{ color: item.color }}>{item.icon}</span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts / Progress */}
      <Row gutter={16} style={{ marginTop: 25 }}>
        <Col xs={24} md={12}>
          <Card title="System Health">
            <Progress percent={98} status="active" />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Subscription Status">
            <p>
              Expiring Soon <Tag color="red">6 Schools</Tag>
            </p>
            <p>
              Active Plans <Tag color="green">24 Schools</Tag>
            </p>
          </Card>
        </Col>
      </Row>

      {/* Activity */}
      <Row style={{ marginTop: 25 }}>
        <Col span={24}>
          <Card title="Recent Activity">
            <List
              dataSource={activities}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SuperAdminDashboard;