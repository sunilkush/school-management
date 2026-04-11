import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Typography,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
} from "../../../features/inventorySlice";

const { Content } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

const Assets = () => {
  const dispatch = useDispatch();
  const { items, loading, actionLoading } = useSelector((state) => state.inventory);

  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingAsset, setEditingAsset] = useState(null);
  const [form] = Form.useForm();

  const assets = useMemo(() => items.filter((item) => item.itemType === "asset"), [items]);

  const filteredAssets = useMemo(() => {
    if (!searchText.trim()) return assets;
    const keyword = searchText.toLowerCase();
    return assets.filter(
      (item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.location?.toLowerCase().includes(keyword)
    );
  }, [assets, searchText]);

  useEffect(() => {
    dispatch(fetchInventoryItems());
  }, [dispatch]);

  const openModal = (asset = null) => {
    setEditingAsset(asset);
    if (asset) {
      form.setFieldsValue(asset);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAsset(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        itemType: "asset",
      };

      if (editingAsset?._id) {
        await dispatch(updateInventoryItem({ id: editingAsset._id, payload })).unwrap();
        message.success("Asset updated successfully");
      } else {
        await dispatch(createInventoryItem(payload)).unwrap();
        message.success("Asset added successfully");
      }

      closeModal();
    } catch (error) {
      message.error(error || "Unable to save asset");
    }
  };

  const handleDelete = (asset) => {
    Modal.confirm({
      title: "Delete asset?",
      content: `This will permanently remove ${asset.name}.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteInventoryItem(asset._id)).unwrap();
          message.success("Asset deleted successfully");
        } catch (error) {
          message.error(error || "Unable to delete asset");
        }
      },
    });
  };

  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((acc, a) => acc + Number(a.quantity || 0), 0);
  const totalAllocated = assets.reduce((acc, a) => acc + Number(a.allocated || 0), 0);
  const totalAvailable = Math.max(totalQuantity - totalAllocated, 0);

  const columns = [
    { title: "Asset Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Allocated", dataIndex: "allocated", key: "allocated" },
    {
      title: "Available",
      key: "available",
      render: (_, record) => Math.max(Number(record.quantity || 0) - Number(record.allocated || 0), 0),
    },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const available = Math.max(Number(record.quantity || 0) - Number(record.allocated || 0), 0);
        return <Tag color={available === 0 ? "volcano" : "green"}>{available === 0 ? "Fully Allocated" : "Available"}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Inventory</Breadcrumb.Item>
        <Breadcrumb.Item>Assets</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Title level={4} style={{ marginBottom: 4 }}>Assets Management</Title>
        <Text type="secondary">Manage high-value assets and keep allocation transparent.</Text>

        <Row gutter={16} style={{ marginTop: 20, marginBottom: 20 }}>
          <Col xs={24} sm={8}><Card title="Total Assets">{totalAssets}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Available">{totalAvailable}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Allocated">{totalAllocated}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="Search by asset, category or location"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Asset
          </Button>
        </div>

        <Table columns={columns} dataSource={filteredAssets} rowKey="_id" loading={loading} pagination={{ pageSize: 8 }} />

        <Modal title={editingAsset ? "Edit Asset" : "Add Asset"} open={modalOpen} onCancel={closeModal} footer={null} destroyOnClose>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Asset Name" name="name" rules={[{ required: true, message: "Enter asset name" }]}>
              <Input placeholder="e.g., Projector" />
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
            <Form.Item label="Allocated" name="allocated" initialValue={0}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Location" name="location" rules={[{ required: true, message: "Enter location" }]}>
              <Input placeholder="e.g., Physics Lab" />
            </Form.Item>
            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  {editingAsset ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Assets;