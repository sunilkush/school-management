import { Alert, Button, Card, Col, Descriptions, Drawer, Form, Input, InputNumber, Popconfirm, Row, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, generatePayrollRun, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #ecfeff 0%, #f8fafc 55%, #eef2ff 100%)", border: "1px solid #bae6fd" };

export default function PayrollRunPage() {
  const [form] = Form.useForm();
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { runs, runDetails, saving } = useSelector((s) => s.payrollEnterprise);

  useEffect(() => { dispatch(fetchPayrollRuns()); }, [dispatch]);

  const onFinish = async (values) => {
    try {
      await dispatch(generatePayrollRun(values)).unwrap();
      message.success("Payroll run generated");
      form.resetFields();
    } catch (e) { message.error(e); }
  };

  const approve = async (id) => {
    try {
      await dispatch(approvePayrollRun({ id, comment })).unwrap();
      message.success("Approval stage updated");
      setComment("");
    } catch (e) { message.error(e); }
  };

  const lock = async (id) => {
    try {
      await dispatch(lockPayrollRun({ id, comment })).unwrap();
      message.success("Payroll locked");
      setComment("");
    } catch (e) { message.error(e); }
  };

  const viewDetails = (id) => {
    dispatch(fetchPayrollRunDetails(id));
    setOpen(true);
  };

  const cols = [
    { title: "Salary month", render: (_, r) => `${r.month}/${r.year}` },
    { title: "Employees", dataIndex: "totalEmployees" },
    { title: "Net payout", dataIndex: "totalPayout", render: money },
    { title: "Workflow status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
    { title: "Actions", render: (_, r) => (
      <Space wrap>
        <Button onClick={() => viewDetails(r._id)}>View details</Button>
        {!["approved", "locked"].includes(r.status) && <Popconfirm title="Approve next stage?" description="Comment box ka note approval log me save hoga." onConfirm={() => approve(r._id)}><Button type="primary">Approve next</Button></Popconfirm>}
        {r.status === "approved" && <Popconfirm title="Lock this payroll?" description="Lock ke baad salary cycle final ho jayega." onConfirm={() => lock(r._id)}><Button danger>Lock payroll</Button></Popconfirm>}
      </Space>
    ) },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="cyan">Step 1: Generate salary</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Enterprise payroll run</Typography.Title>
          <Typography.Text type="secondary">
            Month, year, working days aur LOP days clearly fill karein. Generate ke baad run approval workflow me chala jayega.
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Generate monthly salary run" style={cardStyle}>
        <Alert showIcon type="info" style={{ marginBottom: 16 }} message="Tip: Working days total payable days hain, LOP days unpaid leave deduction ke liye use hote hain." />
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ workingDays: 30, lopDays: 0 }}>
          <Row gutter={16}>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Salary month number" name="month" extra="Example: January ke liye 1, December ke liye 12." rules={[{ required: true, message: "Month is required" }]}>
                <InputNumber min={1} max={12} placeholder="e.g. 5" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Salary year" name="year" extra="Jis year ka payroll generate karna hai." rules={[{ required: true, message: "Year is required" }]}>
                <InputNumber min={2020} max={2100} placeholder="e.g. 2026" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="Total working days" name="workingDays" extra="Usually 26, 30 ya 31 as per policy.">
                <InputNumber min={1} max={31} placeholder="e.g. 30" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="LOP / unpaid leave days" name="lopDays" extra="Agar unpaid leave nahi hai to 0 rakhein.">
                <InputNumber min={0} max={31} placeholder="e.g. 0" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Button loading={saving} type="primary" htmlType="submit">Generate salary run</Button>
        </Form>
      </Card>

      <Card
        title="Generated payroll runs"
        extra={<Input value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Approval or lock comment" placeholder="Approval/lock comment likhein" style={{ width: 280 }} />}
        style={cardStyle}
      >
        <Table rowKey="_id" columns={cols} dataSource={runs} scroll={{ x: 820 }} />
      </Card>

      <Drawer width={900} open={open} onClose={() => setOpen(false)} title="Payroll run details">
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Salary period">{runDetails?.run ? `${runDetails.run.month}/${runDetails.run.year}` : "-"}</Descriptions.Item>
          <Descriptions.Item label="Workflow status"><Tag color={statusColor[runDetails?.run?.status]}>{label(runDetails?.run?.status)}</Tag></Descriptions.Item>
          <Descriptions.Item label="Employees processed">{runDetails?.run?.totalEmployees || 0}</Descriptions.Item>
          <Descriptions.Item label="Total net payout">{money(runDetails?.run?.totalPayout)}</Descriptions.Item>
        </Descriptions>
        <Table
          rowKey="_id"
          size="small"
          dataSource={runDetails?.items || []}
          columns={[
            { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
            { title: "Gross salary", dataIndex: "gross", render: money },
            { title: "Total deductions", dataIndex: "totalDeductions", render: money },
            { title: "Loan EMI deduction", dataIndex: "loanEmiDeduction", render: money },
            { title: "Net salary payable", dataIndex: "netSalary", render: money },
          ]}
        />
      </Drawer>
    </Space>
  );
}
