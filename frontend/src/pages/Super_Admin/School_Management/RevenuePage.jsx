import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Table, Input, Select, Button, Space, Typography, Tag } from "antd";
import { SearchOutlined, DownloadOutlined, DollarOutlined, RiseOutlined, TeamOutlined, FilterOutlined, WalletOutlined, AppstoreOutlined } from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const getCycle = (days = 0) => (days >= 365 ? "Yearly" : days >= 90 ? "Quarterly" : "Monthly");
const getPlanDetails = (school) => {
  const plan = school?.subscriptionPlan;

  if (!plan) {
    return { name: "Unassigned", price: 0, durationInDays: 0 };
  }

  if (typeof plan === "string") {
    return { name: plan, price: 0, durationInDays: 0 };
  }

  return {
    name: plan?.name || plan?.planName || "Unassigned",
    price: Number(plan?.price || 0),
    durationInDays: Number(plan?.durationInDays || 0),
  };
};

export default function RevenuePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { schools, loading } = useSelector((state) => state.school);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const rows = useMemo(() => {
    return (schools || []).map((school, i) => {
      const plan = getPlanDetails(school);
      return {
        key: school._id || i,
        school: school.name,
        city: school.address || "-",
        plan: plan.name,
        amount: plan.price,
        cycle: getCycle(plan.durationInDays),
        status: school.isActive ? "Paid" : "Overdue",
        date: new Date(school.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
    });
  }, [schools]);

  const filtered = rows.filter((r) => {
    if (search && !r.school.toLowerCase().includes(search.toLowerCase())) return false;
    if (planFilter && r.plan !== planFilter) return false;
    return true;
  });

  const totals = useMemo(() => {
    const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);
    const activeSubs = rows.filter((r) => r.plan !== "Unassigned").length;
    const avgPerSchool = rows.length ? Math.round(totalRevenue / rows.length) : 0;
    return { totalRevenue, activeSubs, avgPerSchool };
  }, [rows]);

  const columns = [
    { title: "School", dataIndex: "school" },
    {
      title: "Selected Plan",
      dataIndex: "plan",
      render: (p) => <Tag color={p === "Unassigned" ? "default" : "green"}>{p}</Tag>,
    },
    { title: "Cycle", dataIndex: "cycle" },
    { title: "Amount", dataIndex: "amount", render: (a) => <Text strong>{formatCurrency(a)}</Text>, sorter: (a, b) => a.amount - b.amount },
    { title: "Date", dataIndex: "date" },
    { title: "Status", dataIndex: "status" },
  ];

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <Space align="center"><WalletOutlined style={{ fontSize: 18 }} /><Title level={3} style={{ margin: 0 }}>Revenue Dashboard</Title></Space>
          <Text type="secondary">Dynamic data from school subscriptions.</Text>
        </div>
        <Space wrap>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
          <Button type="primary" icon={<WalletOutlined />} onClick={() => navigate("/dashboard/superadmin/payments")}>Payments</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}><Card><Text>Total Revenue</Text><Title level={4}>{formatCurrency(totals.totalRevenue)}</Title></Card></Col>
        <Col xs={24} sm={12} lg={8}><Card><Text>Active Subscriptions</Text><Title level={4}>{totals.activeSubs}</Title></Card></Col>
        <Col xs={24} sm={12} lg={8}><Card><Text>Avg Revenue / School</Text><Title level={4}>{formatCurrency(totals.avgPerSchool)}</Title></Card></Col>
      </Row>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <Space wrap>
            <Input prefix={<SearchOutlined />} placeholder="Search school" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <Select allowClear placeholder="Plan" value={planFilter || undefined} onChange={(v) => setPlanFilter(v || "")} style={{ width: 160 }} suffixIcon={<FilterOutlined />}>
              {[...new Set(rows.map((r) => r.plan))].map((plan) => <Option key={plan} value={plan}>{plan}</Option>)}
            </Select>
          </Space>
          <Button icon={<DownloadOutlined />}><RiseOutlined /> Export CSV</Button>
        </div>

        <Table loading={loading} columns={columns} dataSource={filtered} rowKey="key" pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
}
