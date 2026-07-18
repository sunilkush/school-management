import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Spin, Table, Typography, message } from "antd";
import dayjs from "dayjs";
import {
  DollarSign, FileText, BarChart3, CalendarDays,
  TrendingUp, TrendingDown, Wallet, Clock,
  CreditCard, CalendarCheck, CalendarX, AlertTriangle,
  BadgeCheck, Download,
} from "lucide-react";
import httpClient from "../../api/httpClient";
import { formatCurrencyINR } from "../../utils/payroll";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, tableHeadCss, statGrid,
  iconWell,
} from "../../styles/pageStyles";

const { Text } = Typography;

/* ── helpers ─────────────────────────────────────────────────────── */
const toRows = (breakdown = {}) =>
  Object.entries(breakdown || {}).map(([key, value]) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
    value,
  }));

const fmtMonth = (month, year) =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMM YYYY");

/* ── Custom Tabs ─────────────────────────────────────────────────── */
const TABS = [
  { key: "payslips",    label: "My Payslips",      icon: FileText     },
  { key: "breakdown",   label: "Salary Breakdown",  icon: BarChart3    },
  { key: "attendance",  label: "Attendance",        icon: CalendarDays },
];

/* ── Mini stat card ──────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background:   "var(--surface)",
      border:       "1px solid var(--border-muted)",
      borderRadius: 16,
      padding:      "18px 20px",
      display:      "flex",
      alignItems:   "center",
      gap:          14,
      boxShadow:    "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)",
      borderLeft:   `4px solid ${color}`,
    }}>
      <div style={{ ...iconWell(color, 42), borderRadius: 12, flexShrink: 0 }}>
        <Icon size={19} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── Breakdown table ─────────────────────────────────────────────── */
