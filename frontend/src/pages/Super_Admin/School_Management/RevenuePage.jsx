import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Avatar,
  Badge,
  Tooltip,
  ConfigProvider,
} from "antd";
import {
  ArrowUpOutlined,
  SearchOutlined,
  DownloadOutlined,
  RiseOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

/* ─── Inline styles (no external CSS file needed) ─── */
const S = {
  page: {
    background: "#f5f6fa",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  header: {
    background: "#0f0c29",
    backgroundImage: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 },
  headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  liveBadge: {
    background: "rgba(82,196,26,0.15)",
    border: "1px solid rgba(82,196,26,0.4)",
    color: "#52c41a",
    borderRadius: 20,
    padding: "2px 12px",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#52c41a",
    animation: "pulse 1.5s infinite",
  },
  main: { padding: "24px 32px" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#8c8c8c",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  statCard: {
    borderRadius: 16,
    border: "none",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    cursor: "default",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  statLabel: { fontSize: 12, color: "#8c8c8c", fontWeight: 500, marginBottom: 4 },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: "'DM Mono', monospace",
    color: "#141414",
    letterSpacing: -0.5,
    lineHeight: 1.2,
  },
  statTrend: { fontSize: 12, color: "#52c41a", marginTop: 6, display: "flex", alignItems: "center", gap: 4 },
  chartCard: {
    borderRadius: 16,
    border: "none",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  barCard: {
    borderRadius: 16,
    border: "none",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  tableCard: {
    borderRadius: 16,
    border: "none",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
};

/* ─── Data ─── */
const ALL_DATA = [
  { key: 1, school: "ABC Public School",      city: "Delhi",     plan: "Premium",  amount: 9990,  date: "12 Apr 2026", status: "Paid" },
  { key: 2, school: "XYZ International",      city: "Mumbai",    plan: "Basic",    amount: 4990,  date: "10 Apr 2026", status: "Pending" },
  { key: 3, school: "Sunrise Academy",        city: "Bengaluru", plan: "Premium",  amount: 9990,  date: "08 Apr 2026", status: "Paid" },
  { key: 4, school: "Green Valley School",    city: "Pune",      plan: "Standard", amount: 6490,  date: "05 Apr 2026", status: "Paid" },
  { key: 5, school: "New Horizon Vidyalaya",  city: "Hyderabad", plan: "Standard", amount: 6490,  date: "03 Apr 2026", status: "Overdue" },
  { key: 6, school: "Bright Future School",   city: "Chennai",   plan: "Basic",    amount: 4990,  date: "01 Apr 2026", status: "Pending" },
  { key: 7, school: "Little Stars Academy",   city: "Kolkata",   plan: "Premium",  amount: 9990,  date: "28 Mar 2026", status: "Paid" },
  { key: 8, school: "National Public School", city: "Ahmedabad", plan: "Standard", amount: 6490,  date: "25 Mar 2026", status: "Paid" },
];

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const DATA_26 = [62000, 71000, 78000, 85000, 90000, 95000];
const DATA_25 = [48000, 52000, 58000, 63000, 70000, 77000];

const PLAN_BARS = [
  { label: "Premium",  pct: 72, value: "₹6.05L", color: "#6c5ce7" },
  { label: "Standard", pct: 45, value: "₹1.78L", color: "#00b894" },
  { label: "Basic",    pct: 28, value: "₹57,000", color: "#0984e3" },
  { label: "Trial",    pct: 8,  value: "₹0",       color: "#e17055" },
];

/* ─── Avatar colours ─── */
const AV_COLORS = [
  { bg: "#f0eeff", color: "#6c5ce7" },
  { bg: "#e3f2fd", color: "#0984e3" },
  { bg: "#e8f5e9", color: "#00897b" },
  { bg: "#fff8e1", color: "#e65100" },
  { bg: "#fce4ec", color: "#880e4f" },
  { bg: "#e0f2f1", color: "#00695c" },
  { bg: "#f3e5f5", color: "#6a1b9a" },
  { bg: "#fff3e0", color: "#bf360c" },
];

function initials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

/* ─── Mini SVG Line Chart ─── */
function MiniChart() {
  const W = 520, H = 160, PAD = 20;
  const max = Math.max(...DATA_26, ...DATA_25);
  const xs = MONTHS.map((_, i) => PAD + (i / (MONTHS.length - 1)) * (W - PAD * 2));
  const y26 = DATA_26.map((v) => H - PAD - ((v / max) * (H - PAD * 2)));
  const y25 = DATA_25.map((v) => H - PAD - ((v / max) * (H - PAD * 2)));

  const smooth = (pts) => {
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const cx = (x1 + x2) / 2;
      d += ` C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    }
    return d;
  };

  const path26 = smooth(xs.map((x, i) => [x, y26[i]]));
  const path25 = smooth(xs.map((x, i) => [x, y25[i]]));
  const fillPath = path26 + ` L ${xs[xs.length - 1]} ${H - PAD} L ${xs[0]} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160 }}>
      <defs>
        <linearGradient id="grad26" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line
          key={i}
          x1={PAD} y1={PAD + f * (H - PAD * 2)}
          x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
          stroke="#f0f0f0" strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      <path d={fillPath} fill="url(#grad26)" />
      {/* 2025 dashed line */}
      <path d={path25} fill="none" stroke="#d9d9d9" strokeWidth="1.5" strokeDasharray="5 3" />
      {/* 2026 line */}
      <path d={path26} fill="none" stroke="#6c5ce7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points 2026 */}
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={y26[i]} r="4" fill="#6c5ce7" />
      ))}
      {/* X labels */}
      {MONTHS.map((m, i) => (
        <text key={i} x={xs[i]} y={H - 2} textAnchor="middle" fontSize="11" fill="#8c8c8c">{m}</text>
      ))}
      {/* Y labels */}
      {[0, 50000, 100000].map((v, i) => (
        <text key={i} x={PAD - 4} y={H - PAD - ((v / max) * (H - PAD * 2)) + 4} textAnchor="end" fontSize="10" fill="#bfbfbf">
          {v === 0 ? "0" : v / 1000 + "K"}
        </text>
      ))}
    </svg>
  );
}

