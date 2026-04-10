import { useMemo, useState } from "react";
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
} from "antd";
import {
  BankOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
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
} from "@ant-design/icons";

const { Content } = Layout;
const { Text } = Typography;

const initialSchoolsData = [
  {
    key: "1",
    name: "DPS Modern",
    city: "Delhi",
    students: 2340,
    teachers: 128,
    status: "active",
    subscription: "Premium",
    subExpiry: "Dec 2026",
    revenue: 420000,
    health: 98,
  },
  {
    key: "2",
    name: "Sunrise Academy",
    city: "Mumbai",
    students: 1890,
    teachers: 102,
    status: "active",
    subscription: "Standard",
    subExpiry: "Jul 2026",
    revenue: 280000,
    health: 95,
  },
  {
    key: "3",
    name: "Green Valley School",
    city: "Pune",
    students: 1540,
    teachers: 88,
    status: "pending",
    subscription: "Trial",
    subExpiry: "May 2026",
    revenue: 0,
    health: 72,
  },
  {
    key: "4",
    name: "Bright Minds",
    city: "Noida",
    students: 980,
    teachers: 60,
    status: "active",
    subscription: "Premium",
    subExpiry: "Nov 2026",
    revenue: 160000,
    health: 100,
  },
  {
    key: "5",
    name: "EduVision International",
    city: "Bangalore",
    students: 1210,
    teachers: 74,
    status: "suspended",
    subscription: "Standard",
    subExpiry: "Apr 2026",
    revenue: 0,
    health: 0,
  },
];

const activityLog = [
  {
    id: 1,
    color: "var(--success)",
    icon: <BankOutlined />,
    text: "Green Valley School registered",
    sub: "New school onboarded",
    time: "2 min ago",
  },
  {
    id: 2,
    color: "var(--primary)",
    icon: <DollarOutlined />,
    text: "Subscription renewed — DPS Noida",
    sub: "₹4,20,000 received",
    time: "18 min ago",
  },
  {
    id: 3,
    color: "var(--purple)",
    icon: <UserOutlined />,
    text: "New admin added — Sunrise School",
    sub: "Rahul Sharma assigned",
    time: "1 hr ago",
  },
  {
    id: 4,
    color: "var(--cyan)",
    icon: <ThunderboltFilled />,
    text: "System backup completed",
    sub: "All data secured",
    time: "3 hr ago",
  },
  {
    id: 5,
    color: "var(--warning)",
    icon: <WarningOutlined />,
    text: "Subscription expiring — EduStar Chennai",
    sub: "Expires in 7 days",
    time: "5 hr ago",
  },
];

const statusConfig = {
  active: { color: "success", label: "Active" },
  suspended: { color: "error", label: "Suspended" },
  pending: { color: "warning", label: "Pending" },
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const StatCard = ({ title, value, icon, color, delta, deltaType, suffix }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      height: "100%",
      position: "relative",
      overflow: "hidden",
    }}
    bodyStyle={{ padding: "20px 24px" }}
  >
    <div
      style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 90,
        height: 90,
        borderRadius: "50%",
        background: color,
        opacity: 0.07,
      }}
    />
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
        <Text style={{ fontSize: 13, color: "var(--textMuted)", fontWeight: 500 }}>{title}</Text>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
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
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.2,
        }}
      />

      {delta && (
        <Space size={4}>
          {deltaType === "up" ? (
            <ArrowUpOutlined style={{ color: "var(--success)", fontSize: 12 }} />
          ) : (
            <ArrowDownOutlined style={{ color: "var(--danger)", fontSize: 12 }} />
          )}
          <Text style={{ fontSize: 12, color: deltaType === "up" ? "var(--success)" : "var(--danger)" }}>
            {delta}
          </Text>
          <Text style={{ fontSize: 12, color: "var(--textMuted)" }}>vs last month</Text>
        </Space>
      )}
    </Space>
  </Card>
);

