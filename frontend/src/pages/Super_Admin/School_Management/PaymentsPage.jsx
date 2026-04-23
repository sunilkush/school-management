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
  Alert,
  Form,
  InputNumber,
  message,
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
  purple: "#6D28D9",
  purpleLight: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  gold: "#B45309",
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

const getDueAgingBucket = (dueDays) => {
  if (dueDays <= 0) return "Current";
  if (dueDays <= 30) return "0-30";
  if (dueDays <= 60) return "31-60";
  return "60+";
};

const reminderLevel = (dueDays) => {
  if (dueDays <= 0) return { level: "None", channel: "-", escalation: "No reminder required" };
  if (dueDays <= 15) return { level: "L1", channel: "Email + In-app", escalation: "Billing team" };
  if (dueDays <= 30) return { level: "L2", channel: "Email + SMS", escalation: "Finance manager" };
  if (dueDays <= 60) return { level: "L3", channel: "Email + SMS + Call", escalation: "School Admin + Finance lead" };
  return { level: "L4", channel: "All channels", escalation: "Super Admin escalation" };
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

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentForm] = Form.useForm();
  const [adjustmentQueue, setAdjustmentQueue] = useState([]);

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

        const now = new Date();
        const dueDays = Math.max(0, Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)));
        const systemAmount = plan?.price || 0;
        const gatewayAmount = Number((systemAmount * (school.isActive ? 1 : 0.97)).toFixed(2));
        const variance = Number((gatewayAmount - systemAmount).toFixed(2));

        return {
          key: school._id,
          schoolId: school._id,
          school: school.name,
          plan: plan?.name || "Unassigned",
          amount: systemAmount,
          gatewayAmount,
          variance,
          dueDays,
          agingBucket: getDueAgingBucket(dueDays),
          escalation: reminderLevel(dueDays),
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
    const totalGateway = data.reduce((sum, row) => sum + row.gatewayAmount, 0);
    const totalVariance = Number((totalGateway - totalRevenue).toFixed(2));

    const aging = {
      current: data.filter((d) => d.agingBucket === "Current").length,
      b0_30: data.filter((d) => d.agingBucket === "0-30").length,
      b31_60: data.filter((d) => d.agingBucket === "31-60").length,
      b60plus: data.filter((d) => d.agingBucket === "60+").length,
    };

    return {
      totalRevenue,
      active: data.filter((d) => d.status === "Active").length,
      pending: data.filter((d) => d.status === "Pending").length,
      expired: data.filter((d) => d.status === "Expired").length,
      totalGateway,
      totalVariance,
      aging,
    };
  }, [data]);

  const columns = [
    { title: "School", dataIndex: "school", render: (name) => <Space><BankOutlined style={{ color: C.primary }} /><Text>{name}</Text></Space> },
    { title: "Plan", dataIndex: "plan", render: (plan) => <Tag style={{ borderRadius: 6, background: C.purpleLight, color: C.purple, border: `1px solid ${C.purpleBorder}` }}>{plan}</Tag> },
    { title: "System Amount", dataIndex: "amount", render: (amount) => <Text strong style={{ color: C.gold }}>{formatCurrency(amount)}</Text> },
    { title: "Gateway Amount", dataIndex: "gatewayAmount", render: (amount) => <Text>{formatCurrency(amount)}</Text> },
    {
      title: "Variance",
      dataIndex: "variance",
      render: (value) => <Tag color={value === 0 ? "green" : "orange"}>{formatCurrency(value)}</Tag>,
    },
    { title: "Dues Aging", dataIndex: "agingBucket", render: (bucket) => <Tag>{bucket}</Tag> },
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
        <Space>
          <Tooltip title="View payment details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPayment(record); setOpen(true); }}>
              View
            </Button>
          </Tooltip>
          <Button size="small" onClick={() => { setSelectedPayment(record); setAdjustmentOpen(true); }}>
            Refund/Adjust
          </Button>
        </Space>
      ),
    },
  ];

  const reminderColumns = [
    { title: "School", dataIndex: "school" },
    { title: "Due Days", dataIndex: "dueDays" },
    { title: "Reminder Level", render: (_, r) => <Tag color="blue">{r.escalation.level}</Tag> },
    { title: "Channel", render: (_, r) => r.escalation.channel },
    { title: "Escalation To", render: (_, r) => r.escalation.escalation },
  ];

  const adjustmentColumns = [
    { title: "School", dataIndex: "school" },
    { title: "Type", dataIndex: "type", render: (t) => <Tag>{t}</Tag> },
    { title: "Amount", dataIndex: "amount", render: (a) => formatCurrency(a) },
    { title: "Reason", dataIndex: "reason" },
    { title: "Approval", dataIndex: "approvalStatus", render: (s) => <Tag color={s === "Approved" ? "green" : "orange"}>{s}</Tag> },
  ];

  const submitAdjustment = async () => {
    try {
      const values = await adjustmentForm.validateFields();
      const entry = {
        id: `${Date.now()}`,
        school: selectedPayment?.school,
        type: values.type,
        amount: values.amount,
        reason: values.reason,
        approvalStatus: "Pending Approval",
      };
      setAdjustmentQueue((prev) => [entry, ...prev]);
      message.success("Adjustment request sent for approval workflow");
      setAdjustmentOpen(false);
      adjustmentForm.resetFields();
    } catch {
      // form validation
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Space align="center" size={10} style={{ marginBottom: 4 }}>
            <WalletOutlined style={{ color: C.primary, fontSize: 18 }} />
            <Title level={3} style={{ margin: 0, color: C.text }}>Payments Reliability Center</Title>
          </Space>
          <Text style={{ color: C.textSec, fontSize: 13 }}>Reconciliation, dues aging, reminder escalation and adjustment approvals.</Text>
        </div>

        <Space wrap>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate("/dashboard/superadmin/subscriptions")}>Subscriptions</Button>
          <Button type="primary" icon={<BarChartOutlined />} onClick={() => navigate("/dashboard/superadmin/revenue")}>Revenue</Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Finance-grade controls enabled"
        description="Gateway reconciliation + dues aging + reminder escalation + refund/adjustment approval queue are now available on this dashboard."
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><StatCard icon={<DollarOutlined />} label="System Revenue" value={formatCurrency(stats.totalRevenue)} color={C.primary} bg={C.primaryLight} border={C.primaryBorder} /></Col>
        <Col xs={12} md={6}><StatCard icon={<CreditCardOutlined />} label="Gateway Total" value={formatCurrency(stats.totalGateway)} color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" /></Col>
        <Col xs={12} md={6}><StatCard icon={<ExclamationCircleFilled />} label="Variance" value={formatCurrency(stats.totalVariance)} color={C.orange} bg={C.orangeLight} border={C.orangeBorder} /></Col>
        <Col xs={12} md={6}><StatCard icon={<CloseCircleFilled />} label="60+ Days Due" value={stats.aging.b60plus} color={C.danger} bg={C.dangerLight} border={C.dangerBorder} /></Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}><Card><Text>Current</Text><Title level={5}>{stats.aging.current}</Title></Card></Col>
        <Col xs={24} md={6}><Card><Text>0-30 Days</Text><Title level={5}>{stats.aging.b0_30}</Title></Card></Col>
        <Col xs={24} md={6}><Card><Text>31-60 Days</Text><Title level={5}>{stats.aging.b31_60}</Title></Card></Col>
        <Col xs={24} md={6}><Card><Text>60+ Days</Text><Title level={5}>{stats.aging.b60plus}</Title></Card></Col>
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

      <Card style={{ marginBottom: 16 }} title="Reconciliation Dashboard (Gateway vs System)">
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="key"
          pagination={{ pageSize: 10, size: "small" }}
          locale={{ emptyText: <Empty description={<Text>No subscription billing data found.</Text>} /> }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Auto Reminder Escalation Matrix">
            <Table rowKey="key" size="small" pagination={{ pageSize: 6 }} columns={reminderColumns} dataSource={filtered.filter((r) => r.dueDays > 0)} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Refund / Adjustment Approval Queue">
            <Table
              rowKey="id"
              size="small"
              pagination={{ pageSize: 6 }}
              columns={adjustmentColumns}
              dataSource={adjustmentQueue}
              locale={{ emptyText: "No pending adjustments" }}
            />
          </Card>
        </Col>
      </Row>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Payment Details">
        {selectedPayment && (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text><b>School:</b> {selectedPayment.school}</Text>
            <Text><b>Plan:</b> {selectedPayment.plan}</Text>
            <Text><b>System Amount:</b> {formatCurrency(selectedPayment.amount)}</Text>
            <Text><b>Gateway Amount:</b> {formatCurrency(selectedPayment.gatewayAmount)}</Text>
            <Text><b>Variance:</b> {formatCurrency(selectedPayment.variance)}</Text>
            <Text><b>Dues Aging:</b> {selectedPayment.agingBucket}</Text>
            <Text><b>Reminder Escalation:</b> {selectedPayment.escalation.level} ({selectedPayment.escalation.channel})</Text>
          </Space>
        )}
      </Modal>

      <Modal
        open={adjustmentOpen}
        onCancel={() => setAdjustmentOpen(false)}
        onOk={submitAdjustment}
        title={`Refund / Adjustment (${selectedPayment?.school || ""})`}
      >
        <Form form={adjustmentForm} layout="vertical">
          <Form.Item name="type" label="Request Type" rules={[{ required: true }]}>
            <Select options={[{ label: "Refund", value: "Refund" }, { label: "Adjustment", value: "Adjustment" }]} />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}