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
  Tag,
  Card,
  Row,
  Col,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([
    { key: 1, type: "Bus", number: "MH01AB1234", driver: "John Doe", capacity: 40, status: "In Use", route: "Route A" },
    { key: 2, type: "Van", number: "MH01XY5678", driver: "Jane Smith", capacity: 15, status: "Available", route: "Route B" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form] = Form.useForm();

  // Add/Edit Vehicle
  const handleSaveVehicle = (values) => {
    const newVehicle = {
      key: editingVehicle ? editingVehicle.key : vehicles.length + 1,
      type: values.type,
      number: values.number,
      driver: values.driver,
      capacity: values.capacity,
      status: values.status,
      route: values.route,
    };

    if (editingVehicle) {
      setVehicles(vehicles.map((v) => (v.key === editingVehicle.key ? newVehicle : v)));
      message.success("Vehicle updated successfully!");
    } else {
      setVehicles([...vehicles, newVehicle]);
      message.success("Vehicle added successfully!");
    }

    setModalVisible(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue(vehicle);
    setModalVisible(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete vehicle ${vehicle.number}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setVehicles(vehicles.filter((v) => v.key !== vehicle.key));
        message.success("Vehicle deleted successfully!");
      },
    });
  };

  // Summary
  const totalVehicles = vehicles.length;
  const totalInUse = vehicles.filter((v) => v.status === "In Use").length;
  const totalAvailable = vehicles.filter((v) => v.status === "Available").length;

  const columns = [
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Vehicle Number", dataIndex: "number", key: "number" },
    { title: "Driver", dataIndex: "driver", key: "driver" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "In Use" ? "red" : "green"}>{status}</Tag>
      ),
    },
    { title: "Route Assigned", dataIndex: "route", key: "route" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditVehicle(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteVehicle(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Transport</Breadcrumb.Item>
        <Breadcrumb.Item>Vehicles</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card title="Total Vehicles">{totalVehicles}</Card></Col>
          <Col xs={24} sm={8}><Card title="In Use">{totalInUse}</Card></Col>
          <Col xs={24} sm={8}><Card title="Available">{totalAvailable}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>School Vehicles</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Add Vehicle
          </Button>
        </div>

        <Table columns={columns} dataSource={vehicles} pagination={{ pageSize: 5 }} rowKey="key" />

        {/* Add/Edit Vehicle Modal */}
        <Modal
          title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingVehicle(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveVehicle}>
            <Form.Item label="Type" name="type" rules={[{ required: true, message: "Enter vehicle type" }]}>
              <Select placeholder="Select vehicle type">
                <Option value="Bus">Bus</Option>
                <Option value="Van">Van</Option>
                <Option value="Car">Car</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Vehicle Number" name="number" rules={[{ required: true, message: "Enter vehicle number" }]}>
              <Input placeholder="Enter vehicle number" />
            </Form.Item>
            <Form.Item label="Driver Name" name="driver" rules={[{ required: true, message: "Enter driver name" }]}>
              <Input placeholder="Enter driver name" />
            </Form.Item>
             <Form.Item label="Driveing Licance" name="driver" rules={[{ required: true, message: "Enter Driveing Licance" }]}>
              <Input placeholder="Enter driver name" />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Enter capacity" }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true, message: "Select status" }]}>
              <Select placeholder="Select status">
                <Option value="In Use">In Use</Option>
                <Option value="Available">Available</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Route Assigned" name="route">
              <Input placeholder="Enter assigned route" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); setEditingVehicle(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingVehicle ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Vehicles;
