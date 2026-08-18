import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Divider, Tooltip, Tag } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  MinusCircleOutlined, FileTextOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ShoppingCartOutlined, FormOutlined,
} from "@ant-design/icons";
import { fetchPurchaseOrders, createPO, updatePO, updatePOStatus, deletePO } from "../../../features/purchaseOrderSlice";
import { fetchVendors } from "../../../features/vendorSlice";
import {
  toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle,
} from "../../../styles/pageStyles";
import dayjs from "dayjs";

const { Option } = Select;

// `color` is baked into this pill's border as `${m.color}30` — a raw-hex alpha-suffix
// trick that breaks with a var() string, so `color` stays hex. `bg` (used directly, no
// suffix) is safely converted to shared tokens.
const STATUS_META = {
  draft:      { color: "#94A3B8", bg: "var(--surface-soft)", label: "Draft" },
  pending:    { color: "#F59E0B", bg: "var(--warning-light)", label: "Pending" },
  approved:   { color: "#1677ff", bg: "var(--primary-light)", label: "Approved" },
  ordered:    { color: "#8B5CF6", bg: "rgba(var(--purple-rgb), 0.12)", label: "Ordered" },
  partial:    { color: "#F59E0B", bg: "var(--warning-light)", label: "Partial" },
  received:   { color: "#0ea472", bg: "var(--success-light)", label: "Received" },
  cancelled:  { color: "#EF4444", bg: "var(--danger-light)", label: "Cancelled" },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || { color: "#94A3B8", bg: "var(--surface-soft)", label: status };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", background: m.bg, color: m.color, borderRadius: 99, fontSize: 12, fontWeight: 600, border: `1px solid ${m.color}30` }}>
      {m.label}
    </span>
  );
};

