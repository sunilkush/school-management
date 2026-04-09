import React from "react";
import { Card, Col, Row } from "antd";
import { formatCurrencyINR } from "../../utils/payroll";

const PayrollSummaryCards = ({ summary }) => (
  <Row gutter={16}>
    <Col xs={24} sm={12} md={6}>
      <Card title="Employees">{summary.totalEmployees}</Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card title="Gross">{formatCurrencyINR(summary.totalGross)}</Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card title="Deductions">{formatCurrencyINR(summary.totalDeductions)}</Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card title="Net">{formatCurrencyINR(summary.totalNet)}</Card>
    </Col>
  </Row>
);

export default PayrollSummaryCards;
