import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, DatePicker, Tag } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  DesktopOutlined, WarningOutlined, DollarOutlined, StopOutlined,
} from "@ant-design/icons";
import {
  fetchInventoryItems, createInventoryItem,
  updateInventoryItem, deleteInventoryItem,
} from "../../../features/inventorySlice";
import { fetchVendors } from "../../../features/vendorSlice";
import {
  toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
import dayjs from "dayjs";

const { Option } = Select;
const CATEGORIES  = ["Electronics", "Furniture", "Lab Equipment", "Sports Equipment", "Musical Instruments", "Vehicles", "IT Hardware", "General"];
// `color` feeds the shared iconWell()/pill() helpers (frontend/src/styles/pageStyles.js),
// which bake it into an alpha-suffixed string (`${color}NN`) — breaks with a var() string,
// so these stay hex. Same applies to the KPI array below.
const COND_COLOR  = { new: "#1677ff", good: "#0ea472", fair: "#F59E0B", poor: "#EF4444", disposed: "#94A3B8" };

export default function AssetManagementPage() {
  const dispatch = useDispatch();
  const { items, loading, actionLoading } = useSelector((s) => s.inventory);
  const { vendors } = useSelector((s) => s.vendor);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState("");
  const [condFilter, setCondFilter] = useState("");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchInventoryItems({ itemType: "asset" })); dispatch(fetchVendors()); }, [dispatch]);

  const assets   = items.filter((i) => i.itemType === "asset");
  const filtered = assets.filter((i) =>
    (!condFilter || i.condition === condFilter) &&
    (!search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.serialNumber?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalValue   = assets.reduce((s, a) => s + (a.purchasePrice || 0), 0);
  const expiringSoon = assets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const d = dayjs(a.warrantyExpiry).diff(dayjs(), "day");
    return d >= 0 && d <= 30;
  }).length;

  const KPI = [
    { label: "Total Assets",      value: assets.length,                                    color: "#1677ff",  icon: <DesktopOutlined /> },
    { label: "Total Value",       value: `₹${Number(totalValue).toLocaleString("en-IN")}`, color: "#0ea472",  icon: <DollarOutlined /> },
    { label: "Warranty Expiring", value: expiringSoon,                                      color: "#F59E0B",  icon: <WarningOutlined /> },
    { label: "Disposed",          value: assets.filter((a) => a.condition === "disposed").length, color: "#94A3B8", icon: <StopOutlined /> },
  ];

  const openModal = (item = null) => {
    setEditing(item);
    form.setFieldsValue(item
      ? { ...item, purchaseDate: item.purchaseDate ? dayjs(item.purchaseDate) : null, warrantyExpiry: item.warrantyExpiry ? dayjs(item.warrantyExpiry) : null }
      : { quantity: 1, allocated: 0, unit: "pcs", condition: "new" }
    );
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); form.resetFields(); };

  const onFinish = async (vals) => {
    try {
      const payload = {
        ...vals, itemType: "asset",
        purchaseDate:   vals.purchaseDate?.toISOString() || null,
        warrantyExpiry: vals.warrantyExpiry?.toISOString() || null,
      };
      if (editing) { await dispatch(updateInventoryItem({ id: editing._id, payload })).unwrap(); message.success("Asset updated"); }
      else         { await dispatch(createInventoryItem(payload)).unwrap(); message.success("Asset added"); }
      closeModal();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onDelete = (item) => {
    Modal.confirm({
      title: `Delete "${item.name}"?`, okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deleteInventoryItem(item._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const warrantyCell = (a) => {
    if (!a.warrantyExpiry) return <span style={{ color: "var(--text-muted)" }}>—</span>;
    const days    = dayjs(a.warrantyExpiry).diff(dayjs(), "day");
    const expired = days < 0;
    const soon    = days >= 0 && days <= 30;
    return (
      <div>
        <span style={{ fontSize: 12, color: expired ? "var(--danger)" : soon ? "var(--warning)" : "var(--text-primary)", fontWeight: (expired || soon) ? 600 : 400 }}>
          {dayjs(a.warrantyExpiry).format("DD MMM YYYY")}
        </span>
        {expired && <div style={{ fontSize: 10, color: "var(--danger)" }}>Expired</div>}
        {soon    && <div style={{ fontSize: 10, color: "var(--warning)" }}>{days}d left ⚠</div>}
      </div>
    );
  };

  const columns = [
    {
      title: "Asset", key: "asset",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconWell(COND_COLOR[r.condition] || "#1677ff", 34)}>
            <DesktopOutlined style={{ fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.name}</div>
            {r.serialNumber && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>S/N: {r.serialNumber}</div>}
          </div>
        </div>
      ),
    },
    {
      title: "Condition", key: "condition",
      render: (_, r) => (
        <span style={pill(COND_COLOR[r.condition] || "#94A3B8")}>{(r.condition || "—").toUpperCase()}</span>
      ),
    },
    {
      title: "Purchase", key: "purchase", responsive: ["md"],
      render: (_, r) => (
        <div>
          {r.purchasePrice ? <div style={{ fontWeight: 700, fontSize: 13 }}>₹{Number(r.purchasePrice).toLocaleString("en-IN")}</div> : null}
          {r.purchaseDate  ? <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dayjs(r.purchaseDate).format("DD MMM YYYY")}</div> : null}
        </div>
      ),
    },
    { title: "Warranty", key: "warranty", responsive: ["lg"], render: (_, r) => warrantyCell(r) },
    {
      title: "Assigned To", dataIndex: "assignedTo", key: "assignedTo", responsive: ["lg"],
      render: (t) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t || "—"}</span>,
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
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarRow}>
        <Select value={condFilter} onChange={setCondFilter} style={{ width: 150 }} placeholder="All Conditions" allowClear>
          {["new", "good", "fair", "poor", "disposed"].map((c) => (
            <Option key={c} value={c}>
              <span style={{ color: COND_COLOR[c] || "#333", fontWeight: 600 }}>{c.toUpperCase()}</span>
            </Option>
          ))}
        </Select>
        <Input.Search
          placeholder="Search name or serial no..."
          allowClear
          style={{ width: 260, maxWidth: "100%" }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch("")}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Asset</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("asset-tbl")}</style>
      <div className="asset-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} assets` }}
          scroll={{ x: 700 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={modalTitle(<DesktopOutlined />, editing ? "Edit Asset" : "Add Asset", "Track physical assets, warranties and assignments")}
        open={open}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <Form.Item label="Asset Name" name="name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Category" name="category" initialValue="Electronics">
              <Select>{CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
            </Form.Item>
            <Form.Item label="Condition" name="condition" initialValue="new">
              <Select>
                {["new", "good", "fair", "poor", "disposed"].map((c) => (
                  <Option key={c} value={c}><span style={{ color: COND_COLOR[c] }}>{c.toUpperCase()}</span></Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Quantity" name="quantity" initialValue={1}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Unit" name="unit" initialValue="pcs"><Input /></Form.Item>
            <Form.Item label="Serial Number" name="serialNumber"><Input placeholder="SN-XXXXX" /></Form.Item>
            <Form.Item label="Location" name="location"><Input placeholder="Lab / Classroom" /></Form.Item>
            <Form.Item label="Purchase Price (₹)" name="purchasePrice"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Purchase Date" name="purchaseDate"><DatePicker style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Warranty Expiry" name="warrantyExpiry"><DatePicker style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Vendor" name="vendorId">
              <Select allowClear placeholder="Select vendor">
                {vendors.map((v) => <Option key={v._id} value={v._id}>{v.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Assigned To" name="assignedTo" style={{ gridColumn: "1 / -1" }}>
              <Input placeholder="Person / Department" />
            </Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>{editing ? "Update Asset" : "Add Asset"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
