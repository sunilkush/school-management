import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Col, Empty, Row, Skeleton, Table, Tag, Tooltip, Typography } from "antd";
import {
  AlertOutlined, ArrowDownOutlined, ArrowUpOutlined, BankOutlined,
  BarChartOutlined, FileTextOutlined, ReloadOutlined,
  RiseOutlined, TeamOutlined, WalletOutlined, ThunderboltOutlined,
  FallOutlined, LineChartOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import dayjs from "dayjs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RcTooltip,
  ResponsiveContainer, Legend, CartesianGrid, Cell,
} from "recharts";
import { fetchAccountantDashboard } from "../../../features/financeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss } from "../../../styles/pageStyles";

const { Text } = Typography;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const moneyK = (v) => {
  const n = Number(v || 0);
  if (n >= 1_00_000)  return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
};

/* ── Custom chart tooltip ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-muted)", borderRadius: 10,
      padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{money(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI card ─────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, color, sub, onClick, accent }) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--surface)",
      borderRadius: 14,
      border: "1px solid var(--border-muted)",
      borderLeft: `4px solid ${accent || color}`,
      padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.18s ease, transform 0.18s ease",
    }}
    onMouseEnter={(e) => {
      if (!onClick) return;
      e.currentTarget.style.boxShadow = `0 4px 18px color-mix(in srgb, ${color} 12%, transparent)`;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>
      )}
    </div>
    {onClick && (
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 8%, transparent)`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
      }}>→</div>
    )}
  </div>
);

/* ── Quick action pill ────────────────────────────────────────────── */
const ActionPill = ({ icon, label, path, color, navigate }) => (
  <div
    onClick={() => navigate(path)}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 16px", borderRadius: 10, cursor: "pointer",
      border: `1px solid var(--border-muted)`,
      background: "var(--surface)",
      transition: "all 0.18s ease",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.background = `color-mix(in srgb, ${color} 5%, transparent)`;
      e.currentTarget.style.boxShadow = `0 2px 10px color-mix(in srgb, ${color} 9%, transparent)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-muted)";
      e.currentTarget.style.background = "var(--surface)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div style={iconWell(color, 28, { flexShrink: 0 })}>{icon}</div>
    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
  </div>
);

/* ── Transaction type badge ───────────────────────────────────────── */
const TxBadge = ({ type }) => {
  const cfg = {
    fee_payment: { label: "Fee",     color: "var(--success-hover)", bg: "var(--success-light)" },
    income:      { label: "Income",  color: "var(--primary-hover)", bg: "var(--primary-light)" },
    expense:     { label: "Expense", color: "var(--danger-hover)", bg: "var(--danger-light)" },
  }[type] || { label: "Other", color: "var(--text-muted)", bg: "var(--surface-soft)" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
};

/* ── Loading skeleton ─────────────────────────────────────────────── */
const DashboardSkeleton = () => (
  <div style={pageWrapper}>
    <div style={{ ...statGrid(160), marginBottom: 20 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ ...sectionPanel, marginBottom: 0, padding: "16px 18px" }}>
          <Skeleton active avatar={{ size: 46, shape: "square" }} paragraph={{ rows: 1 }} />
        </div>
      ))}
    </div>
    <div style={{ ...sectionPanel, marginBottom: 20 }}>
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}><div style={sectionPanel}><Skeleton active paragraph={{ rows: 8 }} /></div></Col>
      <Col xs={24} lg={10}><div style={sectionPanel}><Skeleton active paragraph={{ rows: 8 }} /></div></Col>
    </Row>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AccountantDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { dashboard, dashboardLoading } = useSelector((s) => s.finance || {});

  useEffect(() => { dispatch(fetchAccountantDashboard()); }, [dispatch]);

  const kpis           = dashboard?.kpis          || {};
  const monthlyChart   = dashboard?.monthlyChart  || [];
  const recentActivity = dashboard?.recentActivity || [];

  const isProfit  = (kpis.netProfitLoss || 0) >= 0;
  const netColor  = isProfit ? "var(--success)" : "var(--danger-hover)";
  const netLabel  = isProfit ? "Net Profit" : "Net Loss";

  const expenseRatio = useMemo(() => {
    const rev = kpis.totalRevenue || 0;
    const exp = kpis.totalExpenses || 0;
    if (!rev) return 0;
    return Math.min(100, Math.round((exp / rev) * 100));
  }, [kpis]);

  const axisClr  = "var(--text-muted)";
  const gridClr  = "var(--border)";
  const tipContent = (props) => <ChartTip {...props} />;

  const txColumns = useMemo(() => [
    { title: "Type",        width: 82,  render: (_, r) => <TxBadge type={r.type} /> },
    {
      title: "Description",
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.title}</Text>
        </div>
      ),
    },
    {
      title: "Amount", width: 130, align: "right",
      render: (_, r) => (
        <span style={{ fontWeight: 800, fontSize: 14, color: r.amount < 0 ? "var(--danger-hover)" : "var(--success)" }}>
          {r.amount < 0 ? "−" : "+"}{money(Math.abs(r.amount))}
        </span>
      ),
    },
    {
      title: "Mode", dataIndex: "mode", width: 90,
      render: (m) => m
        ? <Tag style={{ fontSize: 10, borderRadius: 6, textTransform: "capitalize" }}>{m}</Tag>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Date", dataIndex: "date", width: 115,
      render: (d) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayjs(d).format("DD MMM YYYY")}</span>,
    },
  ], []);

  if (dashboardLoading) return <DashboardSkeleton />;

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("tx-tbl")}</style>

      <PageHeader
        title="Financial Dashboard"
        subtitle={`Overview for ${dayjs().format("MMMM YYYY")}`}
        icon={<BankOutlined />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchAccountantDashboard())}
            style={{ borderRadius: 8 }}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Financial Health Banner ────────────────────────────────── */}
      <div style={{
        borderRadius: 16,
        background: isProfit
          ? `linear-gradient(135deg, var(--success-light) 0%, rgba(var(--success-rgb), 0.18) 50%, var(--success-light) 100%)`
          : `linear-gradient(135deg, var(--danger-light) 0%, rgba(var(--danger-rgb), 0.18) 50%, var(--danger-light) 100%)`,
        border: `1px solid ${isProfit ? "var(--success-light)" : "var(--danger-light)"}`,
        borderLeft: `5px solid ${netColor}`,
        padding: "22px 28px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 28,
        flexWrap: "wrap",
      }}>
        {/* Net P&L */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: `color-mix(in srgb, ${netColor} 12%, transparent)`, color: netColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            {isProfit ? <RiseOutlined /> : <FallOutlined />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: netColor, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
              {netLabel}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: netColor, lineHeight: 1 }}>
              {money(Math.abs(kpis.netProfitLoss || 0))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 52, background: `color-mix(in srgb, ${netColor} 18%, transparent)`, flexShrink: 0 }} />

        {/* Expense ratio */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Expense Ratio</Text>
            <Text style={{ fontSize: 12, fontWeight: 800, color: expenseRatio > 80 ? "var(--danger-hover)" : "var(--success)" }}>
              {expenseRatio}%
            </Text>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${expenseRatio}%`,
              borderRadius: 8,
              background: expenseRatio > 80
                ? "linear-gradient(90deg, var(--warning), var(--danger))"
                : "linear-gradient(90deg, var(--success), var(--success-hover))",
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>Revenue: {moneyK(kpis.totalRevenue)}</Text>
            <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>Expenses: {moneyK(kpis.totalExpenses)}</Text>
          </div>
        </div>

        {/* Month stats */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "This Month Income",  value: moneyK(kpis.thisMonthIncome),  color: "var(--success)" },
            { label: "This Month Expense", value: moneyK(kpis.thisMonthExpense), color: "var(--danger-hover)" },
            { label: "Payroll",            value: moneyK(kpis.payrollThisMonth), color: "var(--primary)" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Primary KPI Cards ─────────────────────────────────────── */}
      <div style={{ ...statGrid(180), marginBottom: 16 }}>
        <KpiCard
          label="Total Revenue" value={money(kpis.totalRevenue)}
          icon={<RiseOutlined />} color="var(--success)"
          sub="Fee + manual income"
        />
        <KpiCard
          label="Total Expenses" value={money(kpis.totalExpenses)}
          icon={<ArrowDownOutlined />} color="var(--danger-hover)"
        />
        <KpiCard
          label="Fee Collected" value={money(kpis.totalFeeCollected)}
          icon={<WalletOutlined />} color="var(--primary)"
          onClick={() => navigate("/dashboard/accountant/fees/collect")}
        />
        <KpiCard
          label="Pending Fees" value={money(kpis.pendingFees)}
          icon={<AlertOutlined />} color="var(--warning)"
          sub={`${kpis.pendingFeeCount || 0} students pending`}
          onClick={() => navigate("/dashboard/accountant/fees/reports")}
        />
      </div>

      {/* ── Quick Actions Bar ─────────────────────────────────────── */}
      <div style={{
        ...sectionPanel,
        marginBottom: 20,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 6, flexShrink: 0 }}>
          <div style={iconWell("var(--purple)", 28)}><ThunderboltOutlined style={{ fontSize: 12 }} /></div>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Quick Actions
          </Text>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-muted)", flexShrink: 0 }} />
        <ActionPill icon={<WalletOutlined />}    label="Collect Fee"   path="/dashboard/accountant/fees/collect"  color="var(--primary)" navigate={navigate} />
        <ActionPill icon={<ArrowUpOutlined />}   label="Add Income"    path="/dashboard/accountant/income"        color="var(--success)" navigate={navigate} />
        <ActionPill icon={<FileTextOutlined />}  label="Add Expense"   path="/dashboard/accountant/expenses"      color="var(--danger-hover)" navigate={navigate} />
        <ActionPill icon={<BarChartOutlined />}  label="Reports"       path="/dashboard/accountant/reports"       color="var(--accent)" navigate={navigate} />
        <ActionPill icon={<AlertOutlined />}     label="Fee Reports"   path="/dashboard/accountant/fees/reports"  color="var(--warning)" navigate={navigate} />
        <ActionPill icon={<TeamOutlined />}      label="Payroll"       path="/dashboard/accountant/salary"        color="var(--purple)" navigate={navigate} />
      </div>

      {/* ── Charts ───────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Income vs Expense — Area Chart */}
        <Col xs={24} lg={14}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWell("var(--purple)", 32)}><LineChartOutlined style={{ fontSize: 14 }} /></div>
              <div>
                <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                  Income vs Expense
                </Text>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Last 6 months trend</Text>
              </div>
            </div>

            {monthlyChart.length === 0 ? (
              <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Empty description="No financial data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--success)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--danger)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false} tickFormatter={moneyK} />
                  <RcTooltip content={tipContent} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="income"  stroke="var(--success)" strokeWidth={2.5} fill="url(#incGrad)" name="Income"  dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="expense" stroke="var(--danger)" strokeWidth={2.5} fill="url(#expGrad)" name="Expense" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>

        {/* Fee Collection — Bar Chart */}
        <Col xs={24} lg={10}>
          <div style={{ ...sectionPanel, marginBottom: 0, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWell("var(--primary)", 32)}><WalletOutlined style={{ fontSize: 14 }} /></div>
              <div>
                <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                  Fee Collection
                </Text>
                <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Last 6 months</Text>
              </div>
            </div>

            {monthlyChart.length === 0 ? (
              <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Empty description="No collection data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyChart} barSize={20} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: axisClr }} axisLine={false} tickLine={false} tickFormatter={moneyK} />
                  <RcTooltip content={tipContent} />
                  <Bar dataKey="feeCollection" name="Fee Collected" radius={[6, 6, 0, 0]}>
                    {monthlyChart.map((_, i) => (
                      <Cell key={i} fill={i === monthlyChart.length - 1 ? "var(--primary)" : "rgba(var(--primary-rgb), 0.45)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Recent Transactions ───────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell("var(--accent)", 32)}><FileTextOutlined style={{ fontSize: 14 }} /></div>
            <div>
              <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>Recent Transactions</Text>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Latest financial activity</Text>
            </div>
          </div>
          {recentActivity.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 10px",
              borderRadius: 20, background: "var(--primary-light)", color: "var(--primary)",
              border: "1px solid var(--primary-light)",
            }}>
              {recentActivity.length} entries
            </span>
          )}
        </div>

        <Table
          className="tx-tbl"
          rowKey="_id"
          columns={txColumns}
          dataSource={recentActivity}
          pagination={{ pageSize: 10, size: "small", showTotal: (t) => `${t} transactions` }}
          scroll={{ x: 560 }}
          locale={{
            emptyText: (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent transactions" />
              </div>
            ),
          }}
          size="small"
        />
      </div>
    </div>
  );
};

export default AccountantDashboard;
