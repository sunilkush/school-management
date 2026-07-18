import React from "react";
import {
  BankOutlined, CheckCircleOutlined, ClockCircleOutlined,
  MinusCircleOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import { formatCurrencyINR } from "../../utils/payroll";
import { statGrid } from "../../styles/pageStyles";
import PayrollStatCard from "./PayrollStatCard";

const MonthlyPayrollReportCards = ({ summary }) => (
  <div style={statGrid(155)}>
    <PayrollStatCard label="Total Employees"  value={summary.totalEmployees}                                       icon={<TeamOutlined />}        color="#2563EB" />
    <PayrollStatCard label="Total Gross"      value={formatCurrencyINR(summary.totalGross)}                        icon={<BankOutlined />}        color="#7C3AED" />
    <PayrollStatCard label="Deductions"       value={formatCurrencyINR(summary.totalDeductions)}                   icon={<MinusCircleOutlined />} color="#EF4444" />
    <PayrollStatCard label="Net Payable"      value={formatCurrencyINR(summary.totalNetPay)} sub="After deductions" icon={<WalletOutlined />}    color="#22C55E" />
    <PayrollStatCard label="Paid"             value={Math.max(summary.totalEmployees - summary.unpaidCount, 0)}    icon={<CheckCircleOutlined />} color="#10B981" />
    <PayrollStatCard label="Pending"          value={summary.unpaidCount}                                          icon={<ClockCircleOutlined />} color="#F59E0B" />
  </div>
);

export default MonthlyPayrollReportCards;
