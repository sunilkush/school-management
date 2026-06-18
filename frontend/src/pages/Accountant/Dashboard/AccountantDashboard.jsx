import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Col, Empty, Row, Spin, Table, Tag, Typography } from "antd";
import {
  AlertOutlined, ArrowDownOutlined, ArrowUpOutlined, BankOutlined,
  BarChartOutlined, DollarOutlined, FileTextOutlined, ReloadOutlined,
  RiseOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { fetchAccountantDashboard } from "../../../features/financeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const KpiCard = ({ label, value, icon, color, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      ...sectionPanel, marginBottom: 0, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 14,
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
  >
    <div style={iconWell(color, 48)}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);

const ActionTile = ({ icon, label, path, color, navigate }) => (
  <div
    onClick={() => navigate(path)}
    style={{
      ...sectionPanel, marginBottom: 0, padding: "14px 12px",
      textAlign: "center", cursor: "pointer",
      transition: "transform 0.15s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
  >
    <div style={iconWell(color, 38, { margin: "0 auto 8px" })}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
  </div>
);

const activityTypeTag = (type) => {
  const map = { fee_payment: ["Fee", "#059669"], income: ["Income", "#0891b2"], expense: ["Expense", "#dc2626"] };
  const [label, color] = map[type] || ["Other", "#64748b"];
  return <Tag color={color} style={{ fontSize: 10 }}>{label}</Tag>;
};

const AccountantDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard, dashboardLoading } = useSelector((s) => s.finance || {});

  useEffect(() => { dispatch(fetchAccountantDashboard()); }, [dispatch]);

  const kpis          = dashboard?.kpis          || {};
  const monthlyChart  = dashboard?.monthlyChart  || [];
  const recentActivity = dashboard?.recentActivity || [];

  const netColor = (kpis.netProfitLoss || 0) >= 0 ? "#059669" : "#dc2626";
  const netLabel = (kpis.netProfitLoss || 0) >= 0 ? "Net Profit" : "Net Loss";

  const activityColumns = useMemo(() => [
    { title: "Type",        width: 80,  render: (_, r) => activityTypeTag(r.type) },
    { title: "Description", render: (_, r) => <Text style={{ fontSize: 13 }}>{r.title}</Text> },
    {
      title: "Amount", width: 130,
      render: (_, r) => (
        <span style={{ fontWeight: 700, fontSize: 13, color: r.amount < 0 ? "#dc2626" : "#059669" }}>
          {r.amount < 0 ? "-" : "+"}{money(Math.abs(r.amount))}
        </span>
      ),
    },
    { title: "Mode", dataIndex: "mode",  width: 90,  render: (m) => m ? <Tag style={{ fontSize: 10, textTransform: "capitalize" }}>{m}</Tag> : "—" },
    { title: "Date", dataIndex: "date",  width: 110, render: (d) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayjs(d).format("DD MMM YYYY")}</span> },
  ], []);

  if (dashboardLoading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Spin size="large" tip="Loading financial data…" />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("act-tbl")}</style>
      <PageHeader
        title="Financial Dashboard"
        subtitle="Revenue, expenses, fee collections, and payroll at a glance"
        icon={<BankOutlined />}
        extra={
          <div
            style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 13 }}
            onClick={() => dispatch(fetchAccountantDashboard())}
          >
            <ReloadOutlined /> Refresh
          </div>
        }
      />

      {/* ── KPI Row ──────────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        <KpiCard label="Total Revenue"        value={money(kpis.totalRevenue)}          icon={<RiseOutlined />}       color="#059669" sub="Fee + manual income" />
        <KpiCard label="Total Expenses"       value={money(kpis.totalExpenses)}         icon={<ArrowDownOutlined />}  color="#dc2626" />
        <KpiCard label={netLabel}             value={money(Math.abs(kpis.netProfitLoss))} icon={<BarChartOutlined />} color={netColor} />
        <KpiCard label="Fee Collected"        value={money(kpis.totalFeeCollected)}     icon={<WalletOutlined />}     color="#7c3aed" onClick={() => navigate("accountant/fees/collect")} />
        <KpiCard label="Pending Fees"         value={money(kpis.pendingFees)}           icon={<AlertOutlined />}      color="#f97316" sub={`${kpis.pendingFeeCount || 0} students`} onClick={() => navigate("accountant/fees/reports")} />
        <KpiCard label="This Month Income"    value={money(kpis.thisMonthIncome)}       icon={<DollarOutlined />}     color="#0891b2" />
        <KpiCard label="This Month Expense"   value={money(kpis.thisMonthExpense)}      icon={<FileTextOutlined />}   color="#d97706" />
        <KpiCard label="Payroll This Month"   value={money(kpis.payrollThisMonth)}      icon={<TeamOutlined />}       color="#8b5cf6" onClick={() => navigate("accountant/salary")} />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Quick Actions</div>
        <div style={statGrid(110)}>
          <ActionTile icon={<WalletOutlined />}   label="Collect Fee"   path="accountant/fees/collect"  color="#7c3aed" navigate={navigate} />
          <ActionTile icon={<DollarOutlined />}   label="Add Income"    path="accountant/income"        color="#059669" navigate={navigate} />
          <ActionTile icon={<FileTextOutlined />} label="Add Expense"   path="accountant/expenses"      color="#dc2626" navigate={navigate} />
          <ActionTile icon={<BarChartOutlined />} label="Reports"       path="accountant/reports"       color="#0891b2" navigate={navigate} />
          <ActionTile icon={<TeamOutlined />}     label="Payroll"       path="accountant/salary"        color="#8b5cf6" navigate={navigate} />
          <ActionTile icon={<AlertOutlined />}    label="Fee Reports"   path="accountant/fees/reports"  color="#f97316" navigate={navigate} />
        </div>
      </div>

      {/* ── Charts ───────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={14}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Income vs Expense — Last 6 Months</div>
            {monthlyChart.length === 0 ? (
              <Empty description="No financial data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={monthlyChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, name) => [money(v), name]} />
                  <Legend />
                  <Area type="monotone" dataKey="income"  stroke="#059669" fill="url(#incGrad)" name="Income"  strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#dc2626" fill="url(#expGrad)" name="Expense" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <div style={{ ...sectionPanel, marginBottom: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Fee Collection — Last 6 Months</div>
            {monthlyChart.length === 0 ? (
              <Empty description="No collection data" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={monthlyChart} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [money(v), "Collected"]} />
                  <Bar dataKey="feeCollection" fill="#7c3aed" radius={[5, 5, 0, 0]} name="Fee Collected" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
      </Row>

      {/* ── P&L Summary tiles ─────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: "Total Revenue",  value: money(kpis.totalRevenue),                   color: "#059669", bg: "#d1fae5" },
          { label: "Total Expenses", value: money(kpis.totalExpenses),                  color: "#dc2626", bg: "#fee2e2" },
          { label: netLabel,         value: money(Math.abs(kpis.netProfitLoss || 0)),   color: netColor,  bg: `${netColor}15` },
          { label: "Pending Fees",   value: money(kpis.pendingFees),                    color: "#f97316", bg: "#fef3c7" },
        ].map(({ label, value, color, bg }) => (
          <Col xs={12} sm={6} key={label}>
            <div style={{ background: bg, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Recent Transactions ───────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Recent Transactions</div>
        <Table
          className="act-tbl"
          rowKey="_id"
          columns={activityColumns}
          dataSource={recentActivity}
          pagination={{ pageSize: 10, size: "small" }}
          scroll={{ x: 600 }}
          locale={{ emptyText: <Empty description="No recent transactions" /> }}
          size="small"
        />
      </div>
    </div>
  );
};

export default AccountantDashboard;
