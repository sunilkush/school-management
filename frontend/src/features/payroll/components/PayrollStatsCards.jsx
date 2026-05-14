import React from "react";
import { Card, Statistic } from "antd";
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const PayrollStatsCards = ({ totalEmployees, grossPay, netPay, deductions, employerContribution, pendingApprovals }) => {
  const cards = [["Total Employees", totalEmployees || 0], ["Gross Pay", money(grossPay)], ["Net Payable", money(netPay)], ["Deductions", money(deductions)], ["Employer Contribution", money(employerContribution)], ["Pending Approvals", pendingApprovals || 0]];
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([title, value]) => <Card key={title} className="shadow-sm"><Statistic title={title} value={value} /></Card>)}</div>;
};
export default PayrollStatsCards;
