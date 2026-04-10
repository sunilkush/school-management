import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Select,
  Avatar,
  Space,
  Typography,
  Badge,
  Timeline,
  Button,
  Spin,
  Alert,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
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
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllUser } from "../../../features/authSlice";

const { Text, Title } = Typography;

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
          {payload[0]?.value?.toLocaleString?.() || 0} users
        </Text>
      </div>
    );
  }
  return null;
};

const KpiCard = ({ icon, label, value, accent, change }) => (
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
        <Text
          type="secondary"
          style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}
        >
          {label}
        </Text>
        <Title
          level={3}
          style={{ margin: "4px 0 4px", color: "#1a1a2e", fontWeight: 800 }}
        >
          {value}
        </Title>
        {change && (
          <Space size={4}>
            <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
            <Text style={{ color: "#52c41a", fontSize: 12 }}>{change}</Text>
          </Space>
        )}
      </div>
      <Avatar
        size={46}
        icon={icon}
        style={{ background: `${accent}18`, color: accent, flexShrink: 0 }}
      />
    </Space>
  </Card>
);

const PlatformUsage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("monthly");

  const {
    schools = [],
    loading: schoolsLoading,
    error: schoolsError,
  } = useSelector((state) => state.school || {});

  const {
    users: rawUsers = [],
    loading: usersLoading,
    error: usersError,
  } = useSelector((state) => state.auth || {});

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchAllUser({}));
  }, [dispatch]);

  const users = useMemo(() => {
    if (Array.isArray(rawUsers)) return rawUsers;
    if (Array.isArray(rawUsers?.users)) return rawUsers.users;
    if (Array.isArray(rawUsers?.docs)) return rawUsers.docs;
    return [];
  }, [rawUsers]);

  const { stats, tableData, activity, planColors, planIcons } = useMemo(() => {
    const schoolsList = Array.isArray(schools) ? schools : [];
    const usersList = Array.isArray(users) ? users : [];

    const activeUsers = usersList.filter((u) => u?.isActive).length;

    const totalRevenue = schoolsList.reduce((sum, school) => {
      return (
        sum +
        Number(
          school?.subscriptionPlan?.price ||
            school?.subscriptionPlan?.amount ||
            0
        )
      );
    }, 0);

    const usersBySchool = usersList.reduce((acc, user) => {
      const schoolId = user?.school?._id || user?.schoolId;
      if (!schoolId) return acc;
      acc[schoolId] = (acc[schoolId] || 0) + 1;
      return acc;
    }, {});

    const schoolRows = schoolsList.map((school, index) => {
      const schoolId = school?._id;
      const schoolUsers = usersBySchool[schoolId] || 0;
      const userLimit = Number(school?.subscriptionPlan?.userLimit || 0);
      const usage =
        userLimit > 0
          ? Math.min(100, Math.round((schoolUsers / userLimit) * 100))
          : 0;

      return {
        key: schoolId || `${school?.name || "school"}-${index}`,
        school: school?.name || "Unnamed School",
        users: schoolUsers,
        plan: school?.subscriptionPlan?.name || "Basic",
        usage,
        status: school?.isActive ? "Active" : "Inactive",
        createdAt: school?.createdAt,
      };
    });

    const planIconMap = {
      Premium: <TrophyOutlined />,
      Basic: <ThunderboltOutlined />,
      Enterprise: <BankOutlined />,
    };

    const planColorMap = {
      Premium: "purple",
      Basic: "blue",
      Enterprise: "gold",
    };

    const recentSchoolActivity = schoolRows
      .filter((row) => row.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((row, idx) => ({
        title: `${row.school} updated`,
        desc: `${row.users.toLocaleString()} users onboarded on ${row.plan} plan`,
        icon: <BankOutlined />,
        color: idx % 2 === 0 ? "#1677ff" : "#13c2c2",
        time: new Date(row.createdAt).toLocaleDateString(),
      }));

    return {
      stats: {
        schools: schoolsList.length,
        users: usersList.length,
        active: activeUsers,
        revenue: totalRevenue,
      },
      tableData: schoolRows,
      activity: recentSchoolActivity,
      planColors: planColorMap,
      planIcons: planIconMap,
    };
  }, [schools, users]);

  const chartData = useMemo(() => {
    const points = filter === "daily" ? 7 : filter === "yearly" ? 12 : 6;

    const labels =
      filter === "daily"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : filter === "yearly"
        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return Array.from({ length: points }, (_, index) => {
      const schoolSlice = tableData.slice(
        0,
        Math.max(1, Math.ceil(((index + 1) / points) * tableData.length))
      );

      const usersCount = schoolSlice.reduce((sum, s) => sum + (s.users || 0), 0);
      const activeApprox = Math.round(
        usersCount * (stats.users ? stats.active / stats.users : 0)
      );

      return {
        name: labels[index] || `P${index + 1}`,
        users: usersCount,
        active: activeApprox,
      };
    });
  }, [filter, tableData, stats.active, stats.users]);

  const loading = schoolsLoading || usersLoading;
  const errorMessage = schoolsError || usersError;

  const columns = [
    {
      title: "School",
      dataIndex: "school",
      render: (name) => (
        <Space>
          <Avatar
            size={28}
            icon={<BankOutlined />}
            style={{ background: "#e8f4ff", color: "#1677ff" }}
          />
          <Text strong style={{ fontSize: 13 }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: "Users",
      dataIndex: "users",
      sorter: (a, b) => a.users - b.users,
      render: (v) => (
        <Text style={{ fontWeight: 600, color: "#1a1a2e" }}>
          {Number(v || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => (
        <Tag
          icon={planIcons[plan]}
          color={planColors[plan]}
          style={{ fontWeight: 600, borderRadius: 6 }}
        >
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
            strokeColor={
              val >= 75 ? "#52c41a" : val >= 40 ? "#1677ff" : "#faad14"
            }
            showInfo={false}
          />
          <Text style={{ fontSize: 11, color: "#aaa" }}>{val}% utilized</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Badge
          status={status === "Active" ? "success" : "error"}
          text={
            <Tag
              icon={
                status === "Active" ? (
                  <CheckCircleOutlined />
                ) : (
                  <ClockCircleOutlined />
                )
              }
              color={status === "Active" ? "green" : "red"}
              style={{
                borderRadius: 20,
                fontWeight: 600,
                padding: "0 10px",
              }}
            >
              {status}
            </Tag>
          }
        />
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px 28px",
        background: "#f5f6fa",
        minHeight: "100vh",
      }}
    >
      {errorMessage ? (
        <Alert
          type="warning"
          showIcon
          message="Some analytics data could not be loaded"
          description={errorMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}

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
          <Title
            level={3}
            style={{
              margin: 0,
              color: "#1a1a2e",
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            <RocketOutlined style={{ marginRight: 10, color: "#1677ff" }} />
            Super Admin Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Platform-wide overview — schools, users, usage, and revenue.
          </Text>
        </div>

        <Space wrap>
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
          <Button
            onClick={() =>
              navigate("/dashboard/superadmin/reports/revenue")
            }
          >
            Go to Revenue Analytics
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              icon={<DatabaseOutlined />}
              label="Total Schools"
              value={stats.schools}
              change="+8 this month"
              accent="#1677ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              icon={<TeamOutlined />}
              label="Total Users"
              value={stats.users.toLocaleString()}
              change="+320 this week"
              accent="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              icon={<UserOutlined />}
              label="Active Users"
              value={stats.active.toLocaleString()}
              change="59% of total"
              accent="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              icon={<DollarOutlined />}
              label="Revenue"
              value={`₹${stats.revenue.toLocaleString()}`}
              change="+18% growth"
              accent="#fa8c16"
            />
          </Col>
        </Row>

        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 2px 16px #0001",
            marginBottom: 24,
          }}
          title={
            <Space>
              <span style={{ fontWeight: 700, color: "#1a1a2e" }}>
                User Growth
              </span>
              <Tag color="blue" style={{ borderRadius: 20 }}>
                Total
              </Tag>
              <Tag color="green" style={{ borderRadius: 20 }}>
                Active
              </Tag>
            </Space>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#999" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#bbb" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#1677ff"
                strokeWidth={2.5}
                fill="url(#gradUsers)"
                name="Total Users"
                dot={{ r: 4, fill: "#1677ff" }}
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#52c41a"
                strokeWidth={2}
                fill="url(#gradActive)"
                name="Active Users"
                dot={{ r: 3, fill: "#52c41a" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: "0 2px 16px #0001" }}
              title={
                <Space>
                  <BankOutlined style={{ color: "#1677ff" }} />
                  <span style={{ fontWeight: 700, color: "#1a1a2e" }}>
                    School Usage
                  </span>
                  <Tag style={{ borderRadius: 20 }}>
                    {tableData.length} schools
                  </Tag>
                </Space>
              }
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={{ pageSize: 5, style: { padding: "12px 20px" } }}
                style={{
                  borderRadius: "0 0 16px 16px",
                  overflow: "hidden",
                }}
                locale={{ emptyText: "No school data available" }}
                onRow={() => ({
                  style: { transition: "background 0.15s" },
                  onMouseEnter: (e) =>
                    (e.currentTarget.style.background = "#f8faff"),
                  onMouseLeave: (e) =>
                    (e.currentTarget.style.background = ""),
                })}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 16px #0001",
                height: "100%",
              }}
              title={
                <Space>
                  <BellOutlined style={{ color: "#fa8c16" }} />
                  <span style={{ fontWeight: 700, color: "#1a1a2e" }}>
                    Recent Activity
                  </span>
                </Space>
              }
            >
              <Timeline
                items={(activity.length
                  ? activity
                  : [
                      {
                        title: "No recent activity",
                        desc: "No school onboarding activity found yet.",
                        icon: <BellOutlined />,
                        color: "#bbb",
                        time: "—",
                      },
                    ]
                ).map((item) => ({
                  dot: (
                    <Avatar
                      size={28}
                      icon={item.icon}
                      style={{
                        background: `${item.color}18`,
                        color: item.color,
                      }}
                    />
                  ),
                  children: (
                    <div style={{ paddingBottom: 4 }}>
                      <Text
                        strong
                        style={{ fontSize: 13, color: "#1a1a2e" }}
                      >
                        {item.title}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.desc}
                      </Text>
                      <br />
                      <Text style={{ fontSize: 11, color: "#bbb" }}>
                        {item.time}
                      </Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default PlatformUsage;