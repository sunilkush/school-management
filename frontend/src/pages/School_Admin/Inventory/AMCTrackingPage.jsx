import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, DatePicker, Timeline } from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, CalendarOutlined,
} from "@ant-design/icons";
import { fetchAMCs, createAMC, updateAMC, addServiceLog, deleteAMC } from "../../../features/amcSlice";
import { fetchInventoryItems } from "../../../features/inventorySlice";
import { fetchVendors } from "../../../features/vendorSlice";
import {
  toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
import dayjs from "dayjs";

const { Option } = Select;

// `color` feeds the shared iconWell()/pill() helpers (frontend/src/styles/pageStyles.js),
// which bake it into an alpha-suffixed string (`${color}NN`) — breaks with a var() string,
// so these stay hex. Same applies to the KPI array below.
const STATUS_META = {
  active:         { color: "#0ea472",  icon: <CheckCircleOutlined />, label: "Active" },
  expired:        { color: "#EF4444",  icon: <CloseCircleOutlined />, label: "Expired" },
  expiring_soon:  { color: "#F59E0B",  icon: <WarningOutlined />,    label: "Expiring Soon" },
  upcoming:       { color: "#1677ff",  icon: <CalendarOutlined />,    label: "Upcoming" },
};

export default function AMCTrackingPage() {
  const dispatch = useDispatch();
  const { amcs, loading, actionLoading } = useSelector((s) => s.amc);
  const { items: inventoryItems }        = useSelector((s) => s.inventory);
  const { vendors }                      = useSelector((s) => s.vendor);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(null);
  const [logModal, setLogModal]   = useState(null);
  const [viewLogs, setViewLogs]   = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [form]    = Form.useForm();
  const [logForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAMCs());
    dispatch(fetchInventoryItems({ itemType: "asset" }));
    dispatch(fetchVendors());
  }, [dispatch]);

  const assets = inventoryItems.filter((i) => i.itemType === "asset");

  const openModal = (amc = null) => {
    setEditing(amc);
    form.setFieldsValue(amc
      ? { ...amc,
          startDate:       amc.startDate       ? dayjs(amc.startDate)       : null,
          endDate:         amc.endDate         ? dayjs(amc.endDate)         : null,
          nextServiceDate: amc.nextServiceDate  ? dayjs(amc.nextServiceDate)  : null,
        }
      : { serviceType: "comprehensive", cost: 0 }
    );
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); form.resetFields(); };

  const onFinish = async (vals) => {
    try {
      const payload = {
        ...vals,
        startDate:       vals.startDate?.toISOString(),
        endDate:         vals.endDate?.toISOString(),
        nextServiceDate: vals.nextServiceDate?.toISOString() || null,
      };
      if (editing) { await dispatch(updateAMC({ id: editing._id, ...payload })).unwrap(); message.success("AMC updated"); }
      else         { await dispatch(createAMC(payload)).unwrap(); message.success("AMC contract added"); }
      closeModal();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onAddLog = async (vals) => {
    try {
      await dispatch(addServiceLog({ id: logModal._id, ...vals, date: vals.date?.toISOString() })).unwrap();
      message.success("Service log added");
      setLogModal(null); logForm.resetFields();
    } catch (e) { message.error(e || "Failed"); }
  };

  const onDelete = (amc) => {
    Modal.confirm({
      title: "Delete this AMC contract?", okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deleteAMC(amc._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const filtered = amcs.filter((a) => !statusFilter || (a.computedStatus || a.status) === statusFilter);

  const activeCount  = amcs.filter((a) => (a.computedStatus || a.status) === "active").length;
  const expiring     = amcs.filter((a) => (a.computedStatus || a.status) === "expiring_soon").length;
  const expired      = amcs.filter((a) => (a.computedStatus || a.status) === "expired").length;

  const KPI = [
    { label: "Active",         value: activeCount,  color: "#0ea472", icon: <CheckCircleOutlined /> },
    { label: "Expiring Soon",  value: expiring,     color: "#F59E0B", icon: <WarningOutlined /> },
    { label: "Expired",        value: expired,      color: "#EF4444", icon: <CloseCircleOutlined /> },
    { label: "Total Contracts",value: amcs.length,  color: "#1677ff", icon: <ToolOutlined /> },
  ];

  const columns = [
    {
      title: "Asset / Contract", key: "asset",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconWell(STATUS_META[r.computedStatus || r.status]?.color || "#1677ff", 34)}>
            <ToolOutlined style={{ fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.assetName}</div>
            {r.contractNumber && <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{r.contractNumber}</div>}
          </div>
        </div>
      ),
    },
    {
      title: "Vendor", key: "vendor", responsive: ["md"],
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.vendorId?.name || "—"}</span>,
    },
    {
      title: "Period", key: "period",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
            {dayjs(r.startDate).format("DD MMM YY")} → {dayjs(r.endDate).format("DD MMM YY")}
          </div>
          {r.daysRemaining > 0 && (
            <div style={{ fontSize: 11, color: r.daysRemaining <= 30 ? "var(--warning)" : "var(--text-muted)" }}>
              {r.daysRemaining} days left
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Cost", key: "cost", responsive: ["md"],
      render: (_, r) => <span style={{ fontWeight: 600, fontSize: 13 }}>₹{Number(r.cost || 0).toLocaleString("en-IN")}</span>,
    },
    {
      title: "Status", key: "status",
      render: (_, r) => {
        const st  = r.computedStatus || r.status;
        const m   = STATUS_META[st] || { color: "#94A3B8", label: st };
        return <span style={pill(m.color)}>{m.label || st}</span>;
      },
    },
    {
      title: "Actions", key: "actions",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Button size="small" icon={<ToolOutlined />} onClick={() => setLogModal(r)} title="Add Service Log" />
          {r.serviceLogs?.length > 0 && (
            <Button size="small" onClick={() => setViewLogs(r)} style={{ fontSize: 11 }}>
              Logs ({r.serviceLogs.length})
            </Button>
          )}
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
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }} placeholder="All Status" allowClear>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <Option key={k} value={k}><span style={{ color: m.color, fontWeight: 500 }}>{m.label}</span></Option>
          ))}
        </Select>
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add AMC</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("amc-tbl")}</style>
      <div className="amc-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} contracts` }}
          scroll={{ x: 700 }}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={modalTitle(<ToolOutlined />, editing ? "Edit AMC" : "Add AMC Contract", "Annual maintenance contract for an asset")}
        open={open}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="Asset" name="assetId" rules={[{ required: true, message: "Select asset" }]}>
              <Select showSearch optionFilterProp="children" placeholder="Select asset"
                onChange={(_, opt) => form.setFieldValue("assetName", opt?.children)}>
                {assets.map((a) => <Option key={a._id} value={a._id}>{a.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Asset Name (display)" name="assetName" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Vendor" name="vendorId">
              <Select allowClear placeholder="Select vendor">
                {vendors.map((v) => <Option key={v._id} value={v._id}>{v.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Contract Number" name="contractNumber"><Input /></Form.Item>
            <Form.Item label="Service Type" name="serviceType" initialValue="comprehensive">
              <Select>
                <Option value="comprehensive">Comprehensive</Option>
                <Option value="non-comprehensive">Non-Comprehensive</Option>
                <Option value="partial">Partial</Option>
                <Option value="warranty">Warranty</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Annual Cost (₹)" name="cost" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="End Date" name="endDate" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Next Service Date" name="nextServiceDate"><DatePicker style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>{editing ? "Update AMC" : "Add AMC"}</Button>
          </div>
        </Form>
      </Modal>

      {/* Service Log Modal */}
      <Modal
        title={modalTitle(<ToolOutlined />, "Add Service Log", logModal?.assetName)}
        open={!!logModal}
        onCancel={() => { setLogModal(null); logForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={logForm} layout="vertical" onFinish={onAddLog} style={{ marginTop: 16 }}>
          <Form.Item label="Service Date" name="date" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item label="Technician" name="technician"><Input /></Form.Item>
            <Form.Item label="Cost (₹)" name="cost" initialValue={0}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={() => { setLogModal(null); logForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>Add Log</Button>
          </div>
        </Form>
      </Modal>

      {/* View Logs Modal */}
      <Modal
        title={modalTitle(<CalendarOutlined />, "Service Logs", viewLogs?.assetName)}
        open={!!viewLogs}
        onCancel={() => setViewLogs(null)}
        footer={<Button onClick={() => setViewLogs(null)}>Close</Button>}
        width={500}
      >
        {viewLogs?.serviceLogs?.length > 0 ? (
          <div style={{ marginTop: 16, paddingLeft: 8 }}>
            <Timeline
              items={viewLogs.serviceLogs.map((l) => ({
                color: "var(--primary)",
                children: (
                  <div style={{ padding: "8px 12px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border-muted)", marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{dayjs(l.date).format("DD MMM YYYY")}</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 3 }}>{l.description}</div>
                    {l.technician && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>By: {l.technician}</div>}
                    {l.cost > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Cost: ₹{l.cost.toLocaleString("en-IN")}</div>}
                  </div>
                ),
              }))}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>No service logs yet.</div>
        )}
      </Modal>
    </div>
  );
}