export default function PurchaseOrderPage() {
  const dispatch = useDispatch();
  const { orders, loading, actionLoading } = useSelector((s) => s.purchaseOrder);
  const { vendors } = useSelector((s) => s.vendor);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewOrder,  setViewOrder]  = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchPurchaseOrders()); dispatch(fetchVendors()); }, [dispatch]);

  const closeFormModal = () => {
    setCreateOpen(false);
    setEditingOrder(null);
    form.resetFields();
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      vendorId: order.vendorId?._id || order.vendorId,
      expectedDate: order.expectedDate ? dayjs(order.expectedDate).format("YYYY-MM-DD") : undefined,
      taxRate: order.taxRate || 0,
      notes: order.notes,
      items: order.items?.length ? order.items : [{ itemName: "", quantity: 1, unit: "pcs", unitPrice: 0 }],
    });
    setCreateOpen(true);
  };

  const onCreateFinish = async (vals) => {
    try {
      const items = (vals.items || []).map((i) => ({ ...i, totalPrice: i.quantity * i.unitPrice }));
      if (editingOrder) {
        await dispatch(updatePO({ id: editingOrder._id, ...vals, items })).unwrap();
        message.success("Purchase order updated");
      } else {
        await dispatch(createPO({ ...vals, items })).unwrap();
        message.success("Purchase order created");
      }
      closeFormModal();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onStatusChange = async (status) => {
    try {
      await dispatch(updatePOStatus({ id: statusModal._id, status })).unwrap();
      message.success(`Status updated to ${status}`);
      setStatusModal(null);
    } catch (e) { message.error(e || "Failed"); }
  };

  const onDelete = (o) => {
    Modal.confirm({
      title: "Delete this purchase order?",
      content: "Only draft orders can be deleted.",
      okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deletePO(o._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const totalValue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  // `color` feeds the shared iconWell() helper (frontend/src/styles/pageStyles.js), which
  // builds its background as `${color}22` — breaks with a var() string, so these stay hex.
  const KPI = [
    { label: "Draft",      value: orders.filter((o) => o.status === "draft").length,      color: "#94A3B8", icon: <FileTextOutlined /> },
    { label: "Pending",    value: orders.filter((o) => o.status === "pending").length,    color: "#F59E0B", icon: <ClockCircleOutlined /> },
    { label: "Approved",   value: orders.filter((o) => o.status === "approved").length,   color: "#1677ff", icon: <CheckCircleOutlined /> },
    { label: "Total Value",value: fmt(totalValue),                                         color: "#0ea472", icon: <ShoppingCartOutlined /> },
  ];

  const columns = [
    {
      title: "PO Number", key: "po",
      render: (_, r) => (
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.poNumber}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.createdAt ? dayjs(r.createdAt).format("DD MMM YYYY") : "—"}</div>
        </div>
      ),
    },
    {
      title: "Vendor", key: "vendor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={iconWell("#8B5CF6", 30)}>
            <ShoppingCartOutlined style={{ fontSize: 12 }} />
          </div>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.vendorId?.name || "—"}</span>
        </div>
      ),
    },
    {
      title: "Items / Total", key: "total",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{fmt(r.totalAmount)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.items?.length || 0} line items</div>
        </div>
      ),
    },
    { title: "Status", key: "status", render: (_, r) => <StatusPill status={r.status} /> },
    {
      title: "Actions", key: "actions",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Tooltip title="View"><Button size="small" icon={<EyeOutlined />} onClick={() => setViewOrder(r)} /></Tooltip>
          {!["received", "cancelled"].includes(r.status) && (
            <>
              <Tooltip title="Edit Order"><Button size="small" icon={<FormOutlined />} onClick={() => openEditModal(r)} /></Tooltip>
              <Tooltip title="Update Status"><Button size="small" icon={<EditOutlined />} onClick={() => setStatusModal(r)} /></Tooltip>
            </>
          )}
          {r.status === "draft" && (
            <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} /></Tooltip>
          )}
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
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New Purchase Order</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("po-tbl")}</style>
      <div className="po-tbl" style={tableContainer}>
        <Table columns={columns} dataSource={orders} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 640 }} />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={modalTitle(
          <FileTextOutlined />,
          editingOrder ? `Edit ${editingOrder.poNumber}` : "New Purchase Order",
          editingOrder ? "Update this purchase order" : "Create a purchase order for a vendor"
        )}
        open={createOpen}
        onCancel={closeFormModal}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onCreateFinish} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Vendor" name="vendorId" rules={[{ required: true, message: "Select vendor" }]}>
              <Select showSearch optionFilterProp="children" placeholder="Select vendor">
                {vendors.filter((v) => v.isActive).map((v) => <Option key={v._id} value={v._id}>{v.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Expected Delivery" name="expectedDate"><Input type="date" /></Form.Item>
            <Form.Item label="Tax Rate (%)" name="taxRate" initialValue={0}><InputNumber min={0} max={100} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Notes" name="notes"><Input.TextArea rows={1} /></Form.Item>
          </div>

          <Divider style={{ color: "var(--text-muted)", fontSize: 12 }}>Line Items</Divider>

          <Form.List name="items" initialValue={[{ itemName: "", quantity: 1, unit: "pcs", unitPrice: 0 }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 2fr auto", gap: 8, marginBottom: 8, alignItems: "start" }}>
                    <Form.Item {...rest} name={[name, "itemName"]} style={{ margin: 0 }} rules={[{ required: true, message: "Name" }]}>
                      <Input placeholder="Item name" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "quantity"]} style={{ margin: 0 }}>
                      <InputNumber min={1} style={{ width: "100%" }} placeholder="Qty" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "unit"]} style={{ margin: 0 }}>
                      <Input placeholder="pcs" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "unitPrice"]} style={{ margin: 0 }}>
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="Unit ₹" />
                    </Form.Item>
                    <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} size="small" style={{ marginTop: 4 }} />
                  </div>
                ))}
                <Button type="dashed" onClick={() => add({ quantity: 1, unit: "pcs", unitPrice: 0 })} block icon={<PlusOutlined />} style={{ marginBottom: 4 }}>
                  Add Line Item
                </Button>
              </>
            )}
          </Form.List>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <Button onClick={closeFormModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>{editingOrder ? "Save Changes" : "Create PO"}</Button>
          </div>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title={modalTitle(<EyeOutlined />, viewOrder?.poNumber || "Purchase Order", "Order details")}
        open={!!viewOrder}
        onCancel={() => setViewOrder(null)}
        footer={<Button onClick={() => setViewOrder(null)}>Close</Button>}
        width={640}
      >
        {viewOrder && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                ["Vendor",   viewOrder.vendorId?.name || "—"],
                ["Status",   <StatusPill status={viewOrder.status} />],
                ["Subtotal", fmt(viewOrder.subtotal)],
                [`Tax (${viewOrder.taxRate || 0}%)`, fmt(viewOrder.taxAmount)],
                ["Total",    <strong>{fmt(viewOrder.totalAmount)}</strong>],
                ["Expected", viewOrder.expectedDate ? dayjs(viewOrder.expectedDate).format("DD MMM YYYY") : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "10px 14px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border-muted)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                  <div style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
            <style>{tableHeadCss("po-view-tbl")}</style>
            <div className="po-view-tbl" style={tableContainer}>
              <Table
                size="small"
                dataSource={viewOrder.items}
                rowKey="itemName"
                pagination={false}
                columns={[
                  { title: "Item",       dataIndex: "itemName" },
                  { title: "Qty",        dataIndex: "quantity" },
                  { title: "Unit",       dataIndex: "unit" },
                  { title: "Unit Price", dataIndex: "unitPrice",  render: fmt },
                  { title: "Total",      dataIndex: "totalPrice", render: fmt },
                ]}
              />
            </div>
            {viewOrder.notes && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>Notes: {viewOrder.notes}</p>}
          </div>
        )}
      </Modal>

      {/* Status Modal */}
      <Modal
        title={modalTitle(<EditOutlined />, "Update PO Status", statusModal ? `Current: ${STATUS_META[statusModal.status]?.label || statusModal.status}` : "")}
        open={!!statusModal}
        onCancel={() => setStatusModal(null)}
        footer={null}
      >
        {statusModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {["pending", "approved", "ordered", "partial", "received", "cancelled"].map((s) => {
              const m = STATUS_META[s] || {};
              return (
                <Button
                  key={s}
                  block
                  onClick={() => onStatusChange(s)}
                  loading={actionLoading}
                  style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 10, height: 44, borderRadius: 10 }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{m.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
