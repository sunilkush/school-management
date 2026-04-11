import React from "react";
import { Descriptions, Empty, Tag, Typography } from "antd";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text, Title } = Typography;

const PayslipPreview = ({ payslip, monthLabel }) => {
  if (!payslip?.entry) return <Empty description="Payslip preview will appear here" />;
  const { entry } = payslip;

  return (
    <div className="payslip-printable">
      <Title level={5}>{entry.employeeId?.userId?.name}</Title>
      <Text type="secondary">{monthLabel} • {entry.employeeId?.designation || "Staff"}</Text>
      <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label="Working Days">{entry.workingDays}</Descriptions.Item>
        <Descriptions.Item label="Present Days">{entry.presentDays}</Descriptions.Item>
        <Descriptions.Item label="LOP Days">{entry.lopDays}</Descriptions.Item>
        <Descriptions.Item label="Gross Earnings">{formatCurrencyINR(entry.grossEarnings)}</Descriptions.Item>
        <Descriptions.Item label="Total Deductions">{formatCurrencyINR(entry.totalDeductions)}</Descriptions.Item>
        <Descriptions.Item label="Net Pay"><Text strong>{formatCurrencyINR(entry.netPay)}</Text></Descriptions.Item>
        <Descriptions.Item label="Payment Status"><Tag color={entry.paymentStatus === "paid" ? "green" : "orange"}>{entry.paymentStatus}</Tag></Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default PayslipPreview;
