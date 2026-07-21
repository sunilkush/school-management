import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Select,
  Space,
  Badge,
} from "antd";
import {
  RiseOutlined,
  FundOutlined,
  ArrowUpOutlined,
  BankOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchRevenueSummary, fetchBillingInvoices } from "../../../features/superAdminBillingSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, avatarStyle,
} from "../../../styles/pageStyles";

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getPeriodKey = (date, mode) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const monthShort = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();

  if (mode === "yearly") {
    return { key: `${year}`, name: `${year}` };
  }

  if (mode === "quarterly") {
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    return { key: `${year}-Q${quarter}`, name: `Q${quarter} ${year}` };
  }

  return { key: `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`, name: `${monthShort} ${year}` };
};

const statusStyles = {
  Paid: { badge: "success", color: "#15803D", bg: "rgba(220,252,231,0.5)" },
  Partial: { badge: "warning", color: "#B45309", bg: "rgba(254,243,199,0.5)" },
  Pending: { badge: "error", color: "#DC2626", bg: "rgba(254,226,226,0.5)" },
  "No Invoices": { badge: "default", color: "#64748B", bg: "rgba(241,245,249,0.6)" },
};

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
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
        {payload.map((entry) => (
          <div key={entry.dataKey} style={{ fontSize: 13, fontWeight: 700, color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const KpiCard = ({ icon, label, value, sub, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 0 }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <ArrowUpOutlined style={{ color: "#22C55E", fontSize: 11 }} />
          <span style={{ color: "#22C55E", fontSize: 12 }}>{sub}</span>
        </div>
      )}
    </div>
    <div style={iconWell(color, 44)}>{icon}</div>
  </div>
);

const RevenueAnalytics = () => {
  const dispatch = useDispatch();
  const { schools = [] } = useSelector((state) => state.school);
  const {
    invoices = [],
    revenueSummary = {},
    loading = false,
  } = useSelector((state) => state.superAdminBilling || {});
  const [filter, setFilter] = useState("monthly");

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRevenueSummary());
    dispatch(fetchBillingInvoices());
  }, [dispatch]);

  const planBySchoolId = useMemo(() => {
    const map = {};
    (schools || []).forEach((school) => {
      map[school._id] = school.subscriptionPlan?.name || "Unassigned";
    });
    return map;
  }, [schools]);

  // Real period buckets built from actual invoices (createdAt + totalAmount + status),
  // not a client-side guess — "paid" is realized revenue, "invoiced" is total billed.
  const chartData = useMemo(() => {
    const grouped = invoices.reduce((acc, invoice) => {
      const period = getPeriodKey(invoice.createdAt, filter);
      if (!period) return acc;

      if (!acc[period.key]) {
        acc[period.key] = { key: period.key, name: period.name, invoiced: 0, paid: 0 };
      }

      const amount = Number(invoice.totalAmount || 0);
      acc[period.key].invoiced += amount;
      if (invoice.status === "paid") {
        acc[period.key].paid += amount;
      }
      return acc;
    }, {});

    const sorted = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));

    return sorted.map((item, index) => {
      const prevPaid = sorted[index - 1]?.paid || 0;
      const growth = prevPaid > 0
        ? ((item.paid - prevPaid) / prevPaid) * 100
        : (item.paid > 0 ? 100 : 0);

      return { ...item, growth };
    });
  }, [invoices, filter]);

  const stats = useMemo(() => {
    const currentPeriodRevenue = chartData[chartData.length - 1]?.paid || 0;
    const growth = chartData[chartData.length - 1]?.growth || 0;
    return { currentPeriodRevenue, growth };
  }, [chartData]);

  // Per-school rollup from real invoices — replaces the old static subscriptionPlan.price sum.
  const schoolRevenue = useMemo(() => {
    const bySchool = {};

    invoices.forEach((invoice) => {
      const schoolRef = invoice.schoolId;
      const id = schoolRef?._id || schoolRef || "unknown";

      if (!bySchool[id]) {
        bySchool[id] = {
          key: id,
          school: schoolRef?.name || "Unknown School",
          plan: planBySchoolId[id] || "Unassigned",
          totalInvoiced: 0,
          totalPaid: 0,
          invoiceCount: 0,
        };
      }

      const amount = Number(invoice.totalAmount || 0);
      bySchool[id].totalInvoiced += amount;
      bySchool[id].invoiceCount += 1;
      if (invoice.status === "paid") {
        bySchool[id].totalPaid += amount;
      }
    });

    return Object.values(bySchool).map((row) => {
      const outstanding = Math.max(0, row.totalInvoiced - row.totalPaid);
      const status = row.totalPaid >= row.totalInvoiced && row.totalInvoiced > 0
        ? "Paid"
        : row.totalPaid > 0
          ? "Partial"
          : "Pending";

      return { ...row, outstanding, status };
    });
  }, [invoices, planBySchoolId]);

  const periodLabel = filter === "yearly" ? "This Year" : filter === "quarterly" ? "This Quarter" : "This Month";

  const planColors = { Premium: "purple", Basic: "blue", Enterprise: "gold", Unassigned: "default" };
  const planIcons = {
    Premium: <TrophyOutlined />,
    Basic: <ThunderboltOutlined />,
    Enterprise: <BankOutlined />,
    Unassigned: <BankOutlined />,
  };

  const columns = [
    {
      title: "School",
      dataIndex: "school",
      render: (name) => (
        <Space>
          <div style={avatarStyle(name, 30)}><BankOutlined style={{ fontSize: 13 }} /></div>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{name}</span>
        </Space>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => (
        <Tag icon={planIcons[plan] || <BankOutlined />} color={planColors[plan] || "default"} style={{ fontWeight: 600, borderRadius: 6 }}>
          {plan}
        </Tag>
      ),
    },
    {
      title: "Total Invoiced",
      dataIndex: "totalInvoiced",
      sorter: (a, b) => a.totalInvoiced - b.totalInvoiced,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      title: "Total Paid",
      dataIndex: "totalPaid",
      render: (v) => <span style={{ fontWeight: 700, color: "#15803D" }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      render: (v) => <span style={{ fontWeight: 600, color: v > 0 ? "#DC2626" : "var(--text-muted)" }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Invoices",
      dataIndex: "invoiceCount",
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
        { text: "Paid", value: "Paid" },
        { text: "Partial", value: "Partial" },
        { text: "Pending", value: "Pending" },
      ],
      onFilter: (v, r) => r.status === v,
      render: (status) => {
        const cfg = statusStyles[status] || statusStyles.Pending;
        return <Badge status={cfg.badge} text={<span style={pill(cfg.color, cfg.bg)}>{status}</span>} />;
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Revenue Analytics"
        subtitle="Live data from billing invoices and payments"
        icon={<RupeeIcon />}
        extra={
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 140 }}
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Quarterly", value: "quarterly" },
              { label: "Yearly", value: "yearly" },
            ]}
          />
        }
      />

      <div style={{ ...statGrid(200), marginTop: 20 }}>
        <KpiCard icon={<FileTextOutlined />} label="Total Invoiced" value={formatCurrency(revenueSummary.totalInvoiced)} sub="all generated invoices" color="#2563EB" />
        <KpiCard icon={<CheckCircleOutlined />} label="Total Paid" value={formatCurrency(revenueSummary.totalPaid)} sub="received payments" color="#22C55E" />
        <KpiCard icon={<ClockCircleOutlined />} label="Outstanding" value={formatCurrency(revenueSummary.totalOutstanding)} sub="pending collection" color="#F59E0B" />
        <KpiCard icon={<FundOutlined />} label={`${periodLabel} Paid`} value={formatCurrency(stats.currentPeriodRevenue)} sub={`${stats.growth >= 0 ? "+" : ""}${stats.growth.toFixed(1)}% vs prior period`} color="#7C3AED" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }} className="revenue-charts-grid">
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Revenue Trend</span>
            <span style={pill("#2563EB")}>Invoiced vs Paid</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInvoiced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="paid" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradPaid)" name="Paid" dot={{ r: 4, fill: "#2563EB" }} />
              <Area type="monotone" dataKey="invoiced" stroke="#7C3AED" strokeWidth={2} strokeDasharray="5 4" fill="url(#gradInvoiced)" name="Invoiced" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>Period Breakdown</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barSize={28} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="paid" fill="#2563EB" radius={[6, 6, 0, 0]} name="Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .revenue-charts-grid { grid-template-columns: 1fr !important; }
        }
        ${tableHeadCss("revenue-tbl")}
      `}</style>

      <div style={{ ...sectionPanel, padding: 0 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-muted)", display: "flex", alignItems: "center", gap: 10 }}>
          <BankOutlined style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>School Revenue Breakdown</span>
          <span style={pill("var(--text-muted)")}>{schoolRevenue.length} schools</span>
        </div>
        <div className="revenue-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
          <Table
            columns={columns}
            dataSource={schoolRevenue}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
