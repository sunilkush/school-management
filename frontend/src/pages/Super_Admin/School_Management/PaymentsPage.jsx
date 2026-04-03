import { useState } from "react";
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
  Badge,
  Divider,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  BankOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  CreditCardOutlined,
  WalletOutlined,
  CalendarOutlined,
  FilterOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Color tokens ──────────────────────────────────────────────
const C = {
  primary: "#0F6E56",
  primaryLight: "#E1F5EE",
  primaryMid: "#1D9E75",
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

// ─── Status config ─────────────────────────────────────────────
const STATUS = {
  Active: {
    color: C.primary,
    bg: C.primaryLight,
    border: C.primaryBorder,
    icon: <CheckCircleFilled style={{ fontSize: 11 }} />,
  },
  Expired: {
    color: C.danger,
    bg: C.dangerLight,
    border: C.dangerBorder,
    icon: <CloseCircleFilled style={{ fontSize: 11 }} />,
  },
  Pending: {
    color: C.orange,
    bg: C.orangeLight,
    border: C.orangeBorder,
    icon: <ExclamationCircleFilled style={{ fontSize: 11 }} />,
  },
};

// ─── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg, border, sub }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      height: "100%",
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontSize: 17,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <Text
        style={{
          display: "block",
          fontSize: 10,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text strong style={{ fontSize: 22, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>
        {value}
      </Text>
      {sub && (
        <Text style={{ display: "block", fontSize: 11, color: C.textMuted, marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </div>
  </div>
);

// ─── Detail Row (Modal) ────────────────────────────────────────
const DetailRow = ({ label, children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: `1px solid ${C.border}`,
    }}
  >
    <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {label}
    </Text>
    <div>{children}</div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────
export default function PaymentsPage() {
  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [planFilter, setPlanFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const data = [
    {
      key: 1,
      school: "ABC Public School",
      plan: "Premium",
      amount: "₹999",
      cycle: "Monthly",
      method: "Razorpay",
      status: "Active",
      expiry: "12 Mar 2026",
    },
    {
      key: 2,
      school: "XYZ School",
      plan: "Basic",
      amount: "₹499",
      cycle: "Monthly",
      method: "Stripe",
      status: "Expired",
      expiry: "02 Mar 2026",
    },
    {
      key: 3,
      school: "Delhi Public School",
      plan: "Premium",
      amount: "₹999",
      cycle: "Yearly",
      method: "Razorpay",
      status: "Active",
      expiry: "01 Jan 2027",
    },
    {
      key: 4,
      school: "Ryan International",
      plan: "Basic",
      amount: "₹499",
      cycle: "Monthly",
      method: "UPI",
      status: "Pending",
      expiry: "20 Apr 2026",
    },
  ];

  const filtered = data.filter((row) => {
    const matchSearch = !searchText || row.school.toLowerCase().includes(searchText.toLowerCase());
    const matchPlan = !planFilter || row.plan.toLowerCase() === planFilter;
    const matchStatus = !statusFilter || row.status.toLowerCase() === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const columns = [
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          School
        </Text>
      ),
      dataIndex: "school",
      render: (name) => (
        <Space size={8} align="center">
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: C.primaryLight,
              border: `1px solid ${C.primaryBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BankOutlined style={{ color: C.primary, fontSize: 13 }} />
          </div>
          <Text style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Plan
        </Text>
      ),
      dataIndex: "plan",
      render: (plan) => (
        <Tag
          style={{
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: C.purpleLight,
            color: C.purple,
            border: `1px solid ${C.purpleBorder}`,
            padding: "2px 9px",
            margin: 0,
          }}
        >
          {plan}
        </Tag>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Amount
        </Text>
      ),
      dataIndex: "amount",
      render: (amount) => (
        <Text strong style={{ fontSize: 14, color: C.gold, letterSpacing: "-0.2px" }}>
          {amount}
        </Text>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Cycle
        </Text>
      ),
      dataIndex: "cycle",
      render: (cycle) => (
        <Tag
          icon={<ClockCircleOutlined style={{ fontSize: 10 }} />}
          style={{
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            background: C.blueLight,
            color: C.blue,
            border: `1px solid ${C.blueBorder}`,
            padding: "2px 9px",
            margin: 0,
          }}
        >
          {cycle}
        </Tag>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Method
        </Text>
      ),
      dataIndex: "method",
      render: (method) => (
        <Space size={5}>
          <CreditCardOutlined style={{ color: C.textMuted, fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: C.textSec }}>{method}</Text>
        </Space>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Status
        </Text>
      ),
      dataIndex: "status",
      render: (status) => {
        const s = STATUS[status] || STATUS.Pending;
        return (
          <Tag
            icon={<span style={{ marginRight: 4 }}>{s.icon}</span>}
            style={{
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: s.bg,
              color: s.color,
              border: `1px solid ${s.border}`,
              padding: "2px 9px",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Expiry
        </Text>
      ),
      dataIndex: "expiry",
      render: (date) => (
        <Space size={5}>
          <CalendarOutlined style={{ color: C.textMuted, fontSize: 11 }} />
          <Text style={{ fontSize: 12, color: C.textSec }}>{date}</Text>
        </Space>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Action
        </Text>
      ),
      align: "center",
      render: (_, record) => (
        <Tooltip title="View payment details">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedPayment(record); setOpen(true); }}
            style={{
              borderRadius: 7,
              borderColor: C.primaryBorder,
              color: C.primary,
              background: C.primaryLight,
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  const sp = selectedPayment;
  const spStatus = sp ? STATUS[sp.status] || STATUS.Pending : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px" }}>

      {/* ══ PAGE HEADER ══ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Space align="center" size={10} style={{ marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.primaryLight,
                border: `1px solid ${C.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WalletOutlined style={{ color: C.primary, fontSize: 16 }} />
            </div>
            <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Payments Management
            </Title>
          </Space>
          <Text style={{ color: C.textSec, fontSize: 13 }}>
            Track school subscriptions, billing cycles and payment history
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            background: C.primary,
            borderColor: C.primary,
            borderRadius: 10,
            fontWeight: 600,
            height: 40,
            paddingInline: 20,
            boxShadow: "0 2px 8px rgba(15,110,86,0.25)",
          }}
        >
          Add Payment
        </Button>
      </div>

      {/* ══ STATS ══ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<DollarOutlined />}
            label="Total Revenue"
            value="₹5.4L"
            sub="all time"
            color={C.primary}
            bg={C.primaryLight}
            border={C.primaryBorder}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<CheckCircleFilled />}
            label="Active Plans"
            value="32"
            sub="currently running"
            color="#059669"
            bg="#ECFDF5"
            border="#A7F3D0"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<ExclamationCircleFilled />}
            label="Pending"
            value="6"
            sub="awaiting payment"
            color={C.orange}
            bg={C.orangeLight}
            border={C.orangeBorder}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            icon={<CloseCircleFilled />}
            label="Expired"
            value="4"
            sub="need renewal"
            color={C.danger}
            bg={C.dangerLight}
            border={C.dangerBorder}
          />
        </Col>
      </Row>

      {/* ══ FILTER BAR ══ */}
      <Card
        style={{
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          background: C.surface,
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        styles={{ body: { padding: "14px 18px" } }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Space size={6} align="center" style={{ marginRight: 4 }}>
            <FilterOutlined style={{ color: C.primary, fontSize: 12 }} />
            <Text style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filters
            </Text>
          </Space>

          <Input
            prefix={<SearchOutlined style={{ color: C.textMuted, fontSize: 12 }} />}
            placeholder="Search school..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220, borderRadius: 8, height: 34, fontSize: 13 }}
          />

          <Select
            placeholder="Plan"
            style={{ width: 130 }}
            value={planFilter}
            onChange={setPlanFilter}
            allowClear
            size="middle"
          >
            <Option value="basic">Basic</Option>
            <Option value="premium">Premium</Option>
          </Select>

          <Select
            placeholder="Status"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            size="middle"
          >
            <Option value="active">Active</Option>
            <Option value="expired">Expired</Option>
            <Option value="pending">Pending</Option>
          </Select>

          {(searchText || planFilter || statusFilter) && (
            <Button
              type="text"
              size="small"
              onClick={() => { setSearchText(""); setPlanFilter(null); setStatusFilter(null); }}
              style={{ color: C.danger, fontSize: 12 }}
            >
              Clear filters
            </Button>
          )}

          <Text style={{ marginLeft: "auto", fontSize: 12, color: C.textMuted }}>
            {filtered.length} of {data.length} records
          </Text>
        </div>
      </Card>

      {/* ══ TABLE ══ */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          background: C.surface,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="key"
          pagination={{ pageSize: 10, size: "small" }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ color: C.textMuted, fontSize: 13 }}>
                    No payments match your filters
                  </Text>
                }
                style={{ padding: "32px 0" }}
              />
            ),
          }}
          onRow={() => ({ style: { fontSize: 13 } })}
        />
      </Card>

      {/* ══ PAYMENT DETAIL MODAL ══ */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={480}
        destroyOnClose
        title={
          <Space align="center" size={10}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.primaryLight,
                border: `1px solid ${C.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeOutlined style={{ color: C.primary, fontSize: 13 }} />
            </div>
            <Title level={4} style={{ margin: 0, color: C.primary, fontSize: 16 }}>
              Payment Details
            </Title>
          </Space>
        }
        styles={{
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
          header: {
            background: C.primaryLight,
            borderBottom: `1px solid ${C.primaryBorder}`,
            borderRadius: "16px 16px 0 0",
            padding: "14px 20px",
            margin: 0,
          },
          body: { padding: "6px 20px 20px" },
        }}
      >
        {sp && (
          <>
            {/* School hero */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0 10px",
                borderBottom: `1px solid ${C.border}`,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: C.primaryLight,
                  border: `1px solid ${C.primaryBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BankOutlined style={{ color: C.primary, fontSize: 20 }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: C.text, display: "block" }}>
                  {sp.school}
                </Text>
                <Tag
                  style={{
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: spStatus.bg,
                    color: spStatus.color,
                    border: `1px solid ${spStatus.border}`,
                    padding: "1px 8px",
                    margin: 0,
                    marginTop: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {spStatus.icon} {sp.status}
                </Tag>
              </div>
            </div>

            <DetailRow label="Plan">
              <Tag style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, background: C.purpleLight, color: C.purple, border: `1px solid ${C.purpleBorder}`, padding: "2px 10px", margin: 0 }}>
                {sp.plan}
              </Tag>
            </DetailRow>

            <DetailRow label="Amount">
              <Text strong style={{ fontSize: 16, color: C.gold, letterSpacing: "-0.3px" }}>
                {sp.amount}
              </Text>
            </DetailRow>

            <DetailRow label="Billing Cycle">
              <Tag icon={<ClockCircleOutlined style={{ fontSize: 10 }} />} style={{ borderRadius: 6, fontSize: 12, fontWeight: 500, background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, padding: "2px 10px", margin: 0 }}>
                {sp.cycle}
              </Tag>
            </DetailRow>

            <DetailRow label="Payment Method">
              <Space size={5}>
                <CreditCardOutlined style={{ color: C.textMuted, fontSize: 13 }} />
                <Text style={{ fontSize: 13, color: C.textSec }}>{sp.method}</Text>
              </Space>
            </DetailRow>

            <DetailRow label="Expiry Date">
              <Space size={5}>
                <CalendarOutlined style={{ color: C.textMuted, fontSize: 12 }} />
                <Text style={{ fontSize: 13, color: C.textSec }}>{sp.expiry}</Text>
              </Space>
            </DetailRow>
          </>
        )}
      </Modal>

      <style>{`
        .ant-table-thead > tr > th {
          background: #F9FAFB !important;
          border-bottom: 1px solid ${C.border} !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 13px 16px !important;
          border-bottom: 1px solid ${C.border} !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: ${C.primaryLight} !important;
        }
      `}</style>
    </div>
  );
}