import { Card, Timeline, Typography } from "antd";
import { useSelector } from "react-redux";

export default function PayrollApprovalPanel() {
  const { runs } = useSelector((s) => s.payrollEnterprise);
  const latest = runs?.[0];
  const steps = ["draft", "hr_approved", "accountant_approved", "approved", "locked"];
  return <Card title="Approval Timeline"><Typography.Paragraph>Latest run: {latest?._id || "-"}</Typography.Paragraph><Timeline items={steps.map((st) => ({ color: latest?.status === st ? "green" : "gray", children: st.replaceAll("_", " ") }))} /></Card>;
}
