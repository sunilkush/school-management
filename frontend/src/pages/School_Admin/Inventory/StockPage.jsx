import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Progress, Typography } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  AppstoreOutlined, WarningOutlined, CheckCircleOutlined, InboxOutlined,
} from "@ant-design/icons";
import {
  fetchInventoryItems, createInventoryItem,
  updateInventoryItem, deleteInventoryItem,
} from "../../../features/inventorySlice";
import {
  toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
const { Option } = Select;
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const CATEGORIES = ["Stationery", "Hygiene", "Electronics", "Furniture", "Lab Equipment", "Sports", "Housekeeping", "General"];

export default function StockPage() {
  const dispatch = useDispatch();
  const { items, loading, actionLoading } = useSelector((s) => s.inventory);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("supply");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchInventoryItems()); }, [dispatch]);

  const stock    = items.filter((i) => i.itemType === typeFilter);
  const filtered = stock.filter((i) =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = stock.filter((i) => (i.quantity || 0) <= (i.minThreshold || 10)).length;
  const totalQty      = stock.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalAvail    = stock.reduce((s, i) => s + Math.max((i.quantity || 0) - (i.allocated || 0), 0), 0);

  const KPI = [
    { label: "Total Items",   value: stock.length,         color: "var(--primary)",  icon: <AppstoreOutlined /> },
    { label: "Low Stock",     value: lowStockCount,        color: "var(--danger)",  icon: <WarningOutlined /> },
    { label: "Total Qty",     value: fmt(totalQty),        color: "var(--purple)",  icon: <InboxOutlined /> },
    { label: "Available",     value: fmt(totalAvail),      color: "var(--success)",  icon: <CheckCircleOutlined /> },
  ];

  const openModal = (item = null) => {
    setEditing(item);
    form.setFieldsValue(item || { quantity: 0, allocated: 0, minThreshold: 10, unit: "pcs" });
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); form.resetFields(); };

  const onFinish = async (vals) => {
    try {
      const payload = { ...vals, itemType: typeFilter };
      if (editing) { await dispatch(updateInventoryItem({ id: editing._id, payload })).unwrap(); message.success("Updated"); }
      else         { await dispatch(createInventoryItem(payload)).unwrap(); message.success("Item added"); }
      closeModal();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onDelete = (item) => {
    Modal.confirm({
      title: `Delete "${item.name}"?`, okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deleteInventoryItem(item._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const columns = [
    {
      title: "Item", key: "item",
      render: (_, r) => {
        const isLow = (r.quantity || 0) <= (r.minThreshold || 10);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell(isLow ? "var(--danger)" : "var(--primary)", 34)}>
              {isLow ? <WarningOutlined style={{ fontSize: 13 }} /> : <InboxOutlined style={{ fontSize: 13 }} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.category}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Stock Level", key: "stock",
      render: (_, r) => {
        const avail = Math.max((r.quantity || 0) - (r.allocated || 0), 0);
        const pct   = r.quantity ? Math.round((avail / r.quantity) * 100) : 0;
        const color = pct < 20 ? "var(--danger)" : pct < 50 ? "var(--warning)" : "var(--success)";
        return (
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4 }}>
              <strong>{fmt(avail)}</strong>
              <span style={{ color: "var(--text-muted)" }}> / {fmt(r.quantity)} {r.unit}</span>
            </div>
            <Progress percent={pct} size="small" showInfo={false} strokeColor={color} trailColor="var(--border-muted)" />
          </div>
        );
      },
    },
    { title: "Allocated", key: "allocated", render: (_, r) => <span style={{ fontSize: 12 }}>{fmt(r.allocated)} {r.unit}</span>, responsive: ["md"] },
    { title: "Location",  dataIndex: "location", key: "location", responsive: ["lg"],
      render: (t) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t || "—"}</span> },
    {
      title: "Status", key: "status",
      render: (_, r) => {
        const low = (r.quantity || 0) <= (r.minThreshold || 10);
        return <span style={pill(low ? "var(--danger)" : "var(--success)")}>{low ? "Low Stock" : "Healthy"}</span>;
      },
    },
    {
      title: "", key: "actions",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* KPI */}
      <div style={statGrid(140)}>
        {KPI.map((k) => (
          <div key={k.label} style={{ padding: "16px 20px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border-muted)", borderLeft: `4px solid ${k.color}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={iconWell(k.color, 38)}>{React.cloneElement(k.icon, { style: { fontSize: 16 } })}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarRow}>
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }}>
          <Option value="supply">Supplies</Option>
          <Option value="asset">Assets</Option>
        </Select>
        <Input.Search
          placeholder="Search items or category..."
          allowClear
          style={{ width: 250, maxWidth: "100%" }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch("")}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Item</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("stock-tbl")}</style>
      <div className="stock-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} items` }}
          scroll={{ x: 640 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={modalTitle(<InboxOutlined />, editing ? "Edit Stock Item" : "Add Stock Item", "Manage inventory quantity and thresholds")}
        open={open}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <Form.Item label="Item Name" name="name" rules={[{ required: true, message: "Required" }]}>
            <Input size="large" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item label="Category" name="category" initialValue="General">
              <Select>{CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
            </Form.Item>
            <Form.Item label="Unit" name="unit" initialValue="pcs"><Input placeholder="pcs / box / kg" /></Form.Item>
            <Form.Item label="Total Quantity" name="quantity" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Allocated" name="allocated" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Low Stock Alert (min)" name="minThreshold" initialValue={10}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Location" name="location"><Input placeholder="Room / Store" /></Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>{editing ? "Update" : "Add Item"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
