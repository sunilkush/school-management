import { Card, Row, Col, Table, Tag, DatePicker } from "antd";
import { Line } from "@ant-design/plots";

export default function RevenuePage() {

  const revenueData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 18000 },
    { month: "Mar", revenue: 25000 },
    { month: "Apr", revenue: 21000 },
    { month: "May", revenue: 30000 }
  ];

  const config = {
    data: revenueData,
    xField: "month",
    yField: "revenue",
    smooth: true,
  };

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
      title: "Date",
      dataIndex: "date"
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Paid" ? "green" : "orange"}>
          {status}
        </Tag>
      )
    }
  ];

  const data = [
    {
      key: 1,
      school: "ABC Public School",
      plan: "Premium",
      amount: "₹999",
      date: "12 Mar 2026",
      status: "Paid"
    },
    {
      key: 2,
      school: "XYZ School",
      plan: "Basic",
      amount: "₹499",
      date: "10 Mar 2026",
      status: "Pending"
    }
  ];

  return (
    <div style={{ padding: 24 }}>

      <h2 style={{ marginBottom: 20 }}>Revenue Dashboard</h2>

      {/* STATS */}

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card title="Total Revenue">₹8,40,000</Card>
        </Col>

        <Col span={6}>
          <Card title="This Month">₹95,000</Card>
        </Col>

        <Col span={6}>
          <Card title="Active Subscriptions">36</Card>
        </Col>

        <Col span={6}>
          <Card title="Avg Revenue">₹23,000</Card>
        </Col>
      </Row>

      {/* REVENUE CHART */}

      <Card title="Monthly Revenue" style={{ marginBottom: 20 }}>
        <Line {...config} />
      </Card>

      {/* TABLE FILTER */}

      <DatePicker.RangePicker style={{ marginBottom: 20 }} />

      {/* REVENUE TABLE */}

      <Table
        columns={columns}
        dataSource={data}
        bordered
      />

    </div>
  );
}