import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Row, Select, Spin, Table, Tag, Typography,
} from "antd";
import {
  BarChartOutlined, DownloadOutlined, FileTextOutlined,
  PrinterOutlined, RiseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { fetchAccountantDashboard } from "../../../features/financeSlice";
import { fetchIncomeSummary } from "../../../features/financeSlice";
import { fetchExpenseSummary } from "../../../features/financeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PIE_COLORS = ["#14B8A6", "#0891b2", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6", "#F59E0B", "#14b8a6"];

const FinancialReports = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const {
    dashboard, dashboardLoading,
    incomeSummary, incomeSumLoading,
    expenseSummary, expenseSumLoading,
  } = useSelector((s) => s.finance || {});

  const [reportType, setReportType] = useState("profit_loss");
  const [dateRange, setDateRange] = useState([]);

  const buildParams = () => {
    const p = {};
    if (dateRange?.length === 2) {
      p.startDate = dateRange[0].toISOString();
      p.endDate   = dateRange[1].toISOString();
    }
    return p;
  };

  useEffect(() => {
    const p = buildParams();
    dispatch(fetchAccountantDashboard());
    dispatch(fetchIncomeSummary(p));
    dispatch(fetchExpenseSummary(p));
  }, [dispatch]);

  const handleFilter = () => {
    const p = buildParams();
    dispatch(fetchIncomeSummary(p));
    dispatch(fetchExpenseSummary(p));
  };

  const kpis = dashboard?.kpis || {};
  const monthlyChart = dashboard?.monthlyChart || [];

  const incomeByCategory  = incomeSummary?.byCategory  || [];
  const expenseByCategory = expenseSummary?.byCategory  || [];

  const profitLossData = useMemo(() => {
    return monthlyChart.map((m) => ({
      month: m.month,
      income:  m.income,
      expense: m.expense,
      profit:  m.income - m.expense,
    }));
  }, [monthlyChart]);

  // CSV export — income by category
  const handleExportIncome = () => {
    const headers = ["Category", "Total Amount", "Count"];
    const rows = incomeByCategory.map((r) => [r._id, r.total, r.count]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `income-report-${dayjs().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // CSV export — expense by category
  const handleExportExpense = () => {
    const headers = ["Category", "Total Amount", "Count"];
    const rows = expenseByCategory.map((r) => [r._id, r.total, r.count]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `expense-report-${dayjs().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Financial Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a2e; }
        h2 { border-bottom: 2px solid #14B8A6; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #14B8A6; color: white; padding: 8px; text-align: left; font-size: 12px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-val { font-size: 20px; font-weight: 800; }
        @media print { button { display: none !important; } }
      </style></head><body>
      <h2>Financial Report — ${dayjs().format("DD MMMM YYYY")}</h2>
      ${content}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const isLoading = dashboardLoading || incomeSumLoading || expenseSumLoading;

  // P&L table
  const plColumns = [
    { title: "Month",    dataIndex: "month" },
    { title: "Income",   dataIndex: "income",  render: (v) => <Text style={{ color: "#22C55E", fontWeight: 600 }}>{money(v)}</Text> },
    { title: "Expense",  dataIndex: "expense", render: (v) => <Text style={{ color: "#EF4444", fontWeight: 600 }}>{money(v)}</Text> },
    { title: "Net P/L",  dataIndex: "profit",  render: (v) => <Text style={{ color: v >= 0 ? "#22C55E" : "#EF4444", fontWeight: 700 }}>{v >= 0 ? "+" : "-"}{money(Math.abs(v))}</Text> },
  ];

  const incColumns = [
    { title: "#", render: (_, __, i) => <span style={{ fontWeight: 700, color: "#14B8A6" }}>{i + 1}</span>, width: 40 },
    { title: "Category",  dataIndex: "_id" },
    { title: "Records",   dataIndex: "count",  width: 80 },
    { title: "Total",     dataIndex: "total",  render: (v) => <Text style={{ fontWeight: 700, color: "#22C55E" }}>{money(v)}</Text> },
  ];

  const expColumns = [
    { title: "#", render: (_, __, i) => <span style={{ fontWeight: 700, color: "#EF4444" }}>{i + 1}</span>, width: 40 },
    { title: "Category",  dataIndex: "_id" },
    { title: "Records",   dataIndex: "count",  width: 80 },
    { title: "Total",     dataIndex: "total",  render: (v) => <Text style={{ fontWeight: 700, color: "#EF4444" }}>{money(v)}</Text> },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("rep-tbl")}</style>
      <PageHeader
        title="Financial Reports"
        subtitle="Profit & Loss, income breakdown, expense analysis, and cash flow"
        icon={<BarChartOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportIncome}>Income CSV</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExpense}>Expense CSV</Button>
          </div>
        }
      />

      {/* ── Date filter ────────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-muted)" }}>Filter by date:</span>
        <RangePicker onChange={(r) => setDateRange(r ? [r[0].toDate(), r[1].toDate()] : [])} />
        <Button type="primary" onClick={handleFilter}>Apply</Button>
        <Button onClick={() => { setDateRange([]); handleFilter(); }}>Clear</Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div ref={printRef}>
          {/* ── Summary KPIs ──────────────────────────────────────── */}
          <div style={statGrid(150)}>
            {[
              { label: "Total Revenue",  value: money(kpis.totalRevenue),    color: "#22C55E", icon: <RiseOutlined /> },
              { label: "Total Expenses", value: money(kpis.totalExpenses),   color: "#EF4444", icon: <FileTextOutlined /> },
              { label: "Net Profit",     value: money(Math.abs(kpis.netProfitLoss)),
                color: (kpis.netProfitLoss || 0) >= 0 ? "#22C55E" : "#EF4444",
                icon: <BarChartOutlined /> },
              { label: "Pending Fees",   value: money(kpis.pendingFees),     color: "#F59E0B", icon: <FileTextOutlined /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
                <div style={iconWell(color, 40)}>{icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── P&L Chart ─────────────────────────────────────────── */}
          <div style={sectionPanel}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Profit & Loss — Monthly Trend</div>
            {monthlyChart.length === 0 ? (
              <Empty description="No data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={profitLossData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, n) => [money(v), n]} />
                  <Legend />
                  <Area type="monotone" dataKey="income"  stroke="#22C55E" fill="url(#profitGrad)" name="Income"  strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="none" name="Expense" strokeWidth={2} strokeDasharray="4 2" />
                  <Bar dataKey="profit"  fill="#14B8A6" name="Net P/L" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── P&L Table ─────────────────────────────────────────── */}
          <div style={sectionPanel}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>Monthly Profit & Loss Statement</div>
            <Table
              className="rep-tbl"
              rowKey="month"
              columns={plColumns}
              dataSource={profitLossData}
              pagination={false}
              locale={{ emptyText: <Empty description="No data" /> }}
              size="small"
              summary={(rows) => {
                const totInc = rows.reduce((s, r) => s + (r.income || 0), 0);
                const totExp = rows.reduce((s, r) => s + (r.expense || 0), 0);
                const net    = totInc - totExp;
                return (
                  <Table.Summary.Row style={{ fontWeight: 700, background: "var(--surface-soft)" }}>
                    <Table.Summary.Cell>Total</Table.Summary.Cell>
                    <Table.Summary.Cell><Text style={{ color: "#22C55E", fontWeight: 700 }}>{money(totInc)}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell><Text style={{ color: "#EF4444", fontWeight: 700 }}>{money(totExp)}</Text></Table.Summary.Cell>
                    <Table.Summary.Cell><Text style={{ color: net >= 0 ? "#22C55E" : "#EF4444", fontWeight: 700 }}>{net >= 0 ? "+" : "-"}{money(Math.abs(net))}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </div>

          {/* ── Income & Expense Charts ────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={12}>
              <div style={{ ...sectionPanel, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Income by Category</div>
                {incomeByCategory.length === 0 ? (
                  <Empty description="No income data" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={incomeByCategory.map((r) => ({ name: r._id, value: r.total }))}
                          cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {incomeByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => money(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Table className="rep-tbl" rowKey="_id" columns={incColumns} dataSource={incomeByCategory} pagination={false} size="small" style={{ marginTop: 12 }} />
                  </>
                )}
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div style={{ ...sectionPanel, marginBottom: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Expense by Category</div>
                {expenseByCategory.length === 0 ? (
                  <Empty description="No expense data" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={expenseByCategory.map((r) => ({ name: r._id.split(" ")[0], total: r.total }))} barSize={18}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => money(v)} />
                        <Bar dataKey="total" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Table className="rep-tbl" rowKey="_id" columns={expColumns} dataSource={expenseByCategory} pagination={false} size="small" style={{ marginTop: 12 }} />
                  </>
                )}
              </div>
            </Col>
          </Row>

          {/* ── Financial summary grid ────────────────────────────── */}
          <Row gutter={[12, 12]}>
            {[
              { label: "Total Revenue",  v: money(kpis.totalRevenue),  color: "#22C55E", bg: "rgba(220,252,231,0.2)" },
              { label: "Total Expenses", v: money(kpis.totalExpenses), color: "#EF4444", bg: "rgba(254,226,226,0.2)" },
              { label: "Net Profit",     v: money(Math.abs(kpis.netProfitLoss || 0)),
                color: (kpis.netProfitLoss || 0) >= 0 ? "#22C55E" : "#EF4444",
                bg: (kpis.netProfitLoss || 0) >= 0 ? "rgba(220,252,231,0.2)" : "rgba(254,226,226,0.2)" },
              { label: "Fee Pending",    v: money(kpis.pendingFees),   color: "#F59E0B", bg: "rgba(254,243,199,0.25)" },
            ].map(({ label, v, color, bg }) => (
              <Col xs={12} sm={6} key={label}>
                <div style={{ background: bg, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{v}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
