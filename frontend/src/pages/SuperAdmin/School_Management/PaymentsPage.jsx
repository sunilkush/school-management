import { useState } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Modal,
  Descriptions
} from "antd";

const { Option } = Select;

export default function PaymentsPage() {

  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const data = [
    {
      key: 1,
      school: "ABC Public School",
      plan: "Premium",
      amount: "₹999",
      cycle: "Monthly",
      method: "Razorpay",
      status: "Active",
      expiry: "12 Mar 2026"
    },
    {
      key: 2,
      school: "XYZ School",
      plan: "Basic",
      amount: "₹499",
      cycle: "Monthly",
      method: "Stripe",
      status: "Expired",
      expiry: "02 Mar 2026"
    }
  ];

  const columns = [
    {
      title: "School",
      dataIndex: "school"
    },
    {
      title: "Plan",
      dataIndex: "plan"
    },
    {
      title: "Amount",
      dataIndex: "amount"
    },
    {
      title: "Billing Cycle",
      dataIndex: "cycle"
    },
    {
      title: "Payment Method",
      dataIndex: "method"
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag
          color={
            status === "Active"
              ? "green"
              : status === "Expired"
              ? "red"
              : "orange"
          }
        >
          {status}
        </Tag>
      )
    },
    {
      title: "Expiry Date",
      dataIndex: "expiry"
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedPayment(record);
            setOpen(true);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>

      {/* PAGE TITLE */}

      <h2 style={{ marginBottom: 20 }}>Payments Management</h2>

      {/* STATISTICS */}

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card title="Total Revenue">₹5,40,000</Card>
        </Col>

        <Col span={6}>
          <Card title="Active Plans">32</Card>
        </Col>

        <Col span={6}>
          <Card title="Pending Payments">6</Card>
        </Col>

        <Col span={6}>
          <Card title="Expired Plans">4</Card>
        </Col>
      </Row>

      {/* FILTERS */}

      <Space style={{ marginBottom: 20 }}>
        <Input placeholder="Search School" />

        <Select placeholder="Plan" style={{ width: 150 }}>
          <Option value="basic">Basic</Option>
          <Option value="premium">Premium</Option>
        </Select>

        <Select placeholder="Status" style={{ width: 150 }}>
          <Option value="active">Active</Option>
          <Option value="expired">Expired</Option>
        </Select>

        <Button type="primary">Add Payment</Button>
      </Space>

      {/* TABLE */}

      <Table
        columns={columns}
        dataSource={data}
        bordered
      />

      {/* PAYMENT DETAILS MODAL */}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Payment Details"
      >
        {selectedPayment && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="School">
              {selectedPayment.school}
            </Descriptions.Item>

            <Descriptions.Item label="Plan">
              {selectedPayment.plan}
            </Descriptions.Item>

            <Descriptions.Item label="Amount">
              {selectedPayment.amount}
            </Descriptions.Item>

            <Descriptions.Item label="Billing Cycle">
              {selectedPayment.cycle}
            </Descriptions.Item>

            <Descriptions.Item label="Payment Method">
              {selectedPayment.method}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              {selectedPayment.status}
            </Descriptions.Item>

            <Descriptions.Item label="Expiry Date">
              {selectedPayment.expiry}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

    </div>
  );
}