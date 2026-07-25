import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
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
  RocketOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  BankOutlined,
  BellOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
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
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-muted)",
          borderRadius: 10,
          padding: "10px 16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</Text>
        <br />
        <Text strong style={{ fontSize: 15, color: "var(--text-primary)" }}>
          {payload[0]?.value?.toLocaleString?.() || 0} users
        </Text>
      </div>
    );
  }
  return null;
};

const KpiCard = ({ icon, label, value, accent, change }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 0 }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
        {value}
      </div>
      {change && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <ArrowUpOutlined style={{ color: "#22C55E", fontSize: 11 }} />
          <span style={{ color: "#22C55E", fontSize: 12 }}>{change}</span>
        </div>
      )}
    </div>
    <div style={iconWell(accent, 46)}>{icon}</div>
  </div>
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
      const userLimit = Number(school?.subscriptionPlan?.limits?.maxUsers || 0);
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
        color: idx % 2 === 0 ? "#2563EB" : "#13c2c2",
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
            style={{ background: "rgba(37,99,235,0.15)", color: "#2563EB" }}
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
        <Text style={{ fontWeight: 600, color: "var(--text-primary)" }}>
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
              val >= 75 ? "#22C55E" : val >= 40 ? "#2563EB" : "#F59E0B"
            }
            showInfo={false}
          />
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{val}% utilized</Text>
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
    <div style={pageWrapper}>
      <PageHeader
        title="Super Admin Analytics"
        subtitle="Platform-wide overview — schools, users, usage, and revenue."
        icon={<RocketOutlined />}
        extra={
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
        }
      />

      {errorMessage ? (
        <Alert
          type="warning"
          showIcon
          message="Some analytics data could not be loaded"
          description={errorMessage}
          style={{ marginTop: 20 }}
        />
      ) : null}

      <Spin spinning={loading}>
        <div style={{ ...statGrid(220), marginTop: 20 }}>
          <KpiCard
            icon={<DatabaseOutlined />}
            label="Total Schools"
            value={stats.schools}
            change="+8 this month"
            accent="#2563EB"
          />
          <KpiCard
            icon={<TeamOutlined />}
            label="Total Users"
            value={stats.users.toLocaleString()}
            change="+320 this week"
            accent="#722ed1"
          />
          <KpiCard
            icon={<UserOutlined />}
            label="Active Users"
            value={stats.active.toLocaleString()}
            change="59% of total"
            accent="#22C55E"
          />
          <KpiCard
            icon={<RupeeIcon />}
            label="Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            change="+18% growth"
            accent="#fa8c16"
          />
        </div>

        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>User Growth</span>
            <Tag color="blue" style={{ borderRadius: 20 }}>Total</Tag>
            <Tag color="green" style={{ borderRadius: 20 }}>Active</Tag>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#gradUsers)"
                name="Total Users"
                dot={{ r: 4, fill: "#2563EB" }}
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#gradActive)"
                name="Active Users"
                dot={{ r: 3, fill: "#22C55E" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .platform-usage-grid { grid-template-columns: 1fr !important; }
          }
          ${tableHeadCss("platform-usage-tbl")}
        `}</style>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }} className="platform-usage-grid">
          <div style={{ ...sectionPanel, padding: 0 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-muted)", display: "flex", alignItems: "center", gap: 10 }}>
              <BankOutlined style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>School Usage</span>
              <Tag style={{ borderRadius: 20 }}>{tableData.length} schools</Tag>
            </div>
            <div className="platform-usage-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={{ pageSize: 5, style: { padding: "12px 20px" } }}
                locale={{ emptyText: "No school data available" }}
              />
            </div>
          </div>

          <div style={sectionPanel}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <BellOutlined style={{ color: "#fa8c16" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Recent Activity</span>
            </div>
            <Timeline
              items={(activity.length
                ? activity
                : [
                    {
                      title: "No recent activity",
                      desc: "No school onboarding activity found yet.",
                      icon: <BellOutlined />,
                      color: "#94A3B8",
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
                      style={{ fontSize: 13, color: "var(--text-primary)" }}
                    >
                      {item.title}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.desc}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {item.time}
                    </Text>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default PlatformUsage;
