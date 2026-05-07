import { Button, Card, DatePicker, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approveLoanRequest, createLoanRequest, fetchLoans, rejectLoanRequest } from "../../../features/payrollEnterpriseSlice";
import { fetchPayrollEmployees } from "../../../features/payrollSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { pending: "orange", active: "green", rejected: "red", closed: "default" };

export default function LoanManagementPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loans, saving } = useSelector((s) => s.payrollEnterprise);
  const { employees, loadingEmployees } = useSelector((s) => s.payroll);

  useEffect(() => {
    dispatch(fetchLoans());
    dispatch(fetchPayrollEmployees());
  }, [dispatch]);

  const onFinish = async (v) => {
    try {
      await dispatch(createLoanRequest({ ...v, startMonth: v.startMonth?.toISOString() })).unwrap();
      message.success("Loan request submitted");
      form.resetFields();
    } catch (e) { message.error(e); }
  };

  const approve = async (id) => {
    try { await dispatch(approveLoanRequest({ id, comment: "Approved from loan management" })).unwrap(); message.success("Loan approved"); }
    catch (e) { message.error(e); }
  };
  const reject = async (id) => {
    try { await dispatch(rejectLoanRequest({ id, reason: "Rejected from loan management" })).unwrap(); message.success("Loan rejected"); }
    catch (e) { message.error(e); }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Loans & Advances</Typography.Title>
      <Card title="Apply Loan / Advance">
        <Form form={form} layout="inline" onFinish={onFinish} initialValues={{ startMonth: dayjs() }}>
          <Form.Item name="employeeId" rules={[{ required: true, message: "Employee is required" }]}>
            <Select loading={loadingEmployees} showSearch placeholder="Select employee" style={{ width: 260 }} optionFilterProp="label" options={(employees || []).map((e) => ({ value: e._id, label: `${e.userId?.name || "Employee"} (${e.designation || "Staff"})` }))} />
          </Form.Item>
          <Form.Item name="totalAmount" rules={[{ required: true }]}><InputNumber min={1} placeholder="Amount" /></Form.Item>
          <Form.Item name="emiAmount" rules={[{ required: true }]}><InputNumber min={1} placeholder="EMI" /></Form.Item>
          <Form.Item name="startMonth" rules={[{ required: true }]}><DatePicker picker="month" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Submit</Button>
        </Form>
      </Card>
      <Card title="Loan Requests">
        <Table
          rowKey="_id"
          dataSource={loans}
          columns={[
            { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
            { title: "Total", dataIndex: "totalAmount", render: money },
            { title: "Remaining", dataIndex: "remainingAmount", render: money },
            { title: "EMI", dataIndex: "emiAmount", render: money },
            { title: "Start", dataIndex: "startMonth", render: (v) => (v ? dayjs(v).format("MMM YYYY") : "-") },
            { title: "Status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{String(v || "-").toUpperCase()}</Tag> },
            { title: "Actions", render: (_, r) => r.status === "pending" ? <Space><Popconfirm title="Approve loan?" onConfirm={() => approve(r._id)}><Button type="primary">Approve</Button></Popconfirm><Popconfirm title="Reject loan?" onConfirm={() => reject(r._id)}><Button danger>Reject</Button></Popconfirm></Space> : <Input readOnly value={r.rejectionReason || "No action available"} /> },
          ]}
        />
      </Card>
    </Space>
  );
}
