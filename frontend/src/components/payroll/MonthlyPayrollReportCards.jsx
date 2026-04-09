import React from "react";
import { Card, Col, Row } from "antd";
import { formatCurrencyINR } from "../../utils/payroll";

const MonthlyPayrollReportCards = ({ summary }) => (
  <Row gutter={16}>
    <Col xs={24} sm={12} md={8}><Card title="Total Gross">{formatCurrencyINR(summary.totalGross)}</Card></Col>
    <Col xs={24} sm={12} md={8}><Card title="Total Deductions">{formatCurrencyINR(summary.totalDeductions)}</Card></Col>
    <Col xs={24} sm={12} md={8}><Card title="Total Net Pay">{formatCurrencyINR(summary.totalNetPay)}</Card></Col>
    <Col xs={24} sm={12} md={8}><Card title="Employees">{summary.totalEmployees}</Card></Col>
    <Col xs={24} sm={12} md={8}><Card title="Pending Payments">{summary.unpaidCount}</Card></Col>
    <Col xs={24} sm={12} md={8}><Card title="Paid Payments">{Math.max(summary.totalEmployees - summary.unpaidCount, 0)}</Card></Col>
  </Row>
);

export default MonthlyPayrollReportCards;
