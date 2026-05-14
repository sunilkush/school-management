import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approveLoanRequest, createLoanRequest, fetchLoans, rejectLoanRequest } from "../../../../features/payrollEnterpriseSlice";
import { fetchPayrollEmployees } from "../../../../features/payrollSlice";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusColor = { pending: "orange", active: "green", rejected: "red", closed: "default" };
const cardStyle = { borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" };
const heroStyle = { borderRadius: 18, background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 55%, #fef2f2 100%)", border: "1px solid #fed7aa" };

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
    <Space direction="vertical" style={{ width: "100%" }} size={18}>
      <Card style={heroStyle}>
        <Space direction="vertical" size={4}>
          <Tag color="orange">Loans & advances</Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>Employee loan management</Typography.Title>
          <Typography.Text type="secondary">
            Employee select karke total loan, monthly EMI aur deduction start month clearly enter karein. Pending requests table se approve/reject karein.
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Create loan / advance request" style={cardStyle}>
        <Alert showIcon type="info" style={{ marginBottom: 16 }} message="EMI amount har salary run me loan deduction ke roop me apply hoga." />
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ startMonth: dayjs() }}>
          <Row gutter={16}>
            <Col xs={24} lg={8}>
              <Form.Item label="Employee name" name="employeeId" extra="Jis staff ko loan/advance dena hai." rules={[{ required: true, message: "Employee is required" }]}>
                <Select loading={loadingEmployees} showSearch placeholder="Employee select karein" optionFilterProp="label" options={(employees || []).map((e) => ({ value: e._id, label: `${e.userId?.name || "Employee"} (${e.designation || "Staff"})` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} lg={5}>
              <Form.Item label="Total loan amount" name="totalAmount" extra="Employee ko diya jane wala total amount." rules={[{ required: true, message: "Total amount is required" }]}>
                <InputNumber min={1} placeholder="e.g. 50000" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} lg={5}>
              <Form.Item label="Monthly EMI amount" name="emiAmount" extra="Har month salary se deduct hoga." rules={[{ required: true, message: "EMI amount is required" }]}>
                <InputNumber min={1} placeholder="e.g. 5000" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} lg={6}>
              <Form.Item label="Deduction start month" name="startMonth" extra="Kis month se EMI cut hogi." rules={[{ required: true, message: "Start month is required" }]}>
                <DatePicker picker="month" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={saving}>Submit loan request</Button>
        </Form>
      </Card>

      <Card title="Loan requests and status" style={cardStyle}>
        <Table
          rowKey="_id"
          dataSource={loans}
          scroll={{ x: 920 }}
          columns={[
            { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
            { title: "Total amount", dataIndex: "totalAmount", render: money },
            { title: "Remaining balance", dataIndex: "remainingAmount", render: money },
            { title: "Monthly EMI", dataIndex: "emiAmount", render: money },
            { title: "Start month", dataIndex: "startMonth", render: (v) => (v ? dayjs(v).format("MMM YYYY") : "-") },
            { title: "Loan status", dataIndex: "status", render: (v) => <Tag color={statusColor[v]}>{String(v || "-").toUpperCase()}</Tag> },
            { title: "Actions", render: (_, r) => r.status === "pending" ? <Space><Popconfirm title="Approve loan?" description="Loan active ho jayega aur EMI salary me deduct hogi." onConfirm={() => approve(r._id)}><Button type="primary">Approve</Button></Popconfirm><Popconfirm title="Reject loan?" onConfirm={() => reject(r._id)}><Button danger>Reject</Button></Popconfirm></Space> : <Input readOnly aria-label="Loan action status" value={r.rejectionReason || "No action available"} /> },
          ]}
        />
      </Card>
    </Space>
  );
}
