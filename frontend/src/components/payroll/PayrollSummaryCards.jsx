import React from "react";
import {
  BankOutlined, CheckCircleOutlined, MinusCircleOutlined, TeamOutlined,
} from "@ant-design/icons";
import { formatCurrencyINR } from "../../utils/payroll";
import { statGrid } from "../../styles/pageStyles";
import PayrollStatCard from "./PayrollStatCard";

const PayrollSummaryCards = ({ summary }) => (
  <div style={statGrid(155)}>
    <PayrollStatCard label="Employees"      value={summary.totalEmployees}                    icon={<TeamOutlined />}        color="var(--primary)" />
    <PayrollStatCard label="Gross Earnings" value={formatCurrencyINR(summary.totalGross)}      icon={<BankOutlined />}        color="var(--purple)" />
    <PayrollStatCard label="Deductions"     value={formatCurrencyINR(summary.totalDeductions)} icon={<MinusCircleOutlined />} color="var(--danger)" />
    <PayrollStatCard label="Net Payable"    value={formatCurrencyINR(summary.totalNet)}        icon={<CheckCircleOutlined />} color="var(--success)" />
  </div>
);

export default PayrollSummaryCards;