function BreakdownTable({ title, icon: Icon, color, rows, emptyText }) {
  return (
    <div style={{
      ...pageCard,
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          10,
        padding:      "16px 20px",
        borderBottom: "1px solid var(--border-muted)",
        background:   "var(--surface-soft)",
      }}>
        <div style={{ ...iconWell(color, 32), borderRadius: 9, flexShrink: 0 }}>
          <Icon size={15} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          {title}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <Empty description={<span style={{ color: "var(--text-muted)", fontSize: 13 }}>{emptyText}</span>} />
        </div>
      ) : (
        <div>
          {rows.map((row, i) => (
            <div
              key={row.key}
              style={{
                display:       "flex",
                justifyContent:"space-between",
                alignItems:    "center",
                padding:       "11px 20px",
                borderBottom:  i < rows.length - 1 ? "1px solid var(--border-muted)" : "none",
                background:    i % 2 === 0 ? "transparent" : "var(--surface-soft)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {formatCurrencyINR(row.value)}
              </span>
            </div>
          ))}
          {/* Total row */}
          <div style={{
            display:       "flex",
            justifyContent:"space-between",
            alignItems:    "center",
            padding:       "13px 20px",
            background:    `${color}10`,
            borderTop:     `2px solid ${color}30`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 800, color }}>
              {formatCurrencyINR(rows.reduce((s, r) => s + (Number(r.value) || 0), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Attendance chip ─────────────────────────────────────────────── */
function AttendChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background:   "var(--surface)",
      border:       "1px solid var(--border-muted)",
      borderRadius: 14,
      padding:      "16px 18px",
      display:      "flex",
      flexDirection:"column",
      alignItems:   "center",
      gap:          8,
      boxShadow:    "0 1px 3px rgba(0,0,0,0.04)",
      textAlign:    "center",
    }}>
      <div style={{ ...iconWell(color, 36), borderRadius: 10 }}>
        <Icon size={16} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function PayrollSelfServicePage() {
  const [loading,    setLoading]    = useState(false);
  const [summary,    setSummary]    = useState(null);
  const [activeTab,  setActiveTab]  = useState("payslips");
  const [downloadingKey, setDownloadingKey] = useState(null);

  const payslips      = useMemo(() => (Array.isArray(summary?.payslips) ? summary.payslips : []), [summary]);
  const latestPayslip = payslips[0] ?? null;

  useEffect(() => {
    setLoading(true);
    httpClient
      .get("/payroll/self/summary")
      .then((r) => setSummary(r?.data?.data || null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPayslip = async (row) => {
    const employeeId = summary?.employee?._id;
    if (!employeeId) return;
    setDownloadingKey(row._id);
    try {
      const response = await httpClient.get(
        `/payroll/payslip/${employeeId}/${row.month}/${row.year}/download`,
        { responseType: "blob" }
      );
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Payslip_${fmtMonth(row.month, row.year).replace(" ", "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      message.error(error?.response?.data?.message || "Payslip download failed");
    } finally {
      setDownloadingKey(null);
    }
  };

  /* ── Stat card values ── */
  const grossMonthly   = summary?.structure?.grossMonthly ?? 0;
  const latestNet      = latestPayslip?.netPay ?? 0;
  const latestGross    = latestPayslip?.grossEarnings ?? 0;
  const latestDeduct   = latestPayslip?.totalDeductions ?? 0;

  /* ── Payslip table columns ── */
  const payslipColumns = [
    {
      title:  "Month",
      key:    "month",
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {fmtMonth(r.month, r.year)}
        </span>
      ),
    },
    {
      title:  "Gross",
      dataIndex: "grossEarnings",
      align:  "right",
      render: (v) => <span style={{ color: "#15803D", fontWeight: 600 }}>{formatCurrencyINR(v)}</span>,
    },
    {
      title:  "Deductions",
      dataIndex: "totalDeductions",
      align:  "right",
      render: (v) => <span style={{ color: "#DC2626", fontWeight: 600 }}>{formatCurrencyINR(v)}</span>,
    },
    {
      title:  "Net Pay",
      dataIndex: "netPay",
      align:  "right",
      render: (v) => (
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>
          {formatCurrencyINR(v)}
        </span>
      ),
    },
    {
      title:  "Status",
      dataIndex: "paymentStatus",
      render: (status) => {
        const paid = status === "paid";
        return (
          <span style={{
            display:    "inline-flex", alignItems: "center", gap: 5,
            padding:    "3px 10px",
            background: paid ? "#DCFCE7" : "#FEF3C7",
            color:      paid ? "#15803D" : "#B45309",
            borderRadius: 99, fontSize: 11, fontWeight: 700,
            border:     `1px solid ${paid ? "#15803D25" : "#B4530925"}`,
          }}>
            {paid ? <BadgeCheck size={11} /> : <Clock size={11} />}
            {String(status || "pending").toUpperCase()}
          </span>
        );
      },
    },
    {
      title:  "Payment Mode",
      dataIndex: "paymentMode",
      render: (v) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {v ? String(v).toUpperCase() : "—"}
        </span>
      ),
    },
    {
      title:  "Ref",
      dataIndex: "transactionRef",
      render: (v) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
          {v || "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "download",
      render: (_, row) => (
        <Button
          size="small"
          icon={<Download size={13} />}
          loading={downloadingKey === row._id}
          onClick={() => handleDownloadPayslip(row)}
          style={{ borderRadius: 8, fontSize: 12 }}
        >
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("payslip-table")}</style>

      {/* ── Page header ── */}
      <PageHeader
        title="My Payroll"
        subtitle="View your salary, payslips, and monthly attendance summary."
        icon={<DollarSign size={20} />}
      />

      {(summary?.employee?.statutoryCompliance?.uan || summary?.employee?.statutoryCompliance?.esicNumber) && (
        <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          {summary.employee.statutoryCompliance.uan && <span>UAN: {summary.employee.statutoryCompliance.uan}</span>}
          {summary.employee.statutoryCompliance.esicNumber && <span>ESIC No: {summary.employee.statutoryCompliance.esicNumber}</span>}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Spin spinning={loading}>

          {/* ── Summary stat cards ── */}
          <div style={{ ...statGrid(190), marginBottom: 24 }}>
            <StatCard
              icon={Wallet}
              label="Gross Monthly"
              value={formatCurrencyINR(grossMonthly)}
              color="#2563EB"
              sub="From active salary structure"
            />
            <StatCard
              icon={TrendingUp}
              label="Latest Gross"
              value={formatCurrencyINR(latestGross)}
              color="#15803D"
              sub={latestPayslip ? fmtMonth(latestPayslip.month, latestPayslip.year) : "No payslip yet"}
            />
            <StatCard
              icon={TrendingDown}
              label="Latest Deductions"
              value={formatCurrencyINR(latestDeduct)}
              color="#DC2626"
              sub="PF, TDS & other deductions"
            />
            <StatCard
              icon={CreditCard}
              label="Latest Net Pay"
              value={formatCurrencyINR(latestNet)}
              color="#7C3AED"
              sub="Take-home amount"
            />
          </div>

          {/* ── Custom tab bar ── */}
          <div style={{
            display:      "flex",
            gap:          4,
            background:   "var(--surface)",
            border:       "1px solid var(--border-muted)",
            borderRadius: 14,
            padding:      5,
            marginBottom: 20,
            width:        "fit-content",
          }}>
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display:       "inline-flex",
                    alignItems:    "center",
                    gap:           7,
                    padding:       "8px 18px",
                    borderRadius:  10,
                    border:        "none",
                    cursor:        "pointer",
                    fontSize:      13,
                    fontWeight:    active ? 700 : 500,
                    background:    active ? "var(--primary)" : "transparent",
                    color:         active ? "#fff" : "var(--text-muted)",
                    transition:    "all 0.18s ease",
                    boxShadow:     active ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Tab: My Payslips ── */}
          {activeTab === "payslips" && (
            <div style={pageCard}>
              {/* Card header */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          10,
                padding:      "16px 20px",
                borderBottom: "1px solid var(--border-muted)",
                background:   "var(--surface-soft)",
              }}>
                <div style={{ ...iconWell("#2563EB", 32), borderRadius: 9 }}>
                  <FileText size={15} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    Payroll History
                  </span>
                  <span style={{
                    marginLeft: 10, fontSize: 11, fontWeight: 600,
                    background: "#DBEAFE", color: "#1D4ED8",
                    padding: "2px 8px", borderRadius: 99,
                  }}>
                    {payslips.length} records
                  </span>
                </div>
              </div>

              {payslips.length === 0 ? (
                <div style={{ padding: "56px 24px", textAlign: "center" }}>
                  <Empty description={
                    <span style={{ color: "var(--text-muted)" }}>No payslips generated yet</span>
                  } />
                </div>
              ) : (
                <Table
                  className="payslip-table"
                  rowKey="_id"
                  dataSource={payslips}
                  columns={payslipColumns}
                  pagination={{ pageSize: 8, size: "small" }}
                  scroll={{ x: "max-content" }}
                  style={{ background: "transparent" }}
                />
              )}
            </div>
          )}

          {/* ── Tab: Salary Breakdown ── */}
          {activeTab === "breakdown" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {/* Active structure */}
              <div style={{ ...pageCard, overflow: "hidden" }}>
                <div style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          10,
                  padding:      "16px 20px",
                  borderBottom: "1px solid var(--border-muted)",
                  background:   "var(--surface-soft)",
                }}>
                  <div style={{ ...iconWell("#2563EB", 32), borderRadius: 9, flexShrink: 0 }}>
                    <BarChart3 size={15} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    Active Structure
                  </span>
                </div>

                {summary?.structure ? (
                  <div>
                    {[
                      { label: "Basic",              value: summary.structure.basic             },
                      { label: "HRA",                value: summary.structure.hra               },
                      { label: "DA",                 value: summary.structure.da                },
                      { label: "Special Allowance",  value: summary.structure.specialAllowance  },
                    ].map((item, i, arr) => (
                      <div key={item.label} style={{
                        display:       "flex",
                        justifyContent:"space-between",
                        alignItems:    "center",
                        padding:       "11px 20px",
                        borderBottom:  i < arr.length - 1 ? "1px solid var(--border-muted)" : "none",
                        background:    i % 2 === 0 ? "transparent" : "var(--surface-soft)",
                      }}>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatCurrencyINR(item.value)}
                        </span>
                      </div>
                    ))}
                    <div style={{
                      display:       "flex",
                      justifyContent:"space-between",
                      alignItems:    "center",
                      padding:       "14px 20px",
                      background:    "#2563EB10",
                      borderTop:     "2px solid #2563EB30",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>Gross Monthly</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#2563EB" }}>
                        {formatCurrencyINR(summary.structure.grossMonthly)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 20 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Salary structure not assigned yet."
                      style={{ borderRadius: 10 }}
                    />
                  </div>
                )}
              </div>

              {/* Latest earnings */}
              <BreakdownTable
                title="Latest Earnings"
                icon={TrendingUp}
                color="#15803D"
                rows={toRows(latestPayslip?.earningsBreakdown)}
                emptyText="No earnings data for latest payslip"
              />

              {/* Latest deductions */}
              <BreakdownTable
                title="Latest Deductions"
                icon={TrendingDown}
                color="#DC2626"
                rows={toRows(latestPayslip?.deductionsBreakdown)}
                emptyText="No deductions data for latest payslip"
              />
            </div>
          )}

          {/* ── Tab: Attendance ── */}
          {activeTab === "attendance" && (
            latestPayslip ? (
              <div>
                {/* Month banner */}
                <div style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          10,
                  marginBottom: 20,
                  padding:      "12px 18px",
                  background:   "var(--surface)",
                  border:       "1px solid var(--border-muted)",
                  borderRadius: 12,
                  width:        "fit-content",
                }}>
                  <CalendarDays size={15} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Showing attendance for{" "}
                    <span style={{ color: "var(--primary)" }}>
                      {fmtMonth(latestPayslip.month, latestPayslip.year)}
                    </span>
                  </span>
                </div>

                {/* Attendance chips */}
                <div style={{ ...statGrid(150), gap: 14 }}>
                  <AttendChip icon={CalendarDays}  label="Working Days"    value={latestPayslip.workingDays}          color="#2563EB" />
                  <AttendChip icon={CalendarCheck} label="Present Days"    value={latestPayslip.presentDays}          color="#15803D" />
                  <AttendChip icon={BadgeCheck}    label="Paid Leaves"     value={latestPayslip.paidLeaves}           color="#0D9488" />
                  <AttendChip icon={CalendarX}     label="LOP Days"        value={latestPayslip.lopDays}              color="#DC2626" />
                  <AttendChip icon={AlertTriangle} label="Late Marks"      value={latestPayslip.lateCount    ?? 0}    color="#F59E0B" />
                  <AttendChip icon={Clock}         label="Overtime Hours"  value={latestPayslip.overtimeHours ?? 0}   color="#7C3AED" />
                </div>

                {/* Attendance % bar */}
                {latestPayslip.workingDays > 0 && (
                  <div style={{
                    ...pageCard,
                    padding:   20,
                    marginTop: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        Attendance Rate
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#15803D" }}>
                        {Math.round(((latestPayslip.presentDays ?? 0) / latestPayslip.workingDays) * 100)}%
                      </span>
                    </div>
                    <div style={{
                      height: 10, borderRadius: 99,
                      background: "var(--surface-soft)",
                      overflow:   "hidden",
                    }}>
                      <div style={{
                        height:     "100%",
                        borderRadius: 99,
                        width:      `${Math.min(Math.round(((latestPayslip.presentDays ?? 0) / latestPayslip.workingDays) * 100), 100)}%`,
                        background: "linear-gradient(90deg, #15803D, #22C55E)",
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginTop: 6, fontSize: 11, color: "var(--text-muted)",
                    }}>
                      <span>{latestPayslip.presentDays ?? 0} days present</span>
                      <span>{latestPayslip.workingDays} total working days</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                ...pageCard,
                padding:   "56px 24px",
                textAlign: "center",
              }}>
                <Empty
                  description={
                    <span style={{ color: "var(--text-muted)" }}>
                      Attendance data appears after the monthly payroll is generated.
                    </span>
                  }
                />
              </div>
            )
          )}

        </Spin>
      </div>
    </div>
  );
}
