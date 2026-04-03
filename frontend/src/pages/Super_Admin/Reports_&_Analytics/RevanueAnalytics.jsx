import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
} from "antd";
import {
  DollarOutlined,
  RiseOutlined,
  FundOutlined,
} from "@ant-design/icons";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const { Option } = Select;

const RevanueAnalytics = () => {
  const [filter, setFilter] = useState("monthly");

  // ===== Dummy Data =====
  const stats = {
    totalRevenue: 125000,
    monthlyRevenue: 25000,
    growth: 18,
  };

  const chartData = [
    { name: "Jan", revenue: 10000 },
    { name: "Feb", revenue: 15000 },
    { name: "Mar", revenue: 20000 },
    { name: "Apr", revenue: 25000 },
    { name: "May", revenue: 30000 },
  ];

  const schoolRevenue = [
    {
      key: 1,
      school: "ABC Public School",
      plan: "Premium",
      revenue: 20000,
      status: "Paid",
    },
    {
      key: 2,
      school: "XYZ Academy",
      plan: "Basic",
      revenue: 8000,
      status: "Pending",
    },
  ];

  const columns = [
    {
      title: "School",
      dataIndex: "school",
    },
    {
      title: "Plan",
      dataIndex: "plan",
    },
    {
      title: "Revenue (₹)",
      dataIndex: "revenue",
    },
    {
      title: "Payment Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Paid" ? "green" : "orange"}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f6fa", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700 }}>💰 Revenue Analytics</h2>

        <Select value={filter} onChange={setFilter} style={{ width: 150 }}>
          <Option value="monthly">Monthly</Option>
          <Option value="yearly">Yearly</Option>
        </Select>
      </div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₹"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="This Month"
              value={stats.monthlyRevenue}
              prefix={<FundOutlined />}
              suffix="₹"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Growth"
              value={stats.growth}
              prefix={<RiseOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* CHARTS */}
      <Row gutter={16} style={{ marginTop: 20 }}>
        
        {/* LINE CHART */}
        <Col span={12}>
          <Card title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6c5ce7"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* BAR CHART */}
        <Col span={12}>
          <Card title="Monthly Revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#00b894" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* TABLE */}
      <Card title="School Revenue" style={{ marginTop: 20 }}>
        <Table
          columns={columns}
          dataSource={schoolRevenue}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default RevanueAnalytics;