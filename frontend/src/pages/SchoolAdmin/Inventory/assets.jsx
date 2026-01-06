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

const Assets = () => {
  const [assets, setAssets] = useState([
    { key: 1, name: "Projector", category: "Electronics", quantity: 5, allocated: 2, location: "Room 101" },
    { key: 2, name: "Computer", category: "Electronics", quantity: 20, allocated: 15, location: "Computer Lab" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form] = Form.useForm();

  // Open modal for add/edit
  const openModal = (asset = null) => {
    setEditingAsset(asset);
    if (asset) {
      form.setFieldsValue(asset);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Save asset
  const handleSaveAsset = (values) => {
    const newAsset = {
      key: editingAsset ? editingAsset.key : assets.length + 1,
      ...values,
    };

    if (editingAsset) {
      setAssets(assets.map((a) => (a.key === editingAsset.key ? newAsset : a)));
      message.success("Asset updated successfully!");
    } else {
      setAssets([...assets, newAsset]);
      message.success("Asset added successfully!");
    }

    setModalVisible(false);
    setEditingAsset(null);
    form.resetFields();
  };

  // Delete asset
  const handleDeleteAsset = (asset) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete the asset "${asset.name}"?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setAssets(assets.filter((a) => a.key !== asset.key));
        message.success("Asset deleted successfully!");
      },
    });
  };

  // Summary
  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((acc, a) => acc + a.quantity, 0);
  const totalAllocated = assets.reduce((acc, a) => acc + a.allocated, 0);
  const totalAvailable = totalQuantity - totalAllocated;

  const columns = [
    { title: "Asset Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Allocated", dataIndex: "allocated", key: "allocated" },
    { title: "Available", key: "available", render: (_, record) => record.quantity - record.allocated },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAsset(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Assets</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card title="Total Assets">{totalAssets}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Available">{totalAvailable}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Allocated">{totalAllocated}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Assets List</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Asset</Button>
        </div>

        <Table columns={columns} dataSource={assets} rowKey="key" pagination={{ pageSize: 5 }} />

        {/* Add/Edit Modal */}
        <Modal
          title={editingAsset ? "Edit Asset" : "Add Asset"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingAsset(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveAsset}>
            <Form.Item label="Asset Name" name="name" rules={[{ required: true, message: "Enter asset name" }]}>
              <Input placeholder="Enter asset name" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: "Select category" }]}>
              <Select placeholder="Select category">
                <Option value="Electronics">Electronics</Option>
                <Option value="Furniture">Furniture</Option>
                <Option value="Stationery">Stationery</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: "Enter quantity" }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Allocated" name="allocated" rules={[{ required: true, message: "Enter allocated quantity" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Location" name="location" rules={[{ required: true, message: "Enter location" }]}>
              <Input placeholder="Enter location" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); setEditingAsset(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingAsset ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Assets;
