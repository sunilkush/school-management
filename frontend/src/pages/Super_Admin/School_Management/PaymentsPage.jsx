import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Modal,
  Typography,
  Tooltip,
  Empty,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  BankOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  CreditCardOutlined,
  WalletOutlined,
  CalendarOutlined,
  FilterOutlined,
  DollarOutlined,
  BarChartOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { fetchSchools } from "../../../features/schoolSlice";

const { Text, Title } = Typography;
const { Option } = Select;

const C = {
  primary: "#0F6E56",
  primaryLight: "#E1F5EE",
  primaryBorder: "#9FE1CB",
  surface: "#ffffff",
  bg: "#F4F6F5",
  border: "#E8EDEB",
  text: "#111827",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  blue: "#1D4ED8",
  blueLight: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#6D28D9",
  purpleLight: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  gold: "#B45309",
  goldLight: "#FFFBEB",
  goldBorder: "#FDE68A",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  dangerBorder: "#FECACA",
  orange: "#C2410C",
  orangeLight: "#FFF7ED",
  orangeBorder: "#FED7AA",
};

const STATUS = {
  Active: { color: C.primary, bg: C.primaryLight, border: C.primaryBorder, icon: <CheckCircleFilled style={{ fontSize: 11 }} /> },
  Expired: { color: C.danger, bg: C.dangerLight, border: C.dangerBorder, icon: <CloseCircleFilled style={{ fontSize: 11 }} /> },
  Pending: { color: C.orange, bg: C.orangeLight, border: C.orangeBorder, icon: <ExclamationCircleFilled style={{ fontSize: 11 }} /> },
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) => new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const getCycle = (days = 0) => {
  if (days >= 365) return "Yearly";
  if (days >= 90) return "Quarterly";
  return "Monthly";
};

const getStatus = (school) => {
  const expiresOn = new Date(school.createdAt);
  const duration = school.subscriptionPlan?.durationInDays || 0;
  expiresOn.setDate(expiresOn.getDate() + duration);
  const now = new Date();

  if (!school.subscriptionPlan) return "Pending";
  if (!school.isActive || expiresOn < now) return "Expired";
  return "Active";
};

