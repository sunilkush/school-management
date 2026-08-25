import React, { useMemo, useState } from "react";
import { Alert, Button, DatePicker, Empty, Table, Typography } from "antd";
import {
  BarChartOutlined, PrinterOutlined, ReloadOutlined, TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { usePayrollCycle, useMonthlyPayrollReport } from "../../../hooks/payrollHooks";
import MonthlyPayrollReportCards from "../../../components/payroll/MonthlyPayrollReportCards";
import PageHeader from "../../../components/layout/PageHeader";
import {
  iconWell, pageCard, pageWrapper, sectionPanel, tableHeadCss,
} from "../../../styles/pageStyles";
import { formatCurrencyINR } from "../../../utils/payroll";
import { categoricalColorFor } from "../../../utils/colorPalette";

const { Text } = Typography;

/* ── Helpers ─────────────────────────────────────────────────────── */
// Deterministic per-department color from the shared categorical palette (8 distinct hues) —
// replaces a local hex array so every department keeps a stable color across renders/pages.
const deptColor = (name = "") => categoricalColorFor(name);

const moneyK = (v) => {
  const n = Number(v || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

/* ── Custom chart tooltip ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-muted)",
      borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ color: p.color, fontWeight: 700 }}>●</span>{" "}
          {p.name}: <strong style={{ color: "var(--text-primary)" }}>{formatCurrencyINR(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const MonthlyPayrollReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const month = selectedMonth.month() + 1;
  const year  = selectedMonth.year();

  const { entries }                                        = usePayrollCycle(month, year);
  const { loading, report, isEmpty, refreshReport }        = useMonthlyPayrollReport(month, year);

  /* ── Department aggregation ──────────────────────────────────── */
  const deptRows = useMemo(() => {
    const map = entries.reduce((acc, item) => {
      const dept = item.employeeId?.department || "Unknown";
      if (!acc[dept]) acc[dept] = { key: dept, department: dept, employees: 0, netPay: 0 };
      acc[dept].employees += 1;
      acc[dept].netPay    += Number(item.netPay || 0);
      return acc;
    }, {});
    return Object.values(map).sort((a, b) => b.netPay - a.netPay);
  }, [entries]);

  const totalNetPay = useMemo(
    () => deptRows.reduce((s, r) => s + r.netPay, 0),
    [deptRows],
  );

  /* ── Table columns ───────────────────────────────────────────── */
  const columns = useMemo(() => [
    {
      title: "Department",
      dataIndex: "department",
      render: (dept) => {
        const color = deptColor(dept);
        return (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 99,
            background: `color-mix(in srgb, ${color} 8%, transparent)`, color,
            border: `1px solid color-mix(in srgb, ${color} 16%, transparent)`,
          }}>
            {dept}
          </span>
        );
      },
    },
    {
      title: "Employees",
      dataIndex: "employees",
      width: 120,
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TeamOutlined style={{ color: "var(--primary)", fontSize: 13 }} />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v}</span>
        </div>
      ),
    },
    {
      title: "Net Payout",
      dataIndex: "netPay",
      width: 160,
      render: (v) => (
        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--success)" }}>
          {formatCurrencyINR(v)}
        </span>
      ),
    },
    {
      title: "% Share",
      dataIndex: "netPay",
      key: "share",
      width: 150,
      render: (v) => {
        const pct = totalNetPay > 0 ? ((v / totalNetPay) * 100).toFixed(1) : 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: "var(--border-muted)", overflow: "hidden",
            }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 36 }}>{pct}%</span>
          </div>
        );
      },
    },
  ], [totalNetPay]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("payroll-report-tbl")}</style>

      <PageHeader
        title="Monthly Payroll Report"
        subtitle="Department-wise payroll summary, distribution and export"
        icon={<BarChartOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={refreshReport} style={{ borderRadius: 8 }}>
              Refresh
            </Button>
            <Button
              icon={<PrinterOutlined />}
              disabled={!report}
              onClick={() => window.print()}
              style={{ borderRadius: 8 }}
            >
              Export / Print
            </Button>
          </div>
        }
      />

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div style={{
        ...sectionPanel, marginBottom: 16,
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <div style={iconWell("var(--purple)", 32)}><BarChartOutlined style={{ fontSize: 14 }} /></div>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
            Report Period
          </Text>
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Viewing {selectedMonth.format("MMMM YYYY")} payroll data
          </Text>
        </div>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(v) => v && setSelectedMonth(v)}
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {isEmpty ? (
        <div style={{
          ...sectionPanel,
          textAlign: "center", padding: "56px 24px",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <Text strong style={{ fontSize: 16, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
            No Report for {selectedMonth.format("MMMM YYYY")}
          </Text>
          <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Generate the payroll cycle for this month first, then refresh.
          </Text>
          <div style={{ marginTop: 20 }}>
            <Alert
              type="info"
              showIcon
              message="Generate payroll cycle from Monthly Payroll Run page to see the report."
              style={{ borderRadius: 10, display: "inline-block", textAlign: "left" }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <MonthlyPayrollReportCards
              summary={report?.summary || {
                totalEmployees: 0, totalGross: 0, totalDeductions: 0,
                totalNetPay: 0, unpaidCount: 0,
              }}
            />
          </div>

          {/* ── Chart + Table row ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start" }}>

            {/* Bar chart */}
            <div style={{ ...pageCard, padding: 0, overflow: "hidden" }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid var(--border-muted)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={iconWell("var(--primary)", 32)}><BarChartOutlined style={{ fontSize: 14 }} /></div>
                <div>
                  <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                    Dept-wise Distribution
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Net payout by department
                  </Text>
                </div>
              </div>
              <div style={{ padding: "16px 8px 8px" }}>
                {deptRows.length ? (
                  <ResponsiveContainer width="100%" height={Math.max(180, deptRows.length * 46)}>
                    <BarChart
                      data={deptRows}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-muted)" />
                      <XAxis
                        type="number"
                        tickFormatter={moneyK}
                        tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="department"
                        tick={{ fontSize: 11, fill: "var(--text-primary)", fontWeight: 600 }}
                        axisLine={false} tickLine={false} width={90}
                      />
                      <Tooltip content={<ChartTip />} cursor={{ fill: "var(--surface-soft)" }} />
                      <Bar dataKey="netPay" name="Net Pay" radius={[0, 6, 6, 0]} barSize={18}>
                        {deptRows.map((row) => (
                          <Cell key={row.department} fill={deptColor(row.department)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No department data" style={{ padding: 32 }} />
                )}
              </div>
            </div>

            {/* Department table */}
            <div style={{ ...pageCard, padding: 0, overflow: "hidden" }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid var(--border-muted)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={iconWell("var(--success)", 32)}><TeamOutlined style={{ fontSize: 14 }} /></div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block" }}>
                    Department Breakdown
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {deptRows.length} department{deptRows.length !== 1 ? "s" : ""} — {formatCurrencyINR(totalNetPay)} total
                  </Text>
                </div>
              </div>
              <Table
                className="payroll-report-tbl"
                rowKey="department"
                dataSource={deptRows}
                loading={loading}
                columns={columns}
                pagination={false}
                scroll={{ x: 480 }}
                locale={{
                  emptyText: (
                    <div style={{ padding: "32px 0" }}>
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No department data for this month" />
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyPayrollReport;
