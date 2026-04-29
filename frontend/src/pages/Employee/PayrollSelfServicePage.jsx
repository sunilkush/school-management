import { Card, Col, Row, Table, Tabs } from "antd";

const mockPayslips = [];

export default function PayrollSelfServicePage() {
  return <Tabs items={[{ key: "payslips", label: "My Payslips", children: <Card><Table rowKey="_id" dataSource={mockPayslips} columns={[{ title: "Month", dataIndex: "month" }, { title: "Net", dataIndex: "netSalary" }]} /></Card> }, { key: "breakdown", label: "Salary Breakdown", children: <Row gutter={16}><Col span={12}><Card title="Earnings">-</Card></Col><Col span={12}><Card title="Deductions">-</Card></Col></Row> }, { key: "loan", label: "Loan Status", children: <Card>Loan status and EMI tracking</Card> }, { key: "tax", label: "Tax Summary", children: <Card>TDS / PF / ESI summary</Card> }]} />;
}