const SuperAdminDashboard = () => {
  const [schoolsData, setSchoolsData] = useState(initialSchoolsData);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSchools = useMemo(
    () =>
      statusFilter === "all"
        ? schoolsData
        : schoolsData.filter((school) => school.status === statusFilter),
    [schoolsData, statusFilter],
  );

  const metrics = useMemo(() => {
    const totalSchools = schoolsData.length;
    const activeSchools = schoolsData.filter((s) => s.status === "active").length;
    const totalStudents = schoolsData.reduce((sum, s) => sum + s.students, 0);
    const totalRevenue = schoolsData.reduce((sum, s) => sum + s.revenue, 0);
    const expiringSoon = schoolsData.filter((s) => s.subscription !== "Trial").length - activeSchools;
    const avgHealth = Math.round(
      schoolsData.reduce((sum, s) => sum + s.health, 0) / Math.max(totalSchools, 1),
    );
    return { totalSchools, activeSchools, totalStudents, totalRevenue, expiringSoon, avgHealth };
  }, [schoolsData]);

  const topSchools = useMemo(
    () =>
      [...schoolsData]
        .sort((a, b) => b.students - a.students)
        .slice(0, 4)
        .map((school, index) => ({
          ...school,
          color: ["#1677ff", "#722ed1", "#13c2c2", "#fa8c16"][index],
        })),
    [schoolsData],
  );

  const maxStudents = topSchools[0]?.students || 1;

  const subscriptionCounts = useMemo(
    () => [
      {
        label: "Premium Plans",
        count: schoolsData.filter((s) => s.subscription === "Premium").length,
        color: "geekblue",
        bg: "#e6f4ff",
      },
      {
        label: "Standard Plans",
        count: schoolsData.filter((s) => s.subscription === "Standard").length,
        color: "cyan",
        bg: "#e6fffb",
      },
      {
        label: "Trial Active",
        count: schoolsData.filter((s) => s.subscription === "Trial").length,
        color: "purple",
        bg: "#f9f0ff",
      },
      { label: "Suspended", count: schoolsData.filter((s) => s.status === "suspended").length, color: "red", bg: "#fff1f0" },
    ],
    [schoolsData],
  );

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
              background: `hsl(${(name.charCodeAt(0) * 7) % 360}, 60%, 50%)`,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {name[0]}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13 }}>
              {name}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--textMuted)" }}>{row.city}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Students",
      dataIndex: "students",
      key: "students",
      render: (v) => <Text strong>{v.toLocaleString("en-IN")}</Text>,
      sorter: (a, b) => a.students - b.students,
    },
    {
      title: "Teachers",
      dataIndex: "teachers",
      key: "teachers",
    },
    {
      title: "Subscription",
      dataIndex: "subscription",
      key: "subscription",
      render: (sub, row) => (
        <Space direction="vertical" size={0}>
          <Tag color={sub === "Premium" ? "geekblue" : sub === "Standard" ? "cyan" : "default"}>{sub}</Tag>
          <Text style={{ fontSize: 11, color: "var(--textMuted)" }}>Exp: {row.subExpiry}</Text>
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
            strokeColor={v >= 90 ? "var(--success)" : v >= 60 ? "var(--warning)" : "var(--danger)"}
          />
          <Text style={{ fontSize: 11, color: v >= 90 ? "var(--success)" : "var(--warning)" }}>{v}%</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = statusConfig[status];
        return <Badge status={cfg.color} text={<Text style={{ fontSize: 12 }}>{cfg.label}</Text>} />;
      },
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => <Text strong style={{ color: v === 0 ? "var(--textMuted)" : "var(--success)" }}>{formatMoney(v)}</Text>,
    },
    {
      title: "",
      key: "actions",
      render: () => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Dropdown
            menu={{ items: [{ key: "1", label: "Send Notice" }, { key: "2", label: "Renew Subscription" }, { key: "3", label: "Suspend School", danger: true }] }}
            trigger={["click"]}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleRefresh = () => {
    setSchoolsData((prev) =>
      prev.map((school) => ({
        ...school,
        health: Math.max(0, Math.min(100, school.health + Math.floor(Math.random() * 7) - 3)),
      })),
    );
    message.success("Dashboard stats refreshed");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif" }}>
      <Layout style={{ background: "var(--bg)" }}>
        <Content style={{ padding: "24px", overflow: "auto" }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12} lg={4}><StatCard title="Total Schools" value={metrics.totalSchools} icon={<BankOutlined />} color="var(--primary)" delta="Live" deltaType="up" /></Col>
            <Col xs={24} sm={12} lg={4}><StatCard title="Active Schools" value={metrics.activeSchools} icon={<CheckCircleFilled />} color="var(--success)" delta={`${Math.round((metrics.activeSchools / metrics.totalSchools) * 100)}% active`} deltaType="up" /></Col>
            <Col xs={24} sm={12} lg={4}><StatCard title="Total Students" value={metrics.totalStudents} icon={<TeamOutlined />} color="var(--purple)" delta="Auto-calculated" deltaType="up" /></Col>
            <Col xs={24} sm={12} lg={4}><StatCard title="Revenue (YTD)" value={formatMoney(metrics.totalRevenue)} icon={<DollarOutlined />} color="var(--orange)" delta="Auto-calculated" deltaType="up" /></Col>
            <Col xs={24} sm={12} lg={4}><StatCard title="Expiring Soon" value={Math.max(metrics.expiringSoon, 0)} icon={<WarningOutlined />} color="var(--danger)" delta="Needs follow-up" deltaType="down" /></Col>
            <Col xs={24} sm={12} lg={4}><StatCard title="System Health" value={metrics.avgHealth} suffix="%" icon={<ThunderboltFilled />} color="var(--cyan)" delta="Live average" deltaType="up" /></Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} md={8}>
              <Card title={<Space><ThunderboltFilled style={{ color: "var(--cyan)" }} /><span style={{ color: "var(--text-primary)" }}>System Health</span></Space>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }} extra={<Tag color="success">Dynamic</Tag>}>
                <Space direction="vertical" style={{ width: "100%" }} size={16}>
                  {[{ label: "API Server", val: 99, color: "var(--success)" }, { label: "Database", val: 97, color: "var(--success)" }, { label: "File Storage", val: 92, color: "var(--success)" }, { label: "Email Service", val: 85, color: "var(--warning)" }].map((item) => (
                    <div key={item.label}>
                      <Space style={{ justifyContent: "space-between", width: "100%", marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.label}</Text>
                        <Text style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.val}%</Text>
                      </Space>
                      <Progress percent={item.val} showInfo={false} size="small" strokeColor={item.color} />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title={<Space><SafetyCertificateOutlined style={{ color: "var(--primary)" }} /><span style={{ color: "var(--text-primary)" }}>Subscription Status</span></Space>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }} size={14}>
                  {subscriptionCounts.map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: item.bg, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13 }}>{item.label}</Text>
                      <Tag color={item.color} style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{item.count}</Tag>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title={<Space><RiseOutlined style={{ color: "var(--purple)" }} /><span style={{ color: "var(--text-primary)" }}>Top Schools by Students</span></Space>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }} size={14}>
                  {topSchools.map((school, i) => (
                    <div key={school.name}>
                      <Space style={{ justifyContent: "space-between", width: "100%", marginBottom: 5 }}>
                        <Space>
                          <Text style={{ width: 22, height: 22, borderRadius: "50%", background: school.color, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</Text>
                          <div>
                            <Text style={{ fontSize: 13, fontWeight: 500, display: "block", color: "var(--text-primary)" }}>{school.name}</Text>
                            <Text style={{ fontSize: 11, color: "var(--textMuted)" }}>{school.city}</Text>
                          </div>
                        </Space>
                        <Text style={{ fontWeight: 700 }}>{school.students.toLocaleString("en-IN")}</Text>
                      </Space>
                      <Progress percent={Math.round((school.students / maxStudents) * 100)} showInfo={false} size="small" strokeColor={school.color} />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} xl={16}>
              <Card
                title={<Space><BankOutlined style={{ color: "var(--primary)" }} /><span style={{ color: "var(--text-primary)" }}>All Schools</span><Tag color="blue">{filteredSchools.length} shown</Tag></Space>}
                extra={<Space><Segmented value={statusFilter} onChange={setStatusFilter} options={[{ label: "All", value: "all" }, { label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Suspended", value: "suspended" }]} /><Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh}>Refresh</Button><Button size="small" type="primary" icon={<PlusOutlined />}>Add School</Button></Space>}
                bordered={false}
                style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                bodyStyle={{ padding: 0 }}
              >
                <Table columns={columns} dataSource={filteredSchools} pagination={{ pageSize: 5, size: "small" }} size="small" scroll={{ x: 900 }} />
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card title={<Space><ClockCircleFilled style={{ color: "var(--orange)" }} /><span style={{ color: "var(--text-primary)" }}>Recent Activity</span></Space>} extra={<Button type="link" size="small">View All</Button>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", height: "100%" }}>
                <Timeline
                  items={activityLog.map((item) => ({
                    dot: <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, fontSize: 13 }}>{item.icon}</div>,
                    children: (
                      <div style={{ paddingBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: 500, display: "block", color: "var(--text-primary)" }}>{item.text}</Text>
                        <Space size={8}><Text style={{ fontSize: 12, color: "var(--textMuted)" }}>{item.sub}</Text><Divider type="vertical" style={{ margin: 0 }} /><Text style={{ fontSize: 11, color: "var(--textMuted)" }}>{item.time}</Text></Space>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title={<Space><DollarOutlined style={{ color: "var(--success)" }} /><span style={{ color: "var(--text-primary)" }}>Revenue by School</span></Space>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <List
                  dataSource={schoolsData.filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue)}
                  renderItem={(school) => (
                    <List.Item style={{ padding: "10px 0", border: "none" }}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                          <Avatar size={32} style={{ background: `hsl(${(school.name.charCodeAt(0) * 7) % 360}, 55%, 55%)`, fontSize: 12, fontWeight: 700 }}>{school.name[0]}</Avatar>
                          <div><Text style={{ fontSize: 13, fontWeight: 500, display: "block", color: "var(--text-primary)" }}>{school.name}</Text><Text style={{ fontSize: 11, color: "var(--textMuted)" }}>{school.city}</Text></div>
                        </Space>
                        <Text strong style={{ color: "var(--success)", fontSize: 14 }}>{formatMoney(school.revenue)}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title={<Space><LinkOutlined style={{ color: "var(--success)" }} /><span style={{ color: "var(--text-primary)" }}>Quick Actions</span></Space>} bordered={false} style={{ borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", color: "var(--text-primary)" }}>
                <Row gutter={[10, 10]}>
                  {[{ label: "Add New School", icon: <BankOutlined />, color: "var(--primary)" }, { label: "Manage Subscriptions", icon: <SafetyCertificateOutlined />, color: "var(--purple)" }, { label: "View All Users", icon: <TeamOutlined />, color: "var(--cyan)" }, { label: "Financial Reports", icon: <DollarOutlined />, color: "var(--success)" }, { label: "System Logs", icon: <ThunderboltFilled />, color: "var(--orange)" }, { label: "Send Notification", icon: <BellOutlined />, color: "var(--danger)" }].map((action) => (
                    <Col span={12} key={action.label}>
                      <Button block icon={<span style={{ color: action.color, fontSize: 16 }}>{action.icon}</span>} style={{ height: 52, borderRadius: 10, display: "flex", alignItems: "center", gap: 8, textAlign: "left", fontSize: 13, border: "1px solid var(--border)" }}>{action.label}</Button>
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