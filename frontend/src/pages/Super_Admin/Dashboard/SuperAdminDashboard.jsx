import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
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
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetSuperAdminDashboardSummaryQuery,
  useGetSuperAdminSchoolsQuery,
} from "../../../services/schoolDashboardApi";
import { fetchActivityLogs } from "../../../features/activitySlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper,
  sectionPanel,
  statGrid,
  iconWell,
  pill,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

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
    return { icon: <BankOutlined />, color: "var(--success)" };
  if (a.includes("subscri") || a.includes("payment") || a.includes("fee"))
    return { icon: <RupeeIcon />, color: "var(--primary)" };
  if (a.includes("user") || a.includes("admin") || a.includes("teacher"))
    return { icon: <UserOutlined />, color: "var(--purple)" };
  if (a.includes("backup") || a.includes("system"))
    return { icon: <ThunderboltFilled />, color: "var(--cyan)" };
  if (a.includes("warn") || a.includes("expir") || a.includes("suspend"))
    return { icon: <WarningOutlined />, color: "var(--warning)" };
  return { icon: <ThunderboltFilled />, color: "var(--text-muted)" };
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
// StatCard — KPI card built on the shared sectionPanel/iconWell tokens
// ---------------------------------------------------------------------------
const StatCard = ({ title, value, icon, color, delta, deltaType, suffix }) => (
  <div style={{ ...sectionPanel, marginBottom: 0, height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </span>
      <div style={iconWell(color, 36)}>{icon}</div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15 }}>
      {value}
      {suffix}
    </div>
    {delta && (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: deltaType === "up" ? "var(--success)" : "var(--danger)" }}>
        {deltaType === "up" ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
        {delta}
      </span>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// PanelHeader — consistent section-panel header (icon + title + extra)
// ---------------------------------------------------------------------------
const PanelHeader = ({ icon, color, title, extra }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
    <Space size={8}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{title}</span>
    </Space>
    {extra}
  </div>
);

// ---------------------------------------------------------------------------
// Quick-action route map (pastel accents)
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  {
    label: "Add New School",
    icon: <BankOutlined />,
    color: "#2563EB",
    route: "/dashboard/superadmin/schools",
  },
  {
    label: "Manage Subscriptions",
    icon: <SafetyCertificateOutlined />,
    color: "#14B8A6",
    route: "/dashboard/superadmin/subscriptions",
  },
  {
    label: "View All Users",
    icon: <TeamOutlined />,
    color: "#22C55E",
    route: "/dashboard/superadmin/users",
  },
  {
    label: "Financial Reports",
    icon: <RupeeIcon />,
    color: "#22C55E",
    route: "/dashboard/superadmin/reports/revenue",
  },
  {
    label: "System Logs",
    icon: <ThunderboltFilled />,
    color: "#F59E0B",
    route: "/dashboard/superadmin/settings/audit",
  },
  {
    label: "Send Notification",
    icon: <BellOutlined />,
    color: "#EF4444",
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
        color: ["#2563EB", "#14B8A6", "#22C55E", "#F59E0B"][index],
      }));
  }, [schoolsData]);

  const maxStudents = topSchools[0]?.students || 1;

  const subscriptionCounts = useMemo(
    () => [
      {
        label: "Premium Plans",
        count: schoolsData.filter((s) => s.subscription === "Premium").length,
        color: "#2563EB",
        textColor: "#2E6A9A",
        bg: "rgba(219,234,254,0.18)",
        border: "rgba(219,234,254,0.4)",
      },
      {
        label: "Standard Plans",
        count: schoolsData.filter((s) => s.subscription === "Standard").length,
        color: "#14B8A6",
        textColor: "#6D28D9",
        bg: "rgba(20,184,166,0.18)",
        border: "rgba(20,184,166,0.4)",
      },
      {
        label: "Trial Active",
        count: schoolsData.filter((s) => s.subscription === "Trial").length,
        color: "#22C55E",
        textColor: "#15803D",
        bg: "rgba(220,252,231,0.18)",
        border: "rgba(220,252,231,0.4)",
      },
      {
        label: "Suspended",
        count: schoolsData.filter((s) => s.status === "suspended").length,
        color: "#EF4444",
        textColor: "#DC2626",
        bg: "rgba(254,226,226,0.18)",
        border: "rgba(254,226,226,0.4)",
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
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
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
            color: Number(v) === 0 ? "var(--text-muted)" : "var(--success)",
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
    <>
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
      <div style={pageWrapper}>
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
        <div className="stat-grid" style={statGrid(170)}>
          <StatCard
            title="Total Schools"
            value={metrics.totalSchools}
            icon={<BankOutlined />}
            color="#2563EB"
            delta="Live"
            deltaType="up"
          />
          <StatCard
            title="Active Schools"
            value={metrics.activeSchools}
            icon={<CheckCircleFilled />}
            color="#22C55E"
            delta={`${Math.round((metrics.activeSchools / Math.max(metrics.totalSchools, 1)) * 100)}% active`}
            deltaType="up"
          />
          <StatCard
            title="Total Students"
            value={metrics.totalStudents}
            icon={<TeamOutlined />}
            color="#14B8A6"
            delta="Live count"
            deltaType="up"
          />
          <StatCard
            title="Revenue (YTD)"
            value={formatMoney(metrics.totalRevenue)}
            icon={<RupeeIcon />}
            color="#22C55E"
            delta="Collected"
            deltaType="up"
          />
          <StatCard
            title="Expiring Soon"
            value={Math.max(metrics.expiringSoon, 0)}
            icon={<WarningOutlined />}
            color="#F59E0B"
            delta="Needs follow-up"
            deltaType="down"
          />
          <StatCard
            title="System Health"
            value={metrics.avgHealth}
            suffix="%"
            icon={<ThunderboltFilled />}
            color="#2563EB"
            delta="Live average"
            deltaType="up"
          />
        </div>

        {/* System Health / Subscription / Top Schools row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={8}>
            <div style={{ ...sectionPanel, height: "100%", marginBottom: 0 }}>
              <PanelHeader
                icon={<ThunderboltFilled />}
                color="var(--cyan)"
                title="System Health"
                extra={<Tag color="orange">Static Preview</Tag>}
              />
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
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ ...sectionPanel, height: "100%", marginBottom: 0 }}>
              <PanelHeader
                icon={<SafetyCertificateOutlined />}
                color="var(--primary)"
                title="Subscription Status"
              />
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
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</Text>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: item.textColor,
                        background: "var(--surface)",
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
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ ...sectionPanel, height: "100%", marginBottom: 0 }}>
              <PanelHeader
                icon={<RiseOutlined />}
                color="var(--purple)"
                title="Top Schools by Students"
              />
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
                              color: "var(--text-muted)",
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
            </div>
          </Col>
        </Row>

        <style>{tableHeadCss("sa-dash-tbl")}</style>

        {/* Schools table + Activity log */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} xl={16}>
            <div style={{ ...sectionPanel, padding: 0, marginBottom: 0 }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <Space size={8}>
                  <BankOutlined style={{ color: "var(--primary)" }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>All Schools</span>
                  <span style={pill("#2563EB")}>{filteredSchools.length} shown</span>
                </Space>
                <Space wrap>
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
              </div>
              <div className="sa-dash-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
                <Table
                  columns={columns}
                  dataSource={filteredSchools}
                  loading={isLoading}
                  pagination={{ pageSize: 5, size: "small" }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </div>
            </div>
          </Col>

          <Col xs={24} xl={8}>
            <div style={{ ...sectionPanel, height: "100%", marginBottom: 0 }}>
              <PanelHeader
                icon={<ClockCircleFilled />}
                color="var(--orange)"
                title="Recent Activity"
                extra={
                  activityLoading ? (
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
                  )
                }
              />
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
                        <div style={iconWell(meta.color, 28)}>
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
                                color: "var(--text-muted)",
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
                                    color: "var(--text-muted)",
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
            </div>
          </Col>
        </Row>

        {/* Revenue by School + Quick Actions */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ ...sectionPanel, marginBottom: 0 }}>
              <PanelHeader
                icon={<RupeeIcon />}
                color="var(--success)"
                title="Revenue by School"
              />
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
                              color: "var(--text-muted)",
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
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ ...sectionPanel, marginBottom: 0 }}>
              <PanelHeader
                icon={<LinkOutlined />}
                color="var(--success)"
                title="Quick Actions"
              />
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
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
