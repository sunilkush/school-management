import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Badge,
  Avatar,
  Button,
  Progress,
  List,
  Typography,
  Space,
  Dropdown,
  Tooltip,
  Divider,
  Timeline,
  Segmented,
  message,
  Spin,
  Alert,
  Empty,
} from "antd";
import {
  BankOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  BellOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  ThunderboltFilled,
  SafetyCertificateOutlined,
  LinkOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetSuperAdminDashboardSummaryQuery,
  useGetSuperAdminSchoolsQuery,
} from "../../../services/schoolDashboardApi";
import { fetchActivityLogs } from "../../../features/activitySlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";

const { Content } = Layout;
const { Text } = Typography;

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const statusConfig = {
  active: { color: "success", label: "Active" },
  suspended: { color: "error", label: "Suspended" },
  pending: { color: "warning", label: "Pending" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatMoney = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// Map an activity-log action string to a reasonable icon + color
const getActivityMeta = (action = "") => {
  const a = action.toLowerCase();
  if (a.includes("school") || a.includes("register"))
    return { icon: <BankOutlined />, color: "var(--success, #5BA89A)" };
  if (a.includes("subscri") || a.includes("payment") || a.includes("fee"))
    return { icon: <DollarOutlined />, color: "var(--primary, #1677ff)" };
  if (a.includes("user") || a.includes("admin") || a.includes("teacher"))
    return { icon: <UserOutlined />, color: "var(--purple, #722ed1)" };
  if (a.includes("backup") || a.includes("system"))
    return { icon: <ThunderboltFilled />, color: "var(--cyan, #13c2c2)" };
  if (a.includes("warn") || a.includes("expir") || a.includes("suspend"))
    return { icon: <WarningOutlined />, color: "var(--warning, #fa8c16)" };
  return { icon: <ThunderboltFilled />, color: "var(--textMuted, #94a3b8)" };
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ---------------------------------------------------------------------------
// PastelStatCard — pastel left-accent KPI card design
// ---------------------------------------------------------------------------
const StatCard = ({ title, value, icon, color, iconBg, cardAccent, delta, deltaType, suffix }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(91,158,201,0.07), 0 4px 20px rgba(91,158,201,0.05)",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      borderLeft: `4px solid ${cardAccent || color}`,
      background: "#ffffff",
    }}
    bodyStyle={{ padding: "20px 22px" }}
  >
    {/* Background glow */}
    <div
      style={{
        position: "absolute",
        top: -30, right: -30,
        width: 100, height: 100,
        borderRadius: "50%",
        background: cardAccent || color,
        opacity: 0.05,
        pointerEvents: "none",
      }}
    />
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
        <Text style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
          {title}
        </Text>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: iconBg || `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </Space>

      <Statistic
        value={value}
        suffix={suffix}
        valueStyle={{
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.25,
        }}
      />

      {delta && (
        <Space size={4}>
          {deltaType === "up" ? (
            <ArrowUpOutlined style={{ color: "var(--success)", fontSize: 11 }} />
          ) : (
            <ArrowDownOutlined style={{ color: "var(--danger)", fontSize: 11 }} />
          )}
          <Text style={{ fontSize: 11, color: deltaType === "up" ? "var(--success)" : "var(--danger)" }}>
            {delta}
          </Text>
        </Space>
      )}
    </Space>
  </Card>
);

// ---------------------------------------------------------------------------
// Quick-action route map (pastel accents)
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  {
    label: "Add New School",
    icon: <BankOutlined />,
    color: "#5B9EC9",
    iconBg: "rgba(167,199,231,0.22)",
    route: "/dashboard/superadmin/schools",
  },
  {
    label: "Manage Subscriptions",
    icon: <SafetyCertificateOutlined />,
    color: "#9B87B8",
    iconBg: "rgba(205,180,219,0.22)",
    route: "/dashboard/superadmin/subscriptions",
  },
  {
    label: "View All Users",
    icon: <TeamOutlined />,
    color: "#5BA89A",
    iconBg: "rgba(184,224,210,0.22)",
    route: "/dashboard/superadmin/users",
  },
  {
    label: "Financial Reports",
    icon: <DollarOutlined />,
    color: "#5BA89A",
    iconBg: "rgba(184,224,210,0.22)",
    route: "/dashboard/superadmin/reports/revenue",
  },
  {
    label: "System Logs",
    icon: <ThunderboltFilled />,
    color: "#D4922A",
    iconBg: "rgba(253,226,167,0.30)",
    route: "/dashboard/superadmin/settings/audit",
  },
  {
    label: "Send Notification",
    icon: <BellOutlined />,
    color: "#D96B7A",
    iconBg: "rgba(255,202,212,0.25)",
    route: "/dashboard/superadmin/notifications",
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const SuperAdminDashboard = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Activity slice
  const {
    logs: activityLogs = [],
    loading: activityLoading,
  } = useSelector((state) => state.activity || {});

  // School dashboard API (RTK Query)
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetSuperAdminDashboardSummaryQuery();

  const {
    data: schoolsApiData,
    isLoading: schoolsLoading,
    isFetching: schoolsFetching,
    error: schoolsError,
    refetch: refetchSchools,
  } = useGetSuperAdminSchoolsQuery({ page: 1, limit: 100 });

  // Fetch activity logs on mount
  useEffect(() => {
    dispatch(fetchActivityLogs());
  }, [dispatch]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const schoolsData = useMemo(() => {
    return (schoolsApiData?.schools || []).map((school, index) => {
      const plan = school?.subscriptionPlan?.name || "Unassigned";
      const endDate = school?.subscriptionPlan?.endDate;

      return {
        key: school?._id || String(index),
        _id: school?._id,
        name: school?.name || "School",
        city: school?.address || "N/A",
        students: Number(school?.studentsCount || 0),
        teachers: Number(school?.teachersCount || 0),
        status: school?.isActive ? "active" : "suspended",
        subscription: plan,
        subExpiry: endDate
          ? new Date(endDate).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })
          : "N/A",
        revenue: Number(school?.revenue || 0),
        health: school?.isActive ? 100 : 0,
      };
    });
  }, [schoolsApiData]);

  const filteredSchools = useMemo(() => {
    return statusFilter === "all"
      ? schoolsData
      : schoolsData.filter((school) => school.status === statusFilter);
  }, [schoolsData, statusFilter]);

  const metrics = useMemo(() => {
    const totalSchools = Number(summaryData?.schools ?? schoolsData.length);
    const activeSchools = schoolsData.filter((s) => s.status === "active").length;
    const totalStudents =
      Number(summaryData?.students) ||
      schoolsData.reduce((sum, s) => sum + (s.students || 0), 0);
    const totalRevenue =
      Number(summaryData?.feesCollected) ||
      schoolsData.reduce((sum, s) => sum + (s.revenue || 0), 0);

    const expiringSoon = schoolsData.filter(
      (s) => s.subscription !== "Trial" && s.status !== "active"
    ).length;

    const avgHealth = Math.round(
      schoolsData.reduce((sum, s) => sum + (s.health || 0), 0) /
        Math.max(schoolsData.length, 1)
    );

    return {
      totalSchools,
      activeSchools,
      totalStudents,
      totalRevenue,
      expiringSoon,
      avgHealth,
    };
  }, [schoolsData, summaryData]);

  const topSchools = useMemo(() => {
    return [...schoolsData]
      .sort((a, b) => b.students - a.students)
      .slice(0, 4)
      .map((school, index) => ({
        ...school,
        color: ["#5B9EC9", "#9B87B8", "#5BA89A", "#D4922A"][index],
      }));
  }, [schoolsData]);

  const maxStudents = topSchools[0]?.students || 1;

  const subscriptionCounts = useMemo(
    () => [
      {
        label: "Premium Plans",
        count: schoolsData.filter((s) => s.subscription === "Premium").length,
        color: "#5B9EC9",
        textColor: "#2E6A9A",
        bg: "rgba(167,199,231,0.18)",
        border: "rgba(167,199,231,0.4)",
      },
      {
        label: "Standard Plans",
        count: schoolsData.filter((s) => s.subscription === "Standard").length,
        color: "#9B87B8",
        textColor: "#6B4F96",
        bg: "rgba(205,180,219,0.18)",
        border: "rgba(205,180,219,0.4)",
      },
      {
        label: "Trial Active",
        count: schoolsData.filter((s) => s.subscription === "Trial").length,
        color: "#5BA89A",
        textColor: "#2E7A6E",
        bg: "rgba(184,224,210,0.18)",
        border: "rgba(184,224,210,0.4)",
      },
      {
        label: "Suspended",
        count: schoolsData.filter((s) => s.status === "suspended").length,
        color: "#D96B7A",
        textColor: "#9E3A4A",
        bg: "rgba(255,202,212,0.18)",
        border: "rgba(255,202,212,0.4)",
      },
    ],
    [schoolsData]
  );

  // ---------------------------------------------------------------------------
  // Table columns — with navigation handlers
  // ---------------------------------------------------------------------------
  const columns = [
    {
      title: "School",
      dataIndex: "name",
      key: "name",
      render: (name, row) => (
        <Space>
          <Avatar
            size={36}
            style={{
              background: `hsl(${(name?.charCodeAt(0) || 65) * 7 % 360}, 60%, 50%)`,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {name?.[0] || "S"}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13 }}>
              {name}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--textMuted)" }}>
              {row.city}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Students",
      dataIndex: "students",
      key: "students",
      render: (v) => <Text strong>{Number(v || 0).toLocaleString("en-IN")}</Text>,
      sorter: (a, b) => a.students - b.students,
    },
    {
      title: "Teachers",
      dataIndex: "teachers",
      key: "teachers",
      render: (v) => <Text>{Number(v || 0).toLocaleString("en-IN")}</Text>,
    },
    {
      title: "Subscription",
      dataIndex: "subscription",
      key: "subscription",
      render: (sub, row) => (
        <Space direction="vertical" size={0}>
          <Tag
            color={
              sub === "Premium"
                ? "geekblue"
                : sub === "Standard"
                ? "cyan"
                : sub === "Trial"
                ? "purple"
                : "default"
            }
          >
            {sub}
          </Tag>
          <Text style={{ fontSize: 11, color: "var(--textMuted)" }}>
            Exp: {row.subExpiry}
          </Text>
        </Space>
      ),
    },
    {
      title: "Health",
      dataIndex: "health",
      key: "health",
      render: (v) => (
        <Space direction="vertical" size={2} style={{ width: 80 }}>
          <Progress
            percent={v}
            size="small"
            showInfo={false}
            strokeColor={
              v >= 90
                ? "var(--success)"
                : v >= 60
                ? "var(--warning)"
                : "var(--danger)"
            }
          />
          <Text
            style={{
              fontSize: 11,
              color: v >= 90 ? "var(--success)" : "var(--warning)",
            }}
          >
            {v}%
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = statusConfig[status] || statusConfig.pending;
        return (
          <Badge
            status={cfg.color}
            text={<Text style={{ fontSize: 12 }}>{cfg.label}</Text>}
          />
        );
      },
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => (
        <Text
          strong
          style={{
            color: Number(v) === 0 ? "var(--textMuted)" : "var(--success)",
          }}
        >
          {formatMoney(v)}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/dashboard/superadmin/schools`, {
                  state: { schoolId: row._id || row.key },
                })
              }
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/dashboard/superadmin/schools`, {
                  state: { schoolId: row._id || row.key, mode: "edit" },
                })
              }
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: "1", label: "Send Notice" },
                { key: "2", label: "Renew Subscription" },
                { key: "3", label: "Suspend School", danger: true },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Refresh handler
  // ---------------------------------------------------------------------------
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchSummary(), refetchSchools()]);
      dispatch(fetchActivityLogs());
      message.success("Dashboard refreshed");
    } catch {
      message.error("Refresh failed");
    }
  };

  const isLoading = summaryLoading || schoolsLoading;
  const isFetching = summaryFetching || schoolsFetching;
  const hasError = summaryError || schoolsError;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <Layout style={{ background: "var(--bg)" }}>
        <PageHeader
          title="Super Admin Dashboard"
          subtitle="Platform-wide overview — schools, subscriptions and revenue"
          icon={<DashboardOutlined />}
          extra={
            isFetching ? (
              <Spin size="small" />
            ) : (
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            )
          }
        />
        <Content style={{ padding: "24px 28px", overflow: "auto", background: "var(--bg)" }}>
          {hasError && (
            <Alert
              type="error"
              showIcon
              message="Some dashboard data failed to load."
              description="Statistics may be incomplete. Try refreshing."
              action={
                <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh}>
                  Retry
                </Button>
              }
              style={{ marginBottom: 16, borderRadius: 10 }}
            />
          )}

          {/* KPI cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="Total Schools"
                value={metrics.totalSchools}
                icon={<BankOutlined />}
                color="#5B9EC9"
                iconBg="rgba(167,199,231,0.22)"
                cardAccent="#A7C7E7"
                delta="Live"
                deltaType="up"
              />
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="Active Schools"
                value={metrics.activeSchools}
                icon={<CheckCircleFilled />}
                color="#5BA89A"
                iconBg="rgba(184,224,210,0.25)"
                cardAccent="#B8E0D2"
                delta={`${Math.round((metrics.activeSchools / Math.max(metrics.totalSchools, 1)) * 100)}% active`}
                deltaType="up"
              />
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="Total Students"
                value={metrics.totalStudents}
                icon={<TeamOutlined />}
                color="#9B87B8"
                iconBg="rgba(205,180,219,0.25)"
                cardAccent="#CDB4DB"
                delta="Live count"
                deltaType="up"
              />
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="Revenue (YTD)"
                value={formatMoney(metrics.totalRevenue)}
                icon={<DollarOutlined />}
                color="#5BA89A"
                iconBg="rgba(184,224,210,0.25)"
                cardAccent="#B8E0D2"
                delta="Collected"
                deltaType="up"
              />
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="Expiring Soon"
                value={Math.max(metrics.expiringSoon, 0)}
                icon={<WarningOutlined />}
                color="#D4922A"
                iconBg="rgba(253,226,167,0.35)"
                cardAccent="#FDE2A7"
                delta="Needs follow-up"
                deltaType="down"
              />
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <StatCard
                title="System Health"
                value={metrics.avgHealth}
                suffix="%"
                icon={<ThunderboltFilled />}
                color="#5B9EC9"
                iconBg="rgba(167,199,231,0.22)"
                cardAccent="#A7C7E7"
                delta="Live average"
                deltaType="up"
              />
            </Col>
          </Row>

          {/* System Health / Subscription / Top Schools row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <ThunderboltFilled style={{ color: "var(--cyan)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      System Health
                    </span>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  height: "100%",
                }}
                extra={<Tag color="orange">Static Preview</Tag>}
              >
                <Space direction="vertical" style={{ width: "100%" }} size={16}>
                  {[
                    { label: "API Server", val: 99, color: "var(--success)" },
                    { label: "Database", val: 97, color: "var(--success)" },
                    { label: "File Storage", val: 92, color: "var(--success)" },
                    { label: "Email Service", val: 85, color: "var(--warning)" },
                  ].map((item) => (
                    <div key={item.label}>
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: "var(--text-primary)" }}>
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: item.color,
                            fontWeight: 600,
                          }}
                        >
                          {item.val}%
                        </Text>
                      </Space>
                      <Progress
                        percent={item.val}
                        showInfo={false}
                        size="small"
                        strokeColor={item.color}
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <SafetyCertificateOutlined
                      style={{ color: "var(--primary)" }}
                    />
                    <span style={{ color: "var(--text-primary)" }}>
                      Subscription Status
                    </span>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  height: "100%",
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  {subscriptionCounts.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: item.bg,
                        border: `1px solid ${item.border}`,
                        borderRadius: 10,
                        transition: "transform 0.15s",
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{item.label}</Text>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: item.textColor,
                          background: "#ffffff",
                          padding: "2px 10px",
                          borderRadius: 99,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <RiseOutlined style={{ color: "var(--purple)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      Top Schools by Students
                    </span>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  height: "100%",
                }}
              >
                <Space direction="vertical" style={{ width: "100%" }} size={14}>
                  {topSchools.map((school, i) => (
                    <div key={school.key}>
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                          marginBottom: 5,
                        }}
                      >
                        <Space>
                          <Text
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: school.color,
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {i + 1}
                          </Text>
                          <div>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                display: "block",
                                color: "var(--text-primary)",
                              }}
                            >
                              {school.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: "var(--textMuted)",
                              }}
                            >
                              {school.city}
                            </Text>
                          </div>
                        </Space>
                        <Text style={{ fontWeight: 700 }}>
                          {school.students.toLocaleString("en-IN")}
                        </Text>
                      </Space>
                      <Progress
                        percent={Math.round((school.students / maxStudents) * 100)}
                        showInfo={false}
                        size="small"
                        strokeColor={school.color}
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Schools table + Activity log */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} xl={16}>
              <Card
                title={
                  <Space>
                    <BankOutlined style={{ color: "var(--primary)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      All Schools
                    </span>
                    <Tag color="blue">{filteredSchools.length} shown</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Segmented
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { label: "All", value: "all" },
                        { label: "Active", value: "active" },
                        { label: "Pending", value: "pending" },
                        { label: "Suspended", value: "suspended" },
                      ]}
                    />
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                    >
                      Refresh
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => navigate("/dashboard/superadmin/schools")}
                    >
                      Add School
                    </Button>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={columns}
                  dataSource={filteredSchools}
                  loading={isLoading}
                  pagination={{ pageSize: 5, size: "small" }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title={
                  <Space>
                    <ClockCircleFilled style={{ color: "var(--orange)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      Recent Activity
                    </span>
                  </Space>
                }
                extra={
                  <Space size={6}>
                    {activityLoading ? (
                      <Spin size="small" />
                    ) : (
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          navigate("/dashboard/superadmin/reports/activity")
                        }
                      >
                        View All
                      </Button>
                    )}
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  height: "100%",
                }}
              >
                {activityLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "40px 0",
                    }}
                  >
                    <Spin tip="Loading activity..." />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <Empty
                    description="No recent activity"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Timeline
                    items={activityLogs.slice(0, 8).map((item) => {
                      const meta = getActivityMeta(item.action || item.type || "");
                      return {
                        dot: (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: `${meta.color}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: meta.color,
                              fontSize: 13,
                            }}
                          >
                            {meta.icon}
                          </div>
                        ),
                        children: (
                          <div style={{ paddingBottom: 6 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                display: "block",
                                color: "var(--text-primary)",
                              }}
                            >
                              {item.action || item.type || "Activity"}
                            </Text>
                            <Space size={8}>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "var(--textMuted)",
                                }}
                              >
                                {item.message || item.description || ""}
                              </Text>
                              {(item.createdAt || item.timestamp) && (
                                <>
                                  <Divider type="vertical" style={{ margin: 0 }} />
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: "var(--textMuted)",
                                    }}
                                  >
                                    {timeAgo(item.createdAt || item.timestamp)}
                                  </Text>
                                </>
                              )}
                            </Space>
                          </div>
                        ),
                      };
                    })}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Revenue by School + Quick Actions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <DollarOutlined style={{ color: "var(--success)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      Revenue by School
                    </span>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <List
                  dataSource={schoolsData
                    .filter((s) => s.revenue > 0)
                    .sort((a, b) => b.revenue - a.revenue)}
                  locale={{ emptyText: "No revenue data" }}
                  renderItem={(school) => (
                    <List.Item style={{ padding: "10px 0", border: "none" }}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <Avatar
                            size={32}
                            style={{
                              background: `hsl(${(school.name.charCodeAt(0) * 7) % 360}, 55%, 55%)`,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {school.name[0]}
                          </Avatar>
                          <div>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                display: "block",
                                color: "var(--text-primary)",
                              }}
                            >
                              {school.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: "var(--textMuted)",
                              }}
                            >
                              {school.city}
                            </Text>
                          </div>
                        </Space>
                        <Text
                          strong
                          style={{ color: "var(--success)", fontSize: 14 }}
                        >
                          {formatMoney(school.revenue)}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title={
                  <Space>
                    <LinkOutlined style={{ color: "var(--success)" }} />
                    <span style={{ color: "var(--text-primary)" }}>
                      Quick Actions
                    </span>
                  </Space>
                }
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  color: "var(--text-primary)",
                }}
              >
                <Row gutter={[10, 10]}>
                  {QUICK_ACTIONS.map((action) => (
                    <Col span={12} key={action.label}>
                      <Button
                        block
                        icon={
                          <span style={{ color: action.color, fontSize: 16 }}>
                            {action.icon}
                          </span>
                        }
                        style={{
                          height: 52,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          textAlign: "left",
                          fontSize: 13,
                          border: "1px solid var(--border)",
                        }}
                        onClick={() => navigate(action.route)}
                      >
                        {action.label}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SuperAdminDashboard;
