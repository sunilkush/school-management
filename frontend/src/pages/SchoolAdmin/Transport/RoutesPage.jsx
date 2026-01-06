import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Card,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
} from "@ant-design/icons";

const { Content } = Layout;

const RoutesPage = () => {
  const [routes, setRoutes] = useState([
    { key: 1, name: "Route A", bus: "Bus 1", stops: ["Stop 1", "Stop 2"], students: 12 },
    { key: 2, name: "Route B", bus: "Bus 2", stops: ["Stop 3", "Stop 4"], students: 8 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form] = Form.useForm();

  // Add/Edit Route
  const handleSaveRoute = (values) => {
    const newRoute = {
      key: editingRoute ? editingRoute.key : routes.length + 1,
      name: values.name,
      bus: values.bus,
      stops: values.stops.split(",").map((s) => s.trim()),
      students: values.students,
    };

    if (editingRoute) {
      setRoutes(routes.map((r) => (r.key === editingRoute.key ? newRoute : r)));
      message.success("Route updated successfully!");
    } else {
      setRoutes([...routes, newRoute]);
      message.success("Route added successfully!");
    }

    setModalVisible(false);
    setEditingRoute(null);
    form.resetFields();
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    form.setFieldsValue({
      name: route.name,
      bus: route.bus,
      stops: route.stops.join(", "),
      students: route.students,
    });
    setModalVisible(true);
  };

  const handleDeleteRoute = (route) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete ${route.name}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setRoutes(routes.filter((r) => r.key !== route.key));
        message.success("Route deleted successfully!");
      },
    });
  };

  // Summary
  const totalRoutes = routes.length;
  const totalBuses = new Set(routes.map((r) => r.bus)).size;
  const totalStudents = routes.reduce((acc, r) => acc + r.students, 0);

  const columns = [
    { title: "Route Name", dataIndex: "name", key: "name" },
    { title: "Bus Assigned", dataIndex: "bus", key: "bus" },
    { title: "Stops", dataIndex: "stops", key: "stops", render: (stops) => stops.join(", ") },
    { title: "Students", dataIndex: "students", key: "students" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditRoute(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoute(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Transport</Breadcrumb.Item>
        <Breadcrumb.Item>Routes</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Routes" bordered={false}>{totalRoutes}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Buses" bordered={false}>{totalBuses}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Total Students" bordered={false}>{totalStudents}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Bus Routes</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Add Route
          </Button>
        </div>

        <Table columns={columns} dataSource={routes} pagination={{ pageSize: 5 }} rowKey="key" />

        {/* Add/Edit Route Modal */}
        <Modal
          title={editingRoute ? "Edit Route" : "Add Route"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingRoute(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveRoute}>
            <Form.Item label="Route Name" name="name" rules={[{ required: true, message: "Enter route name" }]}>
              <Input placeholder="Enter route name" />
            </Form.Item>
            <Form.Item label="Bus Assigned" name="bus" rules={[{ required: true, message: "Enter bus name" }]}>
              <Input placeholder="Enter bus name" />
            </Form.Item>
            <Form.Item label="Stops (comma separated)" name="stops" rules={[{ required: true, message: "Enter stops" }]}>
              <Input placeholder="e.g., Stop 1, Stop 2, Stop 3" />
            </Form.Item>
            <Form.Item label="Number of Students" name="students" rules={[{ required: true, message: "Enter number of students" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); form.resetFields(); setEditingRoute(null); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingRoute ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default RoutesPage;
