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
    <PayrollStatCard label="Total Employees"  value={summary.totalEmployees}                                       icon={<TeamOutlined />}        color="var(--primary)" />
    <PayrollStatCard label="Total Gross"      value={formatCurrencyINR(summary.totalGross)}                        icon={<BankOutlined />}        color="var(--purple)" />
    <PayrollStatCard label="Deductions"       value={formatCurrencyINR(summary.totalDeductions)}                   icon={<MinusCircleOutlined />} color="var(--danger)" />
    <PayrollStatCard label="Net Payable"      value={formatCurrencyINR(summary.totalNetPay)} sub="After deductions" icon={<WalletOutlined />}    color="var(--success)" />
    <PayrollStatCard label="Paid"             value={Math.max(summary.totalEmployees - summary.unpaidCount, 0)}    icon={<CheckCircleOutlined />} color="var(--success)" />
    <PayrollStatCard label="Pending"          value={summary.unpaidCount}                                          icon={<ClockCircleOutlined />} color="var(--warning)" />
  </div>
);

export default MonthlyPayrollReportCards;
