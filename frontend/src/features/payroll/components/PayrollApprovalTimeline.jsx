import React from "react";
import { Steps } from "antd";
const steps = ["Draft Created", "Payroll Calculated", "Submitted for Review", "Approved", "Payslip Generated", "Paid", "Locked"];
const order = { draft:0, processing:1, review:2, approved:3, generated:4, paid:5, locked:6 };
const PayrollApprovalTimeline = ({ status }) => <Steps current={order[status] ?? 0} items={steps.map((title)=>({title}))} />;
export default PayrollApprovalTimeline;
