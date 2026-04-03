import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Select,
  List,
  Avatar,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const { Option } = Select;

const PlatfromUsage = () => {
  const [filter, setFilter] = useState("monthly");

  // ===== Dummy Data =====
  const stats = {
    schools: 120,
    users: 5400,
    active: 3200,
    revenue: 85000,
  };

  const chartData = [
    { name: "Jan", users: 400 },
    { name: "Feb", users: 800 },
    { name: "Mar", users: 1200 },
    { name: "Apr", users: 2000 },
    { name: "May", users: 3000 },
  ];

  const tableData = [
    {
      key: 1,
      school: "ABC Public School",
      users: 450,
      plan: "Premium",
      usage: 70,
      status: "Active",
    },
    {
      key: 2,
      school: "XYZ Academy",
      users: 300,
      plan: "Basic",
      usage: 40,
      status: "Inactive",
    },
  ];

  const activity = [
    {
      title: "New School Registered",
      desc: "ABC School joined platform",
    },
    {
      title: "Payment Received",
      desc: "₹5000 from XYZ Academy",
    },
  ];

  const columns = [
    { title: "School", dataIndex: "school" },
    { title: "Users", dataIndex: "users" },
    { title: "Plan", dataIndex: "plan" },
    {
      title: "Usage",
      dataIndex: "usage",
      render: (val) => <Progress percent={val} size="small" />,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "Active" ? "green" : "red"}>{s}</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f6fa", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700 }}>🚀 Super Admin Analytics</h2>

        <Select value={filter} onChange={setFilter} style={{ width: 150 }}>
          <Option value="daily">Daily</Option>
          <Option value="monthly">Monthly</Option>
          <Option value="yearly">Yearly</Option>
        </Select>
      </div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Schools" value={stats.schools} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Users" value={stats.users} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Users" value={stats.active} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Revenue (₹)" value={stats.revenue} prefix={<BarChartOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* CHART */}
      <Card title="User Growth" style={{ marginTop: 20 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#6c5ce7" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* TABLE + ACTIVITY */}
      <Row gutter={16} style={{ marginTop: 20 }}>
        
        {/* TABLE */}
        <Col span={16}>
          <Card title="School Usage">
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>

        {/* ACTIVITY FEED */}
        <Col span={8}>
          <Card title="Recent Activity">
            <List
              itemLayout="horizontal"
              dataSource={activity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.title}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlatfromUsage;