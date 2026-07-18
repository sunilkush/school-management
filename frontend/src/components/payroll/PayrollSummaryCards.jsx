import React from "react";
import {
  BankOutlined, CheckCircleOutlined, MinusCircleOutlined, TeamOutlined,
} from "@ant-design/icons";
import { formatCurrencyINR } from "../../utils/payroll";
import { statGrid } from "../../styles/pageStyles";
import PayrollStatCard from "./PayrollStatCard";

const PayrollSummaryCards = ({ summary }) => (
  <div style={statGrid(155)}>
    <PayrollStatCard label="Employees"      value={summary.totalEmployees}                    icon={<TeamOutlined />}        color="#2563EB" />
    <PayrollStatCard label="Gross Earnings" value={formatCurrencyINR(summary.totalGross)}      icon={<BankOutlined />}        color="#7C3AED" />
    <PayrollStatCard label="Deductions"     value={formatCurrencyINR(summary.totalDeductions)} icon={<MinusCircleOutlined />} color="#EF4444" />
    <PayrollStatCard label="Net Payable"    value={formatCurrencyINR(summary.totalNet)}        icon={<CheckCircleOutlined />} color="#22C55E" />
  </div>
);

export default PayrollSummaryCards;
