import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Alert,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined, WarningOutlined, AppstoreOutlined } from "@ant-design/icons";
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
} from "../../../features/inventorySlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, toolbarRow, modalTitle,
} from "../../../styles/pageStyles";

const { Option } = Select;

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const Supplies = () => {
  const dispatch = useDispatch();
  const { items, loading, actionLoading, error } = useSelector((state) => state.inventory);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingSupply, setEditingSupply] = useState(null);
  const [form] = Form.useForm();

  const supplies = useMemo(() => items.filter((item) => item.itemType === "supply"), [items]);

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
    dispatch(fetchInventoryItems({ itemType: "supply" }));
  }, [dispatch]);

  const openModal = (supply = null) => {
    setEditingSupply(supply);
    if (supply) {
      form.setFieldsValue(supply);
    } else {
      form.setFieldsValue({ quantity: 0, allocated: 0, minThreshold: 10, unit: "pcs" });
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
    } catch (submitError) {
      message.error(submitError || "Unable to save supply");
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
        } catch (deleteError) {
          message.error(deleteError || "Unable to delete supply");
        }
      },
    });
  };

  const totalSupplies = supplies.length;
  const lowStock = supplies.filter((s) => s.lowStock ?? Number(s.quantity || 0) <= Number(s.minThreshold || 10)).length;
  const totalQuantity = supplies.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
  const totalAvailable = supplies.reduce(
    (acc, s) => acc + Number(s.available ?? Math.max(Number(s.quantity || 0) - Number(s.allocated || 0), 0)),
    0
  );

  const columns = [
    { title: "Supply Name", dataIndex: "name", key: "name", render: (v) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span> },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Allocated", dataIndex: "allocated", key: "allocated" },
    {
      title: "Available",
      key: "available",
      render: (_, record) => Number(record.available ?? Math.max(Number(record.quantity || 0) - Number(record.allocated || 0), 0)),
    },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isLow = record.lowStock ?? Number(record.quantity || 0) <= Number(record.minThreshold || 10);
        return isLow
          ? <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>Low Stock</span>
          : <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>Healthy</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Supplies Management"
        subtitle="Track stock levels and keep essentials available for staff and students"
        icon={<InboxOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} loading={actionLoading}>
            Add Supply
          </Button>
        }
      />
      <div style={pageWrapper}>
        {error ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} /> : null}

        <div style={{ ...statGrid(180), marginTop: 0 }}>
          <StatCard icon={<AppstoreOutlined />} label="Total Supplies" value={totalSupplies} color="#2563EB" />
          <StatCard icon={<WarningOutlined />} label="Low Stock" value={lowStock} color="#DC2626" />
          <StatCard icon={<InboxOutlined />} label="Available Units" value={`${totalAvailable} / ${totalQuantity}`} color="#15803D" />
        </div>

        <style>{tableHeadCss("supplies-tbl")}</style>

        <div style={sectionPanel}>
          <div style={toolbarRow}>
            <Input.Search
              placeholder="Search by name, category or unit"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>

          <div className="supplies-tbl" style={tableContainer}>
            <Table
              columns={columns}
              dataSource={filteredSupplies}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: "No supplies found. Add your first supply item." }}
            />
          </div>
        </div>

        <Modal
          title={modalTitle(<InboxOutlined />, editingSupply ? "Edit Supply" : "Add Supply")}
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
            <Form.Item label="Allocated" name="allocated" initialValue={0} dependencies={["quantity"]}
              rules={[({ getFieldValue }) => ({ validator(_, value) {
                const quantity = Number(getFieldValue("quantity") || 0);
                const allocated = Number(value || 0);
                if (allocated <= quantity) return Promise.resolve();
                return Promise.reject(new Error("Allocated cannot be greater than quantity"));
              } })]}
            >
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
      </div>
    </>
  );
};

export default Supplies;