const StatCard = ({ icon, label, value, color, bg, border }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "100%" }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 17 }}>{icon}</div>
    <div>
      <Text style={{ display: "block", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>{label}</Text>
      <Text strong style={{ fontSize: 22, color: C.text }}>{value}</Text>
    </div>
  </div>
);

export default function PaymentsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { schools, loading } = useSelector((state) => state.school);

  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [planFilter, setPlanFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const data = useMemo(
    () =>
      (schools || []).map((school) => {
        const plan = school.subscriptionPlan;
        const cycle = getCycle(plan?.durationInDays);
        const expiryDate = new Date(school.createdAt);
        expiryDate.setDate(expiryDate.getDate() + (plan?.durationInDays || 0));

        return {
          key: school._id,
          school: school.name,
          plan: plan?.name || "Unassigned",
          amount: plan?.price || 0,
          cycle,
          method: "Online",
          status: getStatus(school),
          expiry: plan ? formatDate(expiryDate) : "—",
        };
      }),
    [schools]
  );

  const filtered = data.filter((row) => {
    const matchSearch = !searchText || row.school.toLowerCase().includes(searchText.toLowerCase());
    const matchPlan = !planFilter || row.plan.toLowerCase() === planFilter;
    const matchStatus = !statusFilter || row.status.toLowerCase() === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, row) => sum + row.amount, 0);
    return {
      totalRevenue,
      active: data.filter((d) => d.status === "Active").length,
      pending: data.filter((d) => d.status === "Pending").length,
      expired: data.filter((d) => d.status === "Expired").length,
    };
  }, [data]);

  const columns = [
    { title: "School", dataIndex: "school", render: (name) => <Space><BankOutlined style={{ color: C.primary }} /><Text>{name}</Text></Space> },
    { title: "Plan", dataIndex: "plan", render: (plan) => <Tag style={{ borderRadius: 6, background: C.purpleLight, color: C.purple, border: `1px solid ${C.purpleBorder}` }}>{plan}</Tag> },
    { title: "Amount", dataIndex: "amount", render: (amount) => <Text strong style={{ color: C.gold }}>{formatCurrency(amount)}</Text> },
    { title: "Cycle", dataIndex: "cycle" },
    { title: "Method", dataIndex: "method", render: (method) => <Space><CreditCardOutlined /><Text>{method}</Text></Space> },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const s = STATUS[status] || STATUS.Pending;
        return <Tag style={{ borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</Tag>;
      },
    },
    { title: "Expiry", dataIndex: "expiry", render: (date) => <Space><CalendarOutlined /><Text>{date}</Text></Space> },
    {
      title: "Action",
      render: (_, record) => (
        <Tooltip title="View payment details">
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPayment(record); setOpen(true); }}>
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Space align="center" size={10} style={{ marginBottom: 4 }}>
            <WalletOutlined style={{ color: C.primary, fontSize: 18 }} />
            <Title level={3} style={{ margin: 0, color: C.text }}>Payments Management</Title>
          </Space>
          <Text style={{ color: C.textSec, fontSize: 13 }}>Auto-synced from schools + subscription plan mapping</Text>
        </div>

        <Space wrap>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
          <Button type="primary" icon={<BarChartOutlined />} onClick={() => navigate("/dashboard/superadmin/revenue")}>Revenue</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><StatCard icon={<DollarOutlined />} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color={C.primary} bg={C.primaryLight} border={C.primaryBorder} /></Col>
        <Col xs={12} md={6}><StatCard icon={<CheckCircleFilled />} label="Active Plans" value={stats.active} color="#059669" bg="#ECFDF5" border="#A7F3D0" /></Col>
        <Col xs={12} md={6}><StatCard icon={<ExclamationCircleFilled />} label="Pending" value={stats.pending} color={C.orange} bg={C.orangeLight} border={C.orangeBorder} /></Col>
        <Col xs={12} md={6}><StatCard icon={<CloseCircleFilled />} label="Expired" value={stats.expired} color={C.danger} bg={C.dangerLight} border={C.dangerBorder} /></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <FilterOutlined style={{ color: C.primary }} />
          <Input prefix={<SearchOutlined />} placeholder="Search school..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 220 }} />
          <Select placeholder="Plan" style={{ width: 140 }} value={planFilter} onChange={setPlanFilter} allowClear>
            {[...new Set(data.map((d) => d.plan.toLowerCase()))].map((plan) => <Option key={plan} value={plan}>{plan}</Option>)}
          </Select>
          <Select placeholder="Status" style={{ width: 140 }} value={statusFilter} onChange={setStatusFilter} allowClear>
            <Option value="active">Active</Option><Option value="expired">Expired</Option><Option value="pending">Pending</Option>
          </Select>
          <Text style={{ marginLeft: "auto", color: C.textMuted }}>{filtered.length} of {data.length} records</Text>
        </div>
      </Card>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="key"
          pagination={{ pageSize: 10, size: "small" }}
          locale={{ emptyText: <Empty description={<Text>No subscription billing data found.</Text>} /> }}
        />
      </Card>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Payment Details">
        {selectedPayment && (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text><b>School:</b> {selectedPayment.school}</Text>
            <Text><b>Plan:</b> {selectedPayment.plan}</Text>
            <Text><b>Amount:</b> {formatCurrency(selectedPayment.amount)}</Text>
            <Text><b>Cycle:</b> {selectedPayment.cycle}</Text>
            <Text><b>Status:</b> {selectedPayment.status}</Text>
            <Text><b>Expiry:</b> {selectedPayment.expiry}</Text>
          </Space>
        )}
      </Modal>
    </div>
  );
}
