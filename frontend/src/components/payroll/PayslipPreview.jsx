import React from "react";
import { Descriptions, Divider, Empty, Tag, Typography } from "antd";
import { formatCurrencyINR } from "../../utils/payroll";

const { Text, Title } = Typography;

const PayslipPreview = ({ payslip, monthLabel }) => {
  if (!payslip?.entry) return <Empty description="Payslip preview will appear here" />;
  const { entry } = payslip;
  const deductions = entry.deductionsBreakdown || {};
  const employerContributions = entry.employerContributions || {};
  const statutory = entry.statutorySnapshot || {};
  const hasEmployerContributions = employerContributions.pfTotal > 0 || employerContributions.esi > 0;

  return (
    <div className="payslip-printable">
      <Title level={5}>{entry.employeeId?.userId?.name}</Title>
      <Text type="secondary">{monthLabel} • {entry.employeeId?.designation || "Staff"}</Text>
      {(statutory.uan || statutory.esicNumber) && (
        <div style={{ marginTop: 4 }}>
          {statutory.uan && <Text type="secondary" style={{ fontSize: 12, marginRight: 16 }}>UAN: {statutory.uan}</Text>}
          {statutory.esicNumber && <Text type="secondary" style={{ fontSize: 12 }}>ESIC No: {statutory.esicNumber}</Text>}
        </div>
      )}

      <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label="Working Days">{entry.workingDays}</Descriptions.Item>
        <Descriptions.Item label="Present Days">{entry.presentDays}</Descriptions.Item>
        <Descriptions.Item label="LOP Days">{entry.lopDays}</Descriptions.Item>
        <Descriptions.Item label="Gross Earnings">{formatCurrencyINR(entry.grossEarnings)}</Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "16px 0 8px" }} />
      <Text type="secondary" style={{ fontSize: 12 }}>Deductions</Text>
      <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
        <Descriptions.Item label="LOP Deduction">{formatCurrencyINR(deductions.lopDeduction)}</Descriptions.Item>
        <Descriptions.Item label="PF — Employee (Statutory)">{formatCurrencyINR(deductions.statutoryPf)}</Descriptions.Item>
        {deductions.vpf > 0 && (
          <Descriptions.Item label="VPF (Voluntary)">{formatCurrencyINR(deductions.vpf)}</Descriptions.Item>
        )}
        <Descriptions.Item label="ESI — Employee">
          {deductions.esiEligible
            ? formatCurrencyINR(deductions.esi)
            : <Text type="secondary">Not applicable (gross above ESI ceiling)</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Professional Tax">{formatCurrencyINR(deductions.professionalTax)}</Descriptions.Item>
        <Descriptions.Item label="TDS">{formatCurrencyINR(deductions.tds)}</Descriptions.Item>
        <Descriptions.Item label="Late Fine">{formatCurrencyINR(deductions.lateFine)}</Descriptions.Item>
        {deductions.otherDeductions > 0 && (
          <Descriptions.Item label="Other Deductions">{formatCurrencyINR(deductions.otherDeductions)}</Descriptions.Item>
        )}
        <Descriptions.Item label="Total Deductions"><Text strong>{formatCurrencyINR(entry.totalDeductions)}</Text></Descriptions.Item>
      </Descriptions>

      <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label="Net Pay"><Text strong>{formatCurrencyINR(entry.netPay)}</Text></Descriptions.Item>
        <Descriptions.Item label="Payment Status"><Tag color={entry.paymentStatus === "paid" ? "green" : "orange"}>{entry.paymentStatus}</Tag></Descriptions.Item>
      </Descriptions>

      {hasEmployerContributions && (
        <>
          <Divider style={{ margin: "16px 0 8px" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Employer contributions (not deducted from pay — shown for CTC reference)
          </Text>
          <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="EPS (Pension Scheme)">{formatCurrencyINR(employerContributions.eps)}</Descriptions.Item>
            <Descriptions.Item label="EPF">{formatCurrencyINR(employerContributions.epf)}</Descriptions.Item>
            <Descriptions.Item label="EPF Admin Charges">{formatCurrencyINR(employerContributions.epfAdminCharges)}</Descriptions.Item>
            <Descriptions.Item label="EDLI">{formatCurrencyINR(employerContributions.edli)}</Descriptions.Item>
            <Descriptions.Item label="ESI (Employer)">{formatCurrencyINR(employerContributions.esi)}</Descriptions.Item>
          </Descriptions>
        </>
      )}
    </div>
  );
};

export default PayslipPreview;
