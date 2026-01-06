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
  Select,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

const Supplies = () => {
  const [supplies, setSupplies] = useState([
    { key: 1, name: "Notebook", category: "Stationery", quantity: 100, unit: "pcs" },
    { key: 2, name: "Pen", category: "Stationery", quantity: 200, unit: "pcs" },
    { key: 3, name: "Hand Sanitizer", category: "Hygiene", quantity: 50, unit: "bottles" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [form] = Form.useForm();

  // Open modal for add/edit
  const openModal = (supply = null) => {
    setEditingSupply(supply);
    if (supply) {
      form.setFieldsValue(supply);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Save supply
  const handleSaveSupply = (values) => {
    const newSupply = {
      key: editingSupply ? editingSupply.key : supplies.length + 1,
      ...values,
    };

    if (editingSupply) {
      setSupplies(supplies.map((s) => (s.key === editingSupply.key ? newSupply : s)));
      message.success("Supply updated successfully!");
    } else {
      setSupplies([...supplies, newSupply]);
      message.success("Supply added successfully!");
    }

    setModalVisible(false);
    setEditingSupply(null);
    form.resetFields();
  };

  // Delete supply
  const handleDeleteSupply = (supply) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete the supply "${supply.name}"?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setSupplies(supplies.filter((s) => s.key !== supply.key));
        message.success("Supply deleted successfully!");
      },
    });
  };

  // Summary
  const totalSupplies = supplies.length;
  const lowStock = supplies.filter((s) => s.quantity <= 10).length;
  const totalAvailable = supplies.reduce((acc, s) => acc + s.quantity, 0);

  const columns = [
    { title: "Supply Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (record.quantity <= 10 ? <span style={{ color: "red" }}>Low Stock</span> : "Available"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteSupply(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Supplies</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card title="Total Supplies">{totalSupplies}</Card></Col>
          <Col xs={24} sm={8}><Card title="Low Stock">{lowStock}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Available">{totalAvailable}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Supplies List</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Supply</Button>
        </div>

        <Table columns={columns} dataSource={supplies} rowKey="key" pagination={{ pageSize: 5 }} />

        {/* Add/Edit Modal */}
        <Modal
          title={editingSupply ? "Edit Supply" : "Add Supply"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingSupply(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveSupply}>
            <Form.Item label="Supply Name" name="name" rules={[{ required: true, message: "Enter supply name" }]}>
              <Input placeholder="Enter supply name" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: "Select category" }]}>
              <Select placeholder="Select category">
                <Option value="Stationery">Stationery</Option>
                <Option value="Hygiene">Hygiene</Option>
                <Option value="Electronics">Electronics</Option>
                <Option value="Furniture">Furniture</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: "Enter quantity" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Unit" name="unit" rules={[{ required: true, message: "Enter unit" }]}>
              <Input placeholder="Enter unit (pcs, bottles, etc.)" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); setEditingSupply(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingSupply ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Supplies;
