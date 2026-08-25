import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, DatePicker } from "antd";
import {
  PlusOutlined, DeleteOutlined, ExportOutlined,
  ClockCircleOutlined, WarningOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { fetchStockIssues, createStockIssue, deleteStockIssue } from "../../../features/stockIssueSlice";
import { fetchInventoryItems } from "../../../features/inventorySlice";
import {
  toolbarRow, tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
import dayjs from "dayjs";

const { Option } = Select;
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const STATUS_META = {
  issued:   { color: "var(--primary)", label: "Issued" },
  returned: { color: "var(--success)", label: "Returned" },
  partial:  { color: "var(--warning)", label: "Partial" },
  overdue:  { color: "var(--danger)",  label: "Overdue" },
};

export default function IssuePage() {
  const dispatch = useDispatch();
  const { issues, loading, actionLoading } = useSelector((s) => s.stockIssue);
  const { items } = useSelector((s) => s.inventory);
  const [open, setOpen]             = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchStockIssues()); dispatch(fetchInventoryItems()); }, [dispatch]);

  const availableItems = items.filter((i) => Math.max((i.quantity || 0) - (i.allocated || 0), 0) > 0);
  const totalIssued    = issues.filter((i) => i.status === "issued").length;
  const overdue        = issues.filter((i) => i.isOverdue).length;

  const filtered = issues.filter((i) =>
    (!statusFilter || i.status === statusFilter) &&
    (!search || i.issuedTo?.toLowerCase().includes(search.toLowerCase()) || i.itemName?.toLowerCase().includes(search.toLowerCase()))
  );

  const KPI = [
    { label: "Currently Issued", value: totalIssued,    color: "var(--primary)", icon: <ExportOutlined /> },
    { label: "Overdue Returns",  value: overdue,         color: "var(--danger)", icon: <WarningOutlined /> },
    { label: "Total Records",    value: issues.length,   color: "var(--purple)", icon: <CheckCircleOutlined /> },
  ];

  const onFinish = async (vals) => {
    try {
      const payload = {
        ...vals,
        issueDate:          vals.issueDate?.toISOString(),
        expectedReturnDate: vals.expectedReturnDate?.toISOString() || null,
      };
      await dispatch(createStockIssue(payload)).unwrap();
      message.success("Stock issued successfully");
      setOpen(false); form.resetFields();
    } catch (e) { message.error(e || "Failed to issue stock"); }
  };

  const onDelete = (rec) => {
    Modal.confirm({
      title: "Delete this issue record?", okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => { try { await dispatch(deleteStockIssue(rec._id)).unwrap(); message.success("Deleted"); } catch (e) { message.error(e || "Failed"); } },
    });
  };

  const columns = [
    {
      title: "Issue No.", dataIndex: "issueNumber", key: "issueNumber",
      render: (t) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{t}</span>,
    },
    {
      title: "Item", key: "item",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.itemName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmt(r.quantity)} {r.unit}</div>
        </div>
      ),
    },
    {
      title: "Issued To", key: "issuedTo",
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.issuedTo}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.department || ""}</div>
        </div>
      ),
    },
    {
      title: "Issue Date", key: "issueDate", responsive: ["md"],
      render: (_, r) => r.issueDate ? <span style={{ fontSize: 12 }}>{dayjs(r.issueDate).format("DD MMM YYYY")}</span> : "—",
    },
    {
      title: "Return By", key: "returnBy", responsive: ["md"],
      render: (_, r) => r.expectedReturnDate
        ? <span style={{ fontSize: 12, color: r.isOverdue ? "var(--danger)" : "inherit", fontWeight: r.isOverdue ? 600 : 400 }}>{dayjs(r.expectedReturnDate).format("DD MMM YYYY")}</span>
        : "—",
    },
    {
      title: "Status", key: "status",
      render: (_, r) => {
        const key = r.isOverdue && r.status === "issued" ? "overdue" : r.status;
        const m   = STATUS_META[key] || { color: "var(--text-muted)", label: key };
        return <span style={pill(m.color)}>{m.label}</span>;
      },
    },
    {
      title: "", key: "actions",
      render: (_, r) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
      ),
    },
  ];

  return (
    <div>
      {/* KPI */}
      <div style={statGrid(160)}>
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
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} placeholder="All Status" allowClear>
          <Option value="issued">Issued</Option>
          <Option value="returned">Returned</Option>
          <Option value="partial">Partial</Option>
        </Select>
        <Input.Search
          placeholder="Search by item or person..."
          allowClear
          style={{ width: 250, maxWidth: "100%" }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch("")}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Issue Item</Button>
        </div>
      </div>

      {/* Table */}
      <style>{tableHeadCss("issue-tbl")}</style>
      <div className="issue-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} records` }}
          scroll={{ x: 640 }}
        />
      </div>

      {/* Issue Modal */}
      <Modal
        title={modalTitle(<ExportOutlined />, "Issue Stock Item", "Assign items to staff or departments")}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <Form.Item label="Item" name="inventoryItemId" rules={[{ required: true, message: "Select item" }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select available item" size="large">
              {availableItems.map((i) => {
                const avail = Math.max((i.quantity || 0) - (i.allocated || 0), 0);
                return (
                  <Option key={i._id} value={i._id}>
                    {i.name} — <span style={{ color: "var(--success)", fontWeight: 600 }}>{avail} {i.unit}</span> available
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item label="Quantity" name="quantity" rules={[{ required: true, message: "Enter quantity" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Issued To (Name)" name="issuedTo" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Teacher / Staff name" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Form.Item label="Department" name="department"><Input placeholder="Science / Office" /></Form.Item>
            <Form.Item label="Purpose" name="purpose"><Input placeholder="Lab / General use" /></Form.Item>
            <Form.Item label="Issue Date" name="issueDate" initialValue={dayjs()}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Expected Return" name="expectedReturnDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>Issue</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