/* ─── Plan Bar ─── */
function PlanBar({ label, pct, value, color, animate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: 12, color: "#8c8c8c", width: 56, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          background: color,
          borderRadius: 4,
          width: animate ? `${pct}%` : "0%",
          transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#141414", width: 60, textAlign: "right" }}>{value}</span>
    </div>
  );
}

/* ─── Status Tag ─── */
function StatusTag({ status }) {
  const map = {
    Paid:    { color: "#52c41a", bg: "#f6ffed", border: "#b7eb8f" },
    Pending: { color: "#fa8c16", bg: "#fff7e6", border: "#ffd591" },
    Overdue: { color: "#ff4d4f", bg: "#fff2f0", border: "#ffa39e" },
  };
  const s = map[status] || map.Paid;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

/* ─── Plan Chip ─── */
function PlanChip({ plan }) {
  const map = {
    Premium:  { color: "#6c5ce7", bg: "#f0eeff", border: "#d3cdf7" },
    Standard: { color: "#e67e22", bg: "#fff8ee", border: "#fdd7a0" },
    Basic:    { color: "#0984e3", bg: "#e8f4fd", border: "#9ed4f5" },
  };
  const s = map[plan] || map.Basic;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500,
    }}>
      {plan}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, trend, icon, accentColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Card
      style={{
        ...S.statCard,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.06)",
        borderTop: `3px solid ${accentColor}`,
      }}
      bodyStyle={{ padding: "18px 20px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={S.statLabel}>{label}</div>
          <div style={S.statValue}>{value}</div>
          <div style={S.statTrend}>
            <ArrowUpOutlined style={{ fontSize: 10 }} />
            {trend}
          </div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: accentColor,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Component ─── */
export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState("6M");

  useEffect(() => {
    const t = setTimeout(() => setBarsAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = ALL_DATA.filter((r) => {
    if (search && !r.school.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (planFilter && r.plan !== planFilter) return false;
    return true;
  });

  const columns = [
    {
      title: "School",
      dataIndex: "school",
      render: (_, record, index) => {
        const ac = AV_COLORS[index % AV_COLORS.length];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              style={{ background: ac.bg, color: ac.color, fontWeight: 700, fontSize: 12, flexShrink: 0 }}
              size={34}
              shape="square"
            >
              {initials(record.school)}
            </Avatar>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#141414" }}>{record.school}</div>
              <div style={{ fontSize: 11, color: "#8c8c8c" }}>{record.city}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => <PlanChip plan={plan} />,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amt) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#141414" }}>
          ₹{amt.toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => <span style={{ fontSize: 12, color: "#8c8c8c" }}>{d}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <StatusTag status={s} />,
      filters: [
        { text: "Paid", value: "Paid" },
        { text: "Pending", value: "Pending" },
        { text: "Overdue", value: "Overdue" },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6c5ce7",
          borderRadius: 12,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        },
      }}
    >
      <div style={S.page}>

        {/* ── Header ── */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>Revenue Dashboard</div>
            <div style={S.headerSub}>April 2026 · All Schools</div>
          </div>
          <div style={S.liveBadge}>
            <span style={S.liveDot} />
            Live
          </div>
        </div>

        <div style={S.main}>

          {/* ── Stats ── */}
          <div style={S.sectionLabel}>Overview</div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard label="Total Revenue" value="₹8,40,000" trend="+18% from last year" icon={<DollarOutlined />} accentColor="#6c5ce7" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard label="This Month" value="₹95,000" trend="+12% vs Mar" icon={<RiseOutlined />} accentColor="#00b894" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard label="Active Subscriptions" value="36" trend="4 new this month" icon={<TeamOutlined />} accentColor="#0984e3" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard label="Avg Revenue / School" value="₹23,000" trend="+5.2% growth" icon={<CalendarOutlined />} accentColor="#e17055" />
            </Col>
          </Row>

          {/* ── Chart + Plan Bar ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card
                style={S.chartCard}
                bodyStyle={{ padding: "20px 24px" }}
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Monthly Revenue</span>
                    <Space>
                      {["3M", "6M", "1Y"].map((t) => (
                        <Button
                          key={t}
                          size="small"
                          type={activeTab === t ? "primary" : "default"}
                          onClick={() => setActiveTab(t)}
                          style={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }}
                        >
                          {t}
                        </Button>
                      ))}
                    </Space>
                  </div>
                }
              >
                <MiniChart />
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8c8c8c" }}>
                    <span style={{ width: 24, height: 3, background: "#6c5ce7", borderRadius: 2, display: "inline-block" }} />
                    Revenue 2026
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8c8c8c" }}>
                    <span style={{ width: 24, height: 3, background: "#d9d9d9", borderRadius: 2, display: "inline-block", borderTop: "2px dashed #d9d9d9",  }} />
                    Revenue 2025
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                style={{ ...S.barCard, height: "100%" }}
                bodyStyle={{ padding: "20px 24px" }}
                title={<span style={{ fontSize: 14, fontWeight: 600 }}>Plan Distribution</span>}
              >
                {PLAN_BARS.map((b) => (
                  <PlanBar key={b.label} {...b} animate={barsAnimated} />
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f5f5f5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "#8c8c8c" }}>Renewal rate</span>
                    <span style={{ fontWeight: 700, color: "#52c41a" }}>94.4%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#8c8c8c" }}>Pending invoices</span>
                    <span style={{ fontWeight: 700, color: "#fa8c16" }}>₹14,500</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* ── Transactions Table ── */}
          <div style={S.sectionLabel}>Transactions</div>
          <Card style={S.tableCard} bodyStyle={{ padding: 0 }}>
            {/* Filter Row */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10, padding: "16px 20px",
              borderBottom: "1px solid #f5f5f5",
            }}>
              <Space wrap>
                <Input
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Search school..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 200, borderRadius: 10 }}
                  size="middle"
                />
                <Select
                  placeholder="All Status"
                  allowClear
                  value={statusFilter || undefined}
                  onChange={(v) => setStatusFilter(v || "")}
                  style={{ width: 130, borderRadius: 10 }}
                  size="middle"
                  suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
                >
                  <Option value="Paid">Paid</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Overdue">Overdue</Option>
                </Select>
                <Select
                  placeholder="All Plans"
                  allowClear
                  value={planFilter || undefined}
                  onChange={(v) => setPlanFilter(v || "")}
                  style={{ width: 130, borderRadius: 10 }}
                  size="middle"
                  suffixIcon={<FilterOutlined style={{ fontSize: 11 }} />}
                >
                  <Option value="Premium">Premium</Option>
                  <Option value="Standard">Standard</Option>
                  <Option value="Basic">Basic</Option>
                </Select>
              </Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                style={{
                  background: "#0f0c29",
                  borderColor: "#0f0c29",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Export CSV
              </Button>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="key"
              pagination={{
                pageSize: 5,
                size: "small",
                showSizeChanger: false,
                style: { padding: "12px 20px" },
              }}
              style={{ borderRadius: 0 }}
              onRow={(_, index) => ({
                style: { background: index % 2 === 0 ? "#fff" : "#fafafa" },
              })}
            />
          </Card>

        </div>
      </div>

      {/* Pulse animation for live dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </ConfigProvider>
  );
}