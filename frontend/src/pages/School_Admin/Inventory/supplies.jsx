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

const Supplies = () => {
  const dispatch = useDispatch();
  const { items, loading, actionLoading } = useSelector((state) => state.inventory);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingSupply, setEditingSupply] = useState(null);
  const [form] = Form.useForm();

  const supplies = useMemo(
    () => items.filter((item) => item.itemType === "supply"),
    [items]
  );

  const filteredSupplies = useMemo(() => {
    if (!searchText.trim()) return supplies;
    const keyword = searchText.toLowerCase();
    return supplies.filter(
      (item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.unit?.toLowerCase().includes(keyword)
    );
  }, [searchText, supplies]);

  useEffect(() => {
    dispatch(fetchInventoryItems());
  }, [dispatch]);

  const openModal = (supply = null) => {
    setEditingSupply(supply);
    if (supply) {
      form.setFieldsValue(supply);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSupply(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        itemType: "supply",
      };

      if (editingSupply?._id) {
        await dispatch(updateInventoryItem({ id: editingSupply._id, payload })).unwrap();
        message.success("Supply updated successfully");
      } else {
        await dispatch(createInventoryItem(payload)).unwrap();
        message.success("Supply added successfully");
      }

      closeModal();
    } catch (error) {
      message.error(error || "Unable to save supply");
    }
  };

  const handleDelete = (supply) => {
    Modal.confirm({
      title: "Delete supply?",
      content: `This will permanently remove ${supply.name}.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteInventoryItem(supply._id)).unwrap();
          message.success("Supply deleted successfully");
        } catch (error) {
          message.error(error || "Unable to delete supply");
        }
      },
    });
  };

  const totalSupplies = supplies.length;
  const lowStock = supplies.filter((s) => Number(s.quantity || 0) <= Number(s.minThreshold || 10)).length;
  const totalAvailable = supplies.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

  const columns = [
    { title: "Supply Name", dataIndex: "name", key: "name" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isLow = Number(record.quantity || 0) <= Number(record.minThreshold || 10);
        return <Tag color={isLow ? "red" : "green"}>{isLow ? "Low Stock" : "Available"}</Tag>;
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
        <Breadcrumb.Item>Supplies</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Title level={4} style={{ marginBottom: 4 }}>Supplies Management</Title>
        <Text type="secondary">Track stock levels and keep essentials available for staff and students.</Text>

        <Row gutter={16} style={{ marginTop: 20, marginBottom: 20 }}>
          <Col xs={24} sm={8}><Card title="Total Supplies">{totalSupplies}</Card></Col>
          <Col xs={24} sm={8}><Card title="Low Stock">{lowStock}</Card></Col>
          <Col xs={24} sm={8}><Card title="Total Available">{totalAvailable}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Input.Search
            placeholder="Search by name, category or unit"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Supply
          </Button>
        </div>

        <Table columns={columns} dataSource={filteredSupplies} rowKey="_id" loading={loading} pagination={{ pageSize: 8 }} />

        <Modal
          title={editingSupply ? "Edit Supply" : "Add Supply"}
          open={modalOpen}
          onCancel={closeModal}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Supply Name" name="name" rules={[{ required: true, message: "Enter supply name" }]}>
              <Input placeholder="e.g., Notebook" />
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
              <Input placeholder="pcs / box / bottle" />
            </Form.Item>
            <Form.Item label="Low Stock Alert" name="minThreshold" initialValue={10}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  {editingSupply ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Supplies;