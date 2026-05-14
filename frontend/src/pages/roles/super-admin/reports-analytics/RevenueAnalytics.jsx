import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { fetchSchools } from "../../../../features/schoolSlice";

const { Text, Title } = Typography;

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getPeriodKey = (date, mode) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const monthShort = d.toLocaleString("en-US", { month: "short" });
  const monthLong = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();

  if (mode === "yearly") {
    return { key: `${year}`, name: `${year}` };
  }

  if (mode === "quarterly") {
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    return { key: `${year}-Q${quarter}`, name: `Q${quarter} ${year}` };
  }

  return { key: `${year}-${d.getMonth() + 1}`, name: `${monthShort} ${year}`, longName: `${monthLong} ${year}` };
};

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
          {formatCurrency(payload[0].value)}
        </Text>
      </div>
    );
  }
  return null;
};

const KpiCard = ({ icon, label, value, sub, accent }) => (
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
      <Avatar size={48} icon={icon} style={{ background: `${accent}18`, color: accent, flexShrink: 0 }} />
    </Space>
  </Card>
);

const RevenueAnalytics = () => {
  const dispatch = useDispatch();
  const { schools = [], loading } = useSelector((state) => state.school);
  const [filter, setFilter] = useState("monthly");

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const schoolRevenue = useMemo(() => {
    return (schools || []).map((school, index) => {
      const plan = school.subscriptionPlan || {};
      const amount = Number(plan.price || 0);

      return {
        key: school._id || index,
        school: school.name || "Unknown School",
        plan: plan.name || "Unassigned",
        revenue: amount,
        status: school.isActive ? "Paid" : "Pending",
        growth: "+0%",
        createdAt: school.createdAt,
      };
    });
  }, [schools]);

  const chartData = useMemo(() => {
    const grouped = schoolRevenue.reduce((acc, row) => {
      const period = getPeriodKey(row.createdAt, filter);

      if (!period) {
        return acc;
      }

      if (!acc[period.key]) {
        acc[period.key] = {
          key: period.key,
          name: period.name,
          revenue: 0,
        };
      }

      acc[period.key].revenue += row.revenue;
      return acc;
    }, {});

    const sorted = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));

    return sorted.map((item, index) => {
      const prevRevenue = sorted[index - 1]?.revenue || item.revenue;
      const growth = prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : 0;

      return {
        ...item,
        target: Math.round(item.revenue * 1.1),
        growth,
      };
    });
  }, [schoolRevenue, filter]);

  const stats = useMemo(() => {
    const totalRevenue = schoolRevenue.reduce((sum, row) => sum + row.revenue, 0);
    const currentPeriodRevenue = chartData[chartData.length - 1]?.revenue || 0;
    const growth = chartData[chartData.length - 1]?.growth || 0;

    return {
      totalRevenue,
      currentPeriodRevenue,
      growth,
    };
  }, [schoolRevenue, chartData]);

  const periodLabel = filter === "yearly" ? "This Year" : filter === "quarterly" ? "This Quarter" : "This Month";

  const planColors = { Premium: "purple", Basic: "blue", Enterprise: "gold", Unassigned: "default" };
  const planIcons = {
    Premium: <TrophyOutlined />,
    Basic: <ThunderboltOutlined />,
    Enterprise: <BankOutlined />,
    Unassigned: <BankOutlined />,
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
        <Tag icon={planIcons[plan] || <BankOutlined />} color={planColors[plan] || "default"} style={{ fontWeight: 600, borderRadius: 6 }}>
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
          {formatCurrency(v)}
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
            <Tag color={status === "Paid" ? "green" : "orange"} style={{ borderRadius: 20, fontWeight: 600, padding: "0 12px" }}>
              {status}
            </Tag>
          }
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 28px", background: "#f5f6fa", minHeight: "100vh" }}>
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
            Dynamic data from school subscriptions.
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <KpiCard icon={<DollarOutlined />} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="from all schools" accent="#1677ff" />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard icon={<FundOutlined />} label={periodLabel} value={formatCurrency(stats.currentPeriodRevenue)} sub="latest period" accent="#722ed1" />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard icon={<RiseOutlined />} label="Growth Rate" value={`${stats.growth.toFixed(1)}%`} sub="period-over-period" accent="#52c41a" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
            loading={loading}
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

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
            loading={loading}
            title={<span style={{ fontWeight: 700, color: "#1a1a2e" }}>Period Breakdown</span>}
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

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
        loading={loading}
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
          loading={loading}
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