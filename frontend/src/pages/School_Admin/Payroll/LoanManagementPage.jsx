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
  createLoanRequest,
  fetchLoans,
} from "../../../features/payrollEnterpriseSlice";

export default function LoanManagementPage() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loans, saving } = useSelector((s) => s.payrollEnterprise);
  useEffect(() => {
    dispatch(fetchLoans());
  }, [dispatch]);
  const onFinish = async (v) => {
    try {
      await dispatch(createLoanRequest(v)).unwrap();
      message.success("Loan request submitted");
      form.resetFields();
    } catch (e) {
      message.error(e);
    }
  };
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Apply Loan / Advance">
        <Form form={form} layout="inline" onFinish={onFinish}>
          <Form.Item name="employeeId" rules={[{ required: true }]}>
            <InputNumber style={{ width: 180 }} placeholder="Employee Id" />
          </Form.Item>
          <Form.Item name="totalAmount" rules={[{ required: true }]}>
            <InputNumber min={1} placeholder="Amount" />
          </Form.Item>
          <Form.Item name="emiAmount" rules={[{ required: true }]}>
            <InputNumber min={1} placeholder="EMI" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Submit
          </Button>
        </Form>
      </Card>
      <Card title="Loan Requests">
        <Table
          rowKey="_id"
          dataSource={loans}
          columns={[
            { title: "Employee", dataIndex: "employeeId" },
            { title: "Total", dataIndex: "totalAmount" },
            { title: "Remaining", dataIndex: "remainingAmount" },
            { title: "EMI", dataIndex: "emiAmount" },
            {
              title: "Status",
              dataIndex: "status",
              render: (v) => <Tag>{v}</Tag>,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
