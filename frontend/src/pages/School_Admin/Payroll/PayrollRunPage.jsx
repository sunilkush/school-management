import {
  Button,
  Card,
  Form,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  approvePayrollRun,
  fetchPayrollRuns,
  generatePayrollRun,
} from "../../../features/payrollEnterpriseSlice";

export default function PayrollRunPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { runs, saving } = useSelector((s) => s.payrollEnterprise);
  useEffect(() => {
    dispatch(fetchPayrollRuns());
  }, [dispatch]);
  const onFinish = async (values) => {
    try {
      await dispatch(generatePayrollRun(values)).unwrap();
      message.success("Payroll run generated");
      form.resetFields();
    } catch (e) {
      message.error(e);
    }
  };
  const cols = [
    { title: "Month", dataIndex: "month" },
    { title: "Year", dataIndex: "year" },
    { title: "Employees", dataIndex: "totalEmployees" },
    { title: "Payout", dataIndex: "totalPayout" },
    { title: "Status", dataIndex: "status", render: (v) => <Tag>{v}</Tag> },
    {
      title: "Action",
      render: (_, r) => (
        <Button onClick={() => dispatch(approvePayrollRun(r._id))}>
          Approve
        </Button>
      ),
    },
  ];
  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card title="Generate Payroll Run">
        <Form form={form} layout="inline" onFinish={onFinish}>
          <Form.Item name="month" rules={[{ required: true }]}>
            <InputNumber min={1} max={12} placeholder="Month" />
          </Form.Item>
          <Form.Item name="year" rules={[{ required: true }]}>
            <InputNumber min={2020} max={2100} placeholder="Year" />
          </Form.Item>
          <Button loading={saving} type="primary" htmlType="submit">
            Generate
          </Button>
        </Form>
      </Card>
      <Card title="Payroll Runs">
        <Table rowKey="_id" columns={cols} dataSource={runs} />
      </Card>
    </Space>
  );
}
