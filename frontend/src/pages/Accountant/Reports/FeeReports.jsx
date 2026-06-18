import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Progress, Row, Select, Spin, Table, Tag, Typography,
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, DownloadOutlined,
  PrinterOutlined, WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchPayments, fetchPaymentSummary } from "../../../features/paymentSlice";
import { fetchStudentFeeSummary } from "../../../features/studentFeeSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PIE_COLORS = ["#9B87B8", "#5BA89A", "#D4922A", "#D96B7A", "#0891b2"];

const PAYMENT_MODES = ["cash", "online", "cheque", "bank_transfer", "upi", "razorpay"];

const FeeReports = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const { payments = [], summary: paymentSummary, loading: paymentsLoading } = useSelector((s) => s.payment || {});
  const { summary: feeSummary = [] } = useSelector((s) => s.studentFee || {});

  const [modeFilter, setModeFilter] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchStudentFeeSummary());
    dispatch(fetchPaymentSummary());
    dispatch(fetchPayments({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleFilter = () => {
    const params = { page: 1, limit: 50 };
    if (modeFilter) params.paymentMode = modeFilter;
    if (dateRange?.length === 2) {
      params.startDate = dateRange[0].toISOString();
      params.endDate   = dateRange[1].toISOString();
    }
    dispatch(fetchPayments(params));
    setPage(1);
  };

  // Fee status summary from StudentFee aggregate
  const feeStats = useMemo(() => {
    const result = { paid: 0, pending: 0, partial: 0, totalPaid: 0, totalDue: 0, totalPending: 0, count: 0 };
    (Array.isArray(feeSummary) ? feeSummary : []).forEach((row) => {
      result.count += row.studentsCount || 0;
      result.totalPaid    += row.totalCollected || 0;
      result.totalPending += row.totalDue       || 0;
      if (row._id === "paid")    result.paid    += row.studentsCount || 0;
      if (row._id === "pending") result.pending += row.studentsCount || 0;
      if (row._id === "partial") result.partial += row.studentsCount || 0;
    });
    return result;
  }, [feeSummary]);

  // Payment mode breakdown from payment records
  const modeBreakdown = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      const m = p.paymentMode || "unknown";
      if (!map[m]) map[m] = { name: m, total: 0, count: 0 };
      map[m].total += p.amountPaid || 0;
      map[m].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [payments]);

  // Monthly collection trend from payment records
  const monthlyData = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      const m = dayjs(p.paymentDate || p.createdAt).format("MMM");
      map[m] = (map[m] || 0) + (p.amountPaid || 0);
    });
    return Object.entries(map).map(([month, total]) => ({ month, total }));
  }, [payments]);

  // Fee status pie data
  const feeStatusPie = useMemo(() => [
    { name: "Paid",    value: feeStats.paid,    color: "#5BA89A" },
    { name: "Partial", value: feeStats.partial, color: "#D4922A" },
    { name: "Pending", value: feeStats.pending, color: "#D96B7A" },
  ].filter((d) => d.value > 0), [feeStats]);

  const handleExport = () => {
    const headers = ["Student", "Amount", "Mode", "Receipt No", "Date", "Status"];
    const rows = payments.map((p) => [
      p.studentId?.name || "-",
      p.amountPaid,
      p.paymentMode,
      p.receiptNo || "-",
      dayjs(p.paymentDate).format("DD-MM-YYYY"),
      p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fee-report-${dayjs().format("YYYY-MM-DD")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Fee Report</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#9B87B8;color:white;padding:7px;font-size:11px}td{padding:5px 7px;border-bottom:1px solid #e2e8f0;font-size:11px}
      @media print{button{display:none}}</style></head><body>
      <h2>Fee Collection Report — ${dayjs().format("DD MMMM YYYY")}</h2>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const collectUtilization = feeStats.totalPaid + feeStats.totalPending > 0
    ? Math.round((feeStats.totalPaid / (feeStats.totalPaid + feeStats.totalPending)) * 100) : 0;

  const paymentColumns = [
    { title: "Student",    render: (_, r) => r.studentId?.name || "—" },
    { title: "Amount",     dataIndex: "amountPaid",  render: (v) => <span style={{ fontWeight: 700, color: "#5BA89A" }}>{money(v)}</span> },
    { title: "Mode",       dataIndex: "paymentMode", render: (m) => <Tag style={{ textTransform: "capitalize" }}>{m}</Tag> },
    { title: "Receipt No", dataIndex: "receiptNo",   render: (r) => r || "—" },
    { title: "Date",       dataIndex: "paymentDate", render: (d) => dayjs(d).format("DD MMM YYYY") },
    {
      title: "Status", dataIndex: "status",
      render: (s) => (
        <span style={pill(s === "success" ? "#5BA89A" : "#D96B7A", s === "success" ? "#d1fae5" : "rgba(255,202,212,0.2)")}>
          {s}
        </span>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("fee-rep-tbl")}</style>
      <PageHeader
        title="Fee Reports"
        subtitle="Collection status, payment modes, and transaction history"
        icon={<WalletOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
          </div>
        }
      />

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "12px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Select value={modeFilter} onChange={setModeFilter} placeholder="Payment mode" style={{ width: 160 }} allowClear>
          {PAYMENT_MODES.map((m) => <Option key={m} value={m}>{m}</Option>)}
        </Select>
        <RangePicker onChange={(r) => setDateRange(r ? [r[0].toDate(), r[1].toDate()] : [])} />
        <Button type="primary" onClick={handleFilter}>Apply</Button>
        <Button onClick={() => { setModeFilter(""); setDateRange([]); dispatch(fetchPayments({ page: 1, limit: 50 })); }}>Clear</Button>
      </div>

      <div ref={printRef}>
        {/* ── Summary KPIs ─────────────────────────────────────────── */}
        <div style={statGrid(155)}>
          {[
            { label: "Total Collected",    value: money(feeStats.totalPaid),    color: "#5BA89A", icon: <CheckCircleOutlined /> },
            { label: "Total Pending",      value: money(feeStats.totalPending), color: "#D96B7A", icon: <ClockCircleOutlined /> },
            { label: "Paid Students",      value: feeStats.paid,                color: "#5BA89A", icon: <CheckCircleOutlined /> },
            { label: "Partial Payments",   value: feeStats.partial,             color: "#D4922A", icon: <WalletOutlined /> },
            { label: "Pending Students",   value: feeStats.pending,             color: "#D96B7A", icon: <ClockCircleOutlined /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
              <div style={iconWell(color, 40)}>{icon}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Collection utilization ─────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>Fee Collection Progress</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Collected: {money(feeStats.totalPaid)} / Total assigned: {money(feeStats.totalPaid + feeStats.totalPending)}
            </Text>
            <Text strong style={{ fontSize: 12 }}>{collectUtilization}%</Text>
          </div>
          <Progress percent={collectUtilization} strokeColor="#9B87B8" showInfo={false} />
        </div>

        {/* ── Charts ────────────────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={14}>
            <div style={{ ...sectionPanel, marginBottom: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Monthly Collection Trend</div>
              {monthlyData.length === 0 ? (
                <Empty description="No collection data" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [money(v), "Collected"]} />
                    <Bar dataKey="total" fill="#9B87B8" radius={[5, 5, 0, 0]} name="Collected" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <div style={{ ...sectionPanel, marginBottom: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Fee Status Breakdown</div>
              {feeStatusPie.length === 0 ? (
                <Empty description="No fee data" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={feeStatusPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {feeStatusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} students`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Col>
        </Row>

        {/* ── Payment mode breakdown ─────────────────────────────── */}
        {modeBreakdown.length > 0 && (
          <div style={{ ...sectionPanel, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>By Payment Mode</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {modeBreakdown.map((m, i) => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, background: `${PIE_COLORS[i % PIE_COLORS.length]}12`, borderRadius: 8, padding: "8px 14px", border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}25` }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: PIE_COLORS[i % PIE_COLORS.length], fontSize: 13, textTransform: "capitalize" }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{money(m.total)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({m.count} txns)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Transaction history table ──────────────────────────── */}
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14 }}>Payment Transaction History</div>
          {paymentsLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table
              className="fee-rep-tbl"
              rowKey="_id"
              columns={paymentColumns}
              dataSource={payments}
              pagination={{ pageSize: 15, showTotal: (t) => `${t} transactions`, showSizeChanger: false }}
              scroll={{ x: 700 }}
              locale={{ emptyText: <Empty description="No payment records" /> }}
              size="small"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeReports;
