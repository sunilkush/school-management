import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Select,
  List,
  Avatar,
  Space,
  Typography,
  Badge,
  Timeline,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  BankOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const { Text, Title } = Typography;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: 10,
          padding: "10px 16px",
          boxShadow: "0 4px 20px #0001",
        }}
      >
        <Text style={{ fontSize: 12, color: "#aaa" }}>{label}</Text>
        <br />
        <Text strong style={{ fontSize: 15, color: "#1a1a2e" }}>
          {payload[0].value?.toLocaleString()} users
        </Text>
      </div>
    );
  }
  return null;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, accent, change }) => (
  <Card
    bordered={false}
    style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001", overflow: "hidden", position: "relative" }}
    bodyStyle={{ padding: "20px 24px" }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accent, borderRadius: "16px 16px 0 0" }} />
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <div>
        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </Text>
        <Title level={3} style={{ margin: "4px 0 4px", color: "#1a1a2e", fontWeight: 800 }}>
          {value}
        </Title>
        {change && (
          <Space size={4}>
            <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
            <Text style={{ color: "#52c41a", fontSize: 12 }}>{change}</Text>
          </Space>
        )}
      </div>
      <Avatar size={46} icon={icon} style={{ background: `${accent}18`, color: accent, flexShrink: 0 }} />
    </Space>
  </Card>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const PlatformUsage = () => {
  const [filter, setFilter] = useState("monthly");

  const stats = { schools: 120, users: 5400, active: 3200, revenue: 85000 };

  const chartData = [
    { name: "Jan", users: 400, active: 280 },
    { name: "Feb", users: 800, active: 560 },
    { name: "Mar", users: 1200, active: 900 },
    { name: "Apr", users: 2000, active: 1500 },
    { name: "May", users: 3000, active: 2200 },
  ];

  const tableData = [
    { key: 1, school: "ABC Public School", users: 450, plan: "Premium", usage: 70, status: "Active" },
    { key: 2, school: "XYZ Academy", users: 300, plan: "Basic", usage: 40, status: "Inactive" },
    { key: 3, school: "Green Valley School", users: 520, plan: "Enterprise", usage: 88, status: "Active" },
    { key: 4, school: "Sunrise International", users: 210, plan: "Basic", usage: 30, status: "Active" },
    { key: 5, school: "Bright Future Academy", users: 380, plan: "Premium", usage: 62, status: "Inactive" },
  ];

  const activity = [
    { title: "New School Registered", desc: "ABC School joined the platform", icon: <BankOutlined />, color: "#1677ff", time: "2 min ago" },
    { title: "Payment Received", desc: "₹5,000 received from XYZ Academy", icon: <DollarOutlined />, color: "#52c41a", time: "18 min ago" },
    { title: "User Limit Upgraded", desc: "Green Valley upgraded to Enterprise", icon: <TrophyOutlined />, color: "#722ed1", time: "1 hr ago" },
    { title: "New Users Onboarded", desc: "34 students joined Sunrise International", icon: <TeamOutlined />, color: "#fa8c16", time: "3 hr ago" },
    { title: "Report Generated", desc: "Monthly analytics report is ready", icon: <BarChartOutlined />, color: "#13c2c2", time: "Yesterday" },
  ];

  const planColors = { Premium: "purple", Basic: "blue", Enterprise: "gold" };
  const planIcons = { Premium: <TrophyOutlined />, Basic: <ThunderboltOutlined />, Enterprise: <BankOutlined /> };

  const columns = [
    {
      title: "School",
      dataIndex: "school",
      render: (name) => (
        <Space>
          <Avatar size={28} icon={<BankOutlined />} style={{ background: "#e8f4ff", color: "#1677ff" }} />
          <Text strong style={{ fontSize: 13 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Users",
      dataIndex: "users",
      sorter: (a, b) => a.users - b.users,
      render: (v) => <Text style={{ fontWeight: 600, color: "#1a1a2e" }}>{v.toLocaleString()}</Text>,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => (
        <Tag icon={planIcons[plan]} color={planColors[plan]} style={{ fontWeight: 600, borderRadius: 6 }}>
          {plan}
        </Tag>
      ),
    },
    {
      title: "Usage",
      dataIndex: "usage",
      sorter: (a, b) => a.usage - b.usage,
      render: (val) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Progress
            percent={val}
            size="small"
            strokeColor={val >= 75 ? "#52c41a" : val >= 40 ? "#1677ff" : "#faad14"}
            showInfo={false}
          />
          <Text style={{ fontSize: 11, color: "#aaa" }}>{val}% utilized</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (v, r) => r.status === v,
      render: (s) => (
        <Badge
          status={s === "Active" ? "success" : "error"}
          text={
            <Tag
              icon={s === "Active" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              color={s === "Active" ? "green" : "red"}
              style={{ borderRadius: 20, fontWeight: 600, padding: "0 10px" }}
            >
              {s}
            </Tag>
          }
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 28px", background: "#f5f6fa", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a1a2e", fontWeight: 800, letterSpacing: -0.5 }}>
            <RocketOutlined style={{ marginRight: 10, color: "#1677ff" }} />
            Super Admin Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Platform-wide overview — schools, users, usage, and revenue.
          </Text>
        </div>
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 140 }}
          options={[
            { label: "Daily", value: "daily" },
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
          ]}
        />
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<DatabaseOutlined />} label="Total Schools" value={stats.schools} change="+8 this month" accent="#1677ff" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<TeamOutlined />} label="Total Users" value={stats.users.toLocaleString()} change="+320 this week" accent="#722ed1" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<UserOutlined />} label="Active Users" value={stats.active.toLocaleString()} change="59% of total" accent="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard icon={<DollarOutlined />} label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} change="+18% growth" accent="#fa8c16" />
        </Col>
      </Row>

      {/* ── Area Chart ── */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001", marginBottom: 24 }}
        title={
          <Space>
            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>User Growth</span>
            <Tag color="blue" style={{ borderRadius: 20 }}>Total</Tag>
            <Tag color="green" style={{ borderRadius: 20 }}>Active</Tag>
          </Space>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1677ff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="users" stroke="#1677ff" strokeWidth={2.5} fill="url(#gradUsers)" name="Total Users" dot={{ r: 4, fill: "#1677ff" }} />
            <Area type="monotone" dataKey="active" stroke="#52c41a" strokeWidth={2} fill="url(#gradActive)" name="Active Users" dot={{ r: 3, fill: "#52c41a" }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Table + Activity ── */}
      <Row gutter={[16, 16]}>
        {/* Table */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
            title={
              <Space>
                <BankOutlined style={{ color: "#1677ff" }} />
                <span style={{ fontWeight: 700, color: "#1a1a2e" }}>School Usage</span>
                <Tag style={{ borderRadius: 20 }}>{tableData.length} schools</Tag>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={{ pageSize: 5, style: { padding: "12px 20px" } }}
              style={{ borderRadius: "0 0 16px 16px", overflow: "hidden" }}
              onRow={() => ({
                style: { transition: "background 0.15s" },
                onMouseEnter: (e) => (e.currentTarget.style.background = "#f8faff"),
                onMouseLeave: (e) => (e.currentTarget.style.background = ""),
              })}
            />
          </Card>
        </Col>

        {/* Activity Feed */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001", height: "100%" }}
            title={
              <Space>
                <BellOutlined style={{ color: "#fa8c16" }} />
                <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Recent Activity</span>
              </Space>
            }
          >
            <Timeline
              items={activity.map((a) => ({
                dot: (
                  <Avatar
                    size={28}
                    icon={a.icon}
                    style={{ background: `${a.color}18`, color: a.color }}
                  />
                ),
                children: (
                  <div style={{ paddingBottom: 4 }}>
                    <Text strong style={{ fontSize: 13, color: "#1a1a2e" }}>{a.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{a.desc}</Text>
                    <br />
                    <Text style={{ fontSize: 11, color: "#bbb" }}>{a.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlatformUsage;