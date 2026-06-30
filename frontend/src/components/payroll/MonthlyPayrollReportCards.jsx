import React from "react";
import {
  BankOutlined, CheckCircleOutlined, ClockCircleOutlined,
  MinusCircleOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import { formatCurrencyINR } from "../../utils/payroll";
import { iconWell, statGrid } from "../../styles/pageStyles";

const S = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: "var(--surface)", borderRadius: 14,
    border: "1px solid var(--border-muted)",
    borderLeft: `4px solid ${color}`,
    padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={iconWell(color, 46)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: "var(--text-primary)",
        lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>
      )}
    </div>
  </div>
);

const MonthlyPayrollReportCards = ({ summary }) => (
  <div style={statGrid(155)}>
    <S label="Total Employees"  value={summary.totalEmployees}                                       icon={<TeamOutlined />}        color="#2563EB" />
    <S label="Total Gross"      value={formatCurrencyINR(summary.totalGross)}                        icon={<BankOutlined />}        color="#7C3AED" />
    <S label="Deductions"       value={formatCurrencyINR(summary.totalDeductions)}                   icon={<MinusCircleOutlined />} color="#EF4444" />
    <S label="Net Payable"      value={formatCurrencyINR(summary.totalNetPay)} sub="After deductions" icon={<WalletOutlined />}    color="#22C55E" />
    <S label="Paid"             value={Math.max(summary.totalEmployees - summary.unpaidCount, 0)}    icon={<CheckCircleOutlined />} color="#10B981" />
    <S label="Pending"          value={summary.unpaidCount}                                          icon={<ClockCircleOutlined />} color="#F59E0B" />
  </div>
);

export default MonthlyPayrollReportCards;
