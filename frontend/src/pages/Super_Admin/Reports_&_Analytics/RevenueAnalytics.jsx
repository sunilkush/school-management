import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Select,
  Typography,
  Space,
  Avatar,
  Badge,
} from "antd";
import {
  DollarOutlined,
  RiseOutlined,
  FundOutlined,
  ArrowUpOutlined,
  BankOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
} from "recharts";

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
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
        <Text style={{ fontSize: 12, color: "#888" }}>{label}</Text>
        <br />
        <Text strong style={{ fontSize: 15, color: "#1a1a2e" }}>
          ₹{payload[0].value?.toLocaleString()}
        </Text>
      </div>
    );
  }
  return null;
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, accent, trend }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 16px #0001",
      overflow: "hidden",
      position: "relative",
    }}
    bodyStyle={{ padding: "20px 24px" }}
  >
    {/* accent bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: accent,
        borderRadius: "16px 16px 0 0",
      }}
    />
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </Text>
        <Title level={3} style={{ margin: "4px 0 2px", color: "#1a1a2e", fontWeight: 800 }}>
          {value}
        </Title>
        {sub && (
          <Space size={4}>
            <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
            <Text style={{ color: "#52c41a", fontSize: 12 }}>{sub}</Text>
          </Space>
        )}
      </div>
      <Avatar
        size={48}
        icon={icon}
        style={{ background: `${accent}18`, color: accent, flexShrink: 0 }}
      />
    </Space>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RevenueAnalytics = () => {
  const [filter, setFilter] = useState("monthly");

  const stats = {
    totalRevenue: 125000,
    monthlyRevenue: 25000,
    growth: 18,
  };

  const chartData = [
    { name: "Jan", revenue: 10000, target: 12000 },
    { name: "Feb", revenue: 15000, target: 14000 },
    { name: "Mar", revenue: 20000, target: 18000 },
    { name: "Apr", revenue: 25000, target: 22000 },
    { name: "May", revenue: 30000, target: 28000 },
  ];

  const schoolRevenue = [
    { key: 1, school: "ABC Public School", plan: "Premium", revenue: 20000, status: "Paid", growth: "+12%" },
    { key: 2, school: "XYZ Academy", plan: "Basic", revenue: 8000, status: "Pending", growth: "+5%" },
    { key: 3, school: "Green Valley School", plan: "Premium", revenue: 18500, status: "Paid", growth: "+22%" },
    { key: 4, school: "Sunrise International", plan: "Enterprise", revenue: 45000, status: "Paid", growth: "+8%" },
    { key: 5, school: "Bright Future Academy", plan: "Basic", revenue: 6000, status: "Pending", growth: "+3%" },
  ];

  const planColors = { Premium: "purple", Basic: "blue", Enterprise: "gold" };
  const planIcons = {
    Premium: <TrophyOutlined />,
    Basic: <ThunderboltOutlined />,
    Enterprise: <BankOutlined />,
  };

  const columns = [
    {
      title: "School",
      dataIndex: "school",
      render: (name) => (
        <Space>
          <Avatar size={30} icon={<BankOutlined />} style={{ background: "#e8f4ff", color: "#1677ff" }} />
          <Text strong style={{ fontSize: 13 }}>{name}</Text>
        </Space>
      ),
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
      title: "Revenue",
      dataIndex: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (v) => (
        <Text strong style={{ color: "#1a1a2e", fontSize: 14 }}>
          ₹{v.toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Growth",
      dataIndex: "growth",
      render: (g) => (
        <Space size={4}>
          <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
          <Text style={{ color: "#52c41a", fontWeight: 600 }}>{g}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [{ text: "Paid", value: "Paid" }, { text: "Pending", value: "Pending" }],
      onFilter: (v, r) => r.status === v,
      render: (status) => (
        <Badge
          status={status === "Paid" ? "success" : "warning"}
          text={
            <Tag
              color={status === "Paid" ? "green" : "orange"}
              style={{ borderRadius: 20, fontWeight: 600, padding: "0 12px" }}
            >
              {status}
            </Tag>
          }
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 28px", background: "#f5f6fa", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a1a2e", fontWeight: 800, letterSpacing: -0.5 }}>
            <DollarOutlined style={{ marginRight: 10, color: "#1677ff" }} />
            Revenue Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Track earnings, school plans, and growth in real time.
          </Text>
        </div>

        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 140, borderRadius: 8 }}
          options={[
            { label: "Monthly", value: "monthly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Yearly", value: "yearly" },
          ]}
        />
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <KpiCard
            icon={<DollarOutlined />}
            label="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            sub="vs last period"
            accent="#1677ff"
          />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard
            icon={<FundOutlined />}
            label="This Month"
            value={`₹${stats.monthlyRevenue.toLocaleString()}`}
            sub="on track"
            accent="#722ed1"
          />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard
            icon={<RiseOutlined />}
            label="Growth Rate"
            value={`${stats.growth}%`}
            sub="month-over-month"
            accent="#52c41a"
          />
        </Col>
      </Row>

      {/* ── Charts ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Area / Line Chart */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
            title={
              <Space>
                <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Revenue Trend</span>
                <Tag color="blue" style={{ borderRadius: 20, fontWeight: 500 }}>vs Target</Tag>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1677ff" strokeWidth={2.5} fill="url(#gradRevenue)" name="Revenue" dot={{ r: 4, fill: "#1677ff" }} />
                <Area type="monotone" dataKey="target" stroke="#722ed1" strokeWidth={2} strokeDasharray="5 4" fill="url(#gradTarget)" name="Target" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Bar Chart */}
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
            title={<span style={{ fontWeight: 700, color: "#1a1a2e" }}>Monthly Breakdown</span>}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={28} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#1677ff" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── Table ── */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
        title={
          <Space>
            <BankOutlined style={{ color: "#1677ff" }} />
            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>School Revenue Breakdown</span>
            <Tag style={{ borderRadius: 20 }}>{schoolRevenue.length} schools</Tag>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={schoolRevenue}
          pagination={{ pageSize: 5, style: { padding: "12px 20px" } }}
          style={{ borderRadius: "0 0 16px 16px", overflow: "hidden" }}
          rowClassName={() => "revenue-row"}
          onRow={() => ({
            style: { transition: "background 0.15s" },
            onMouseEnter: (e) => (e.currentTarget.style.background = "#f8faff"),
            onMouseLeave: (e) => (e.currentTarget.style.background = ""),
          })}
        />
      </Card>
    </div>
  );
};

export default RevenueAnalytics;