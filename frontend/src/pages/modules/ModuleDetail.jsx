import React from "react";
import { useParams } from "react-router-dom";
import { Card, Col, Row, Typography, Table, Tag, Button, Space } from "antd";
import { ERP_MODULES } from "../../utils/moduleRegistry";

const { Title, Text } = Typography;

const ModuleDetail = () => {
  const { moduleKey } = useParams();
  const moduleData = ERP_MODULES.find((m) => m.key === moduleKey);

  if (!moduleData) {
    return (
      <Card>
        <Title level={4}>Module not found</Title>
        <Text type="secondary">Requested module does not exist.</Text>
      </Card>
    );
  }

  const stats = [
    { label: "Total Records", value: "1,240" },
    { label: "Pending Tasks", value: "32" },
    { label: "Today Updates", value: "18" },
  ];

  const dataSource = [
    { key: "1", name: `${moduleData.title} Task 1`, owner: "Admin", status: "active" },
    { key: "2", name: `${moduleData.title} Task 2`, owner: "Coordinator", status: "pending" },
    { key: "3", name: `${moduleData.title} Task 3`, owner: "Staff", status: "completed" },
  ];

  const columns = [
    { title: "Task", dataIndex: "name", key: "name" },
    { title: "Owner", dataIndex: "owner", key: "owner" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "active" ? "green" : status === "pending" ? "orange" : "blue";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Title level={3} style={{ marginBottom: 6 }}>{moduleData.title}</Title>
        <Text type="secondary">{moduleData.description}</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {stats.map((item) => (
          <Col xs={24} md={8} key={item.label}>
            <Card>
              <Text type="secondary">{item.label}</Text>
              <Title level={4} style={{ margin: 0 }}>{item.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={`${moduleData.title} Operations`}
        extra={
          <Space>
            <Button type="primary">Add New</Button>
            <Button>Export</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={dataSource} pagination={{ pageSize: 5 }} />
      </Card>
    </Space>
  );
};

export default ModuleDetail;
