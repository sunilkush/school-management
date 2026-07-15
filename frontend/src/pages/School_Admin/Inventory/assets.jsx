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
  Tag,
  Alert,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined, AppstoreOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
} from "../../../features/inventorySlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, toolbarRow,
  tableContainer, tableHeadCss, modalTitle,
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

const Assets = () => {
  const dispatch = useDispatch();
  const { items, loading, actionLoading, error } = useSelector((state) => state.inventory);

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
    dispatch(fetchInventoryItems({ itemType: "asset" }));
  }, [dispatch]);

  const openModal = (asset = null) => {
    setEditingAsset(asset);
    if (asset) {
      form.setFieldsValue(asset);
    } else {
      form.setFieldsValue({ quantity: 1, allocated: 0, unit: "pcs" });
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
    } catch (submitError) {
      message.error(submitError || "Unable to save asset");
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
        } catch (deleteError) {
          message.error(deleteError || "Unable to delete asset");
        }
      },
    });
  };

  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((acc, a) => acc + Number(a.quantity || 0), 0);
  const totalAllocated = assets.reduce((acc, a) => acc + Number(a.allocated || 0), 0);
  const totalAvailable = assets.reduce(
    (acc, a) => acc + Number(a.available ?? Math.max(Number(a.quantity || 0) - Number(a.allocated || 0), 0)),
    0
  );

  const columns = [
    { title: "Asset Name", dataIndex: "name", key: "name", render: (v) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span> },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Allocated", dataIndex: "allocated", key: "allocated" },
    {
      title: "Available",
      key: "available",
      render: (_, record) => Number(record.available ?? Math.max(Number(record.quantity || 0) - Number(record.allocated || 0), 0)),
    },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const available = Number(record.available ?? Math.max(Number(record.quantity || 0) - Number(record.allocated || 0), 0));
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
    <div>
      <PageHeader
        title="Assets Management"
        subtitle="Manage high-value assets and keep allocation transparent"
        icon={<DatabaseOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} loading={actionLoading}>
            Add Asset
          </Button>
        }
      />
      <div style={pageWrapper}>

        {error ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} /> : null}

        <div style={statGrid(160)}>
          <StatCard icon={<AppstoreOutlined />} label="Total Assets" value={totalAssets} color="#2563EB" />
          <StatCard icon={<CheckCircleOutlined />} label="Total Available" value={totalAvailable} color="#22C55E" />
          <StatCard icon={<DatabaseOutlined />} label="Total Allocated" value={`${totalAllocated} / ${totalQuantity}`} color="#F59E0B" />
        </div>

        <div style={sectionPanel}>
          <div style={toolbarRow}>
            <Input.Search
              placeholder="Search by asset, category or location"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>

          <style>{tableHeadCss("assets-tbl")}</style>
          <div className="assets-tbl" style={tableContainer}>
            <Table
              columns={columns}
              dataSource={filteredAssets}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: "No assets found. Add your first asset." }}
            />
          </div>
        </div>

        <Modal
          title={modalTitle(editingAsset ? <EditOutlined /> : <PlusOutlined />, editingAsset ? "Edit Asset" : "Add Asset")}
          open={modalOpen}
          onCancel={closeModal}
          footer={null}
          destroyOnClose
        >
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
            <Form.Item
              label="Allocated"
              name="allocated"
              initialValue={0}
              dependencies={["quantity"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const quantity = Number(getFieldValue("quantity") || 0);
                    const allocated = Number(value || 0);
                    if (allocated <= quantity) return Promise.resolve();
                    return Promise.reject(new Error("Allocated cannot be greater than quantity"));
                  },
                }),
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Location" name="location" rules={[{ required: true, message: "Enter location" }]}>
              <Input placeholder="e.g., Physics Lab" />
            </Form.Item>
            <Form.Item label="Unit" name="unit" rules={[{ required: true, message: "Enter unit" }]}>
              <Input placeholder="pcs / set" />
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
      </div>
    </div>
  );
};

export default Assets;
