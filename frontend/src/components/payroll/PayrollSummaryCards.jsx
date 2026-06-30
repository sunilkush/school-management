import React from "react";
import {
  BankOutlined, CheckCircleOutlined, MinusCircleOutlined, TeamOutlined,
} from "@ant-design/icons";
import { formatCurrencyINR } from "../../utils/payroll";
import { iconWell, statGrid } from "../../styles/pageStyles";

const S = ({ label, value, icon, color }) => (
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
    </div>
  </div>
);

const PayrollSummaryCards = ({ summary }) => (
  <div style={statGrid(155)}>
    <S label="Employees"      value={summary.totalEmployees}                    icon={<TeamOutlined />}        color="#2563EB" />
    <S label="Gross Earnings" value={formatCurrencyINR(summary.totalGross)}      icon={<BankOutlined />}        color="#7C3AED" />
    <S label="Deductions"     value={formatCurrencyINR(summary.totalDeductions)} icon={<MinusCircleOutlined />} color="#EF4444" />
    <S label="Net Payable"    value={formatCurrencyINR(summary.totalNet)}        icon={<CheckCircleOutlined />} color="#22C55E" />
  </div>
);

export default PayrollSummaryCards;
