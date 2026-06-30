import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Tooltip, Typography } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined,
  CheckCircleOutlined, ShopOutlined, UserOutlined,
} from "@ant-design/icons";
import { fetchVendors, createVendor, updateVendor, toggleVendor, deleteVendor } from "../../../features/vendorSlice";
import {
  sectionPanel, toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
import { useTheme } from "../../../context/ThemeContext";

const { Option } = Select;
const { Text } = Typography;
const CATEGORIES = ["General", "Stationery", "Electronics", "Furniture", "IT", "Lab Equipment", "Sports", "Housekeeping", "Catering"];

const KPI_DEFS = (vendors) => [
  { label: "Total Vendors",  value: vendors.length,                          color: "#1677ff", icon: <ShopOutlined /> },
  { label: "Active",         value: vendors.filter((v) => v.isActive).length,  color: "#0ea472", icon: <CheckCircleOutlined /> },
  { label: "Inactive",       value: vendors.filter((v) => !v.isActive).length, color: "#EF4444", icon: <StopOutlined /> },
  { label: "Categories",     value: new Set(vendors.map((v) => v.category)).size, color: "#8B5CF6", icon: <UserOutlined /> },
];

export default function VendorPage() {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { vendors, loading, actionLoading } = useSelector((s) => s.vendor);
  const [open, setOpen]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState("");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  const openModal = (v = null) => {
    setEditing(v);
    form.setFieldsValue(v || { category: "General", isActive: true });
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); form.resetFields(); };

  const onFinish = async (vals) => {
    try {
      if (editing) { await dispatch(updateVendor({ id: editing._id, ...vals })).unwrap(); message.success("Vendor updated"); }
      else         { await dispatch(createVendor(vals)).unwrap(); message.success("Vendor added"); }
      closeModal();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onToggle = async (v) => {
    try { await dispatch(toggleVendor(v._id)).unwrap(); message.success(`Vendor ${v.isActive ? "deactivated" : "activated"}`); }
    catch (e) { message.error(e || "Failed"); }
  };

  const onDelete = (v) => {
    Modal.confirm({
      title: `Delete "${v.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deleteVendor(v._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const filtered = vendors.filter((v) =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Vendor", key: "vendor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...iconWell("#1677ff", 34), flexShrink: 0 }}>
            <ShopOutlined style={{ fontSize: 14 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact", key: "contact",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.contactPerson || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.phone || ""}</div>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email", responsive: ["md"],
      render: (t) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t || "—"}</span> },
    { title: "GST No.", dataIndex: "gstNumber", key: "gstNumber", responsive: ["lg"],
      render: (t) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{t || "—"}</span> },
    {
      title: "Status", key: "status",
      render: (_, r) => (
        <span style={pill(r.isActive ? "#0ea472" : "#EF4444")}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions", key: "actions",
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          <Tooltip title={r.isActive ? "Deactivate" : "Activate"}>
            <Button size="small" icon={r.isActive ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => onToggle(r)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div style={statGrid(140)}>
        {KPI_DEFS(vendors).map((k) => (
          <div key={k.label} style={{ padding: "16px 20px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border-muted)", borderLeft: `4px solid ${k.color}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={iconWell(k.color, 38)}>{React.cloneElement(k.icon, { style: { fontSize: 16 } })}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarRow}>
        <Input.Search
          placeholder="Search vendors or contact..."
          allowClear
          style={{ width: 260, maxWidth: "100%" }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch("")}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Vendor</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("vendor-tbl")}</style>
      <div className="vendor-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} vendors` }}
          scroll={{ x: 640 }}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={modalTitle(<ShopOutlined />, editing ? "Edit Vendor" : "Add Vendor", editing ? "Update vendor details" : "Register a new supplier or service provider")}
        open={open}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Vendor Name" name="name" rules={[{ required: true, message: "Required" }]} style={{ gridColumn: "1 / -1" }}>
              <Input placeholder="e.g. ABC Supplies Co." size="large" />
            </Form.Item>
            <Form.Item label="Contact Person" name="contactPerson"><Input /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input /></Form.Item>
            <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Invalid email" }]}><Input /></Form.Item>
            <Form.Item label="Category" name="category" initialValue="General">
              <Select>{CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
            </Form.Item>
            <Form.Item label="GST Number" name="gstNumber"><Input placeholder="22AAAAA0000A1Z5" /></Form.Item>
            <Form.Item label="Bank Account No." name="bankAccount"><Input /></Form.Item>
            <Form.Item label="IFSC Code" name="ifscCode"><Input /></Form.Item>
            <Form.Item label="Address" name="address" style={{ gridColumn: "1 / -1" }}>
              <Input.TextArea rows={2} placeholder="Full address" />
            </Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>{editing ? "Update Vendor" : "Add Vendor"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
