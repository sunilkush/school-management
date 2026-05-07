import { Button, Card, Descriptions, Drawer, Form, Input, InputNumber, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approvePayrollRun, fetchPayrollRunDetails, fetchPayrollRuns, generatePayrollRun, lockPayrollRun } from "../../../features/payrollEnterpriseSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { draft: "default", hr_approved: "blue", accountant_approved: "purple", approved: "green", locked: "gold" };
const label = (v) => String(v || "-").replaceAll("_", " ").toUpperCase();

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
    { title: "Period", render: (_, r) => `${r.month}/${r.year}` },
    { title: "Employees", dataIndex: "totalEmployees" },
    { title: "Payout", dataIndex: "totalPayout", render: money },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{label(v)}</Tag> },
    { title: "Actions", render: (_, r) => (
      <Space wrap>
        <Button onClick={() => viewDetails(r._id)}>Details</Button>
        {!["approved", "locked"].includes(r.status) && <Popconfirm title="Approve next stage?" onConfirm={() => approve(r._id)}><Button type="primary">Approve</Button></Popconfirm>}
        {r.status === "approved" && <Popconfirm title="Lock this payroll?" onConfirm={() => lock(r._id)}><Button danger>Lock</Button></Popconfirm>}
      </Space>
    ) },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Enterprise Payroll Run</Typography.Title>
      <Card title="Generate Payroll Run">
        <Form form={form} layout="inline" onFinish={onFinish} initialValues={{ workingDays: 30, lopDays: 0 }}>
          <Form.Item name="month" rules={[{ required: true, message: "Month is required" }]}><InputNumber min={1} max={12} placeholder="Month" /></Form.Item>
          <Form.Item name="year" rules={[{ required: true, message: "Year is required" }]}><InputNumber min={2020} max={2100} placeholder="Year" /></Form.Item>
          <Form.Item name="workingDays"><InputNumber min={1} max={31} placeholder="Working days" /></Form.Item>
          <Form.Item name="lopDays"><InputNumber min={0} max={31} placeholder="LOP days" /></Form.Item>
          <Button loading={saving} type="primary" htmlType="submit">Generate</Button>
        </Form>
      </Card>
      <Card title="Payroll Runs" extra={<Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Approval/lock comment" style={{ width: 260 }} />}>
        <Table rowKey="_id" columns={cols} dataSource={runs} />
      </Card>
      <Drawer width={900} open={open} onClose={() => setOpen(false)} title="Payroll Run Details">
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Period">{runDetails?.run ? `${runDetails.run.month}/${runDetails.run.year}` : "-"}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={statusColor[runDetails?.run?.status]}>{label(runDetails?.run?.status)}</Tag></Descriptions.Item>
          <Descriptions.Item label="Employees">{runDetails?.run?.totalEmployees || 0}</Descriptions.Item>
          <Descriptions.Item label="Payout">{money(runDetails?.run?.totalPayout)}</Descriptions.Item>
        </Descriptions>
        <Table
          rowKey="_id"
          size="small"
          dataSource={runDetails?.items || []}
          columns={[
            { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
            { title: "Gross", dataIndex: "gross", render: money },
            { title: "Deductions", dataIndex: "totalDeductions", render: money },
            { title: "Loan EMI", dataIndex: "loanEmiDeduction", render: money },
            { title: "Net Salary", dataIndex: "netSalary", render: money },
          ]}
        />
      </Drawer>
    </Space>
  );
}
