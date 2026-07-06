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
  const monthLong = d.toLocaleString("en-IN", { month: "long" });
  const year = d.getFullYear();

  if (mode === "yearly") {
    return { key: `${year}`, name: `${year}` };
  }

  if (mode === "quarterly") {
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    return { key: `${year}-Q${quarter}`, name: `Q${quarter} ${year}` };
  }

  return { key: `${year}-${d.getMonth() + 1}`, name: `${monthShort} ${year}`, longName: `${monthLong} ${year}` };
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
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          {formatCurrency(payload[0].value)}
        </div>
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
  const { schools = [], loading } = useSelector((state) => state.school);
  const [filter, setFilter] = useState("monthly");

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const schoolRevenue = useMemo(() => {
    return (schools || []).map((school, index) => {
      const plan = school.subscriptionPlan || {};
      const amount = Number(plan.price || 0);

      return {
        key: school._id || index,
        school: school.name || "Unknown School",
        plan: plan.name || "Unassigned",
        revenue: amount,
        status: school.isActive ? "Paid" : "Pending",
        growth: "+0%",
        createdAt: school.createdAt,
      };
    });
  }, [schools]);

  const chartData = useMemo(() => {
    const grouped = schoolRevenue.reduce((acc, row) => {
      const period = getPeriodKey(row.createdAt, filter);

      if (!period) {
        return acc;
      }

      if (!acc[period.key]) {
        acc[period.key] = {
          key: period.key,
          name: period.name,
          revenue: 0,
        };
      }

      acc[period.key].revenue += row.revenue;
      return acc;
    }, {});

    const sorted = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));

    return sorted.map((item, index) => {
      const prevRevenue = sorted[index - 1]?.revenue || item.revenue;
      const growth = prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : 0;

      return {
        ...item,
        target: Math.round(item.revenue * 1.1),
        growth,
      };
    });
  }, [schoolRevenue, filter]);

  const stats = useMemo(() => {
    const totalRevenue = schoolRevenue.reduce((sum, row) => sum + row.revenue, 0);
    const currentPeriodRevenue = chartData[chartData.length - 1]?.revenue || 0;
    const growth = chartData[chartData.length - 1]?.growth || 0;

    return {
      totalRevenue,
      currentPeriodRevenue,
      growth,
    };
  }, [schoolRevenue, chartData]);

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
      title: "Revenue",
      dataIndex: "revenue",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      title: "Growth",
      dataIndex: "growth",
      render: (g) => (
        <Space size={4}>
          <ArrowUpOutlined style={{ color: "#22C55E", fontSize: 11 }} />
          <span style={{ color: "#22C55E", fontWeight: 600 }}>{g}</span>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [{ text: "Paid", value: "Paid" }, { text: "Pending", value: "Pending" }],
      onFilter: (v, r) => r.status === v,
      render: (status) => (
        <Badge
          status={status === "Paid" ? "success" : "warning"}
          text={<span style={pill(status === "Paid" ? "#15803D" : "#B45309", status === "Paid" ? "rgba(220,252,231,0.5)" : "rgba(254,243,199,0.5)")}>{status}</span>}
        />
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Revenue Analytics"
        subtitle="Dynamic data from school subscriptions"
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

      <div style={{ ...statGrid(220), marginTop: 20 }}>
        <KpiCard icon={<RupeeIcon />} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="from all schools" color="#2563EB" />
        <KpiCard icon={<FundOutlined />} label={periodLabel} value={formatCurrency(stats.currentPeriodRevenue)} sub="latest period" color="#7C3AED" />
        <KpiCard icon={<RiseOutlined />} label="Growth Rate" value={`${stats.growth.toFixed(1)}%`} sub="period-over-period" color="#22C55E" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }} className="revenue-charts-grid">
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Revenue Trend</span>
            <span style={pill("#2563EB")}>vs Target</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradRevenue)" name="Revenue" dot={{ r: 4, fill: "#2563EB" }} />
              <Area type="monotone" dataKey="target" stroke="#7C3AED" strokeWidth={2} strokeDasharray="5 4" fill="url(#gradTarget)" name="Target" dot={false} />
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
              <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} name="Revenue" />
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
