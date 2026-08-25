import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Modal, Form, InputNumber, Select, message, Alert } from "antd";
import {
  RollbackOutlined, WarningOutlined,
  ImportOutlined, ClockCircleOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { fetchStockIssues, processReturn } from "../../../features/stockIssueSlice";
import {
  tableContainer, tableHeadCss,
  statGrid, iconWell, modalTitle, pill,
} from "../../../styles/pageStyles";
import dayjs from "dayjs";

const { Option } = Select;

export default function ReturnPage() {
  const dispatch = useDispatch();
  const { issues, loading, actionLoading } = useSelector((s) => s.stockIssue);
  const [returnModal, setReturnModal] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchStockIssues()); }, [dispatch]);

  const returnable   = issues.filter((i) => ["issued", "partial"].includes(i.status));
  const overdueCount = returnable.filter((i) => i.isOverdue).length;
  const returnedToday = issues.filter(
    (i) => i.status === "returned" && i.returnDate && dayjs(i.returnDate).isSame(dayjs(), "day")
  ).length;

  const KPI = [
    { label: "Pending Returns",  value: returnable.length, color: "var(--primary)", icon: <ImportOutlined /> },
    { label: "Overdue",          value: overdueCount,       color: "var(--danger)", icon: <WarningOutlined /> },
    { label: "Returned Today",   value: returnedToday,      color: "var(--success)", icon: <CheckCircleOutlined /> },
  ];

  const openReturn = (rec) => {
    setReturnModal(rec);
    form.setFieldsValue({ returnedQuantity: rec.quantity - (rec.returnedQuantity || 0), condition: "good" });
  };

  const onReturn = async (vals) => {
    try {
      await dispatch(processReturn({ id: returnModal._id, ...vals })).unwrap();
      message.success("Return processed");
      setReturnModal(null); form.resetFields();
    } catch (e) { message.error(e || "Failed"); }
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
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.issuedTo}</div>
        </div>
      ),
    },
    {
      title: "Qty Pending", key: "qty",
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {r.quantity - (r.returnedQuantity || 0)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}> / {r.quantity} {r.unit}</span>
        </div>
      ),
    },
    {
      title: "Due Date", key: "due", responsive: ["md"],
      render: (_, r) => r.expectedReturnDate
        ? (
          <span style={{ fontSize: 12, color: r.isOverdue ? "var(--danger)" : "inherit", fontWeight: r.isOverdue ? 700 : 400 }}>
            {r.isOverdue && <WarningOutlined style={{ marginRight: 4 }} />}
            {dayjs(r.expectedReturnDate).format("DD MMM YYYY")}
          </span>
        )
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Status", key: "status",
      render: (_, r) => {
        const key   = r.isOverdue && r.status === "issued" ? "overdue" : r.status;
        const color = key === "overdue" ? "var(--danger)" : key === "partial" ? "var(--warning)" : "var(--primary)";
        return <span style={pill(color)}>{key.toUpperCase()}</span>;
      },
    },
    {
      title: "Action", key: "action",
      render: (_, r) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<RollbackOutlined />}
          onClick={() => openReturn(r)}
          style={{ borderRadius: 8 }}
        >
          Return
        </Button>
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

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${overdueCount} item${overdueCount > 1 ? "s are" : " is"} overdue for return — please follow up.`}
          style={{ marginBottom: 16, borderRadius: 10 }}
        />
      )}

      {/* Table */}
      <style>{tableHeadCss("return-tbl")}</style>
      <div className="return-tbl" style={tableContainer}>
        <Table
          columns={columns}
          dataSource={returnable}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
          locale={{ emptyText: "No pending returns" }}
        />
      </div>

      {/* Return Modal */}
      <Modal
        title={modalTitle(<RollbackOutlined />, "Process Return", returnModal?.itemName)}
        open={!!returnModal}
        onCancel={() => { setReturnModal(null); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        {returnModal && (
          <div style={{ marginTop: 12 }}>
            {/* Info summary */}
            <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1px solid var(--border-muted)" }}>
              {[
                ["Issued To", returnModal.issuedTo],
                ["Item",      returnModal.itemName],
                ["Total Qty", `${returnModal.quantity} ${returnModal.unit}`],
                ["Already Returned", returnModal.returnedQuantity || 0],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-muted)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pending</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>{returnModal.quantity - (returnModal.returnedQuantity || 0)} {returnModal.unit}</span>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onReturn}>
              <Form.Item label="Return Quantity" name="returnedQuantity" rules={[{ required: true }]}>
                <InputNumber min={1} max={returnModal.quantity - (returnModal.returnedQuantity || 0)} style={{ width: "100%" }} size="large" />
              </Form.Item>
              <Form.Item label="Item Condition" name="condition" initialValue="good">
                <Select size="large">
                  <Option value="good">Good — fully usable</Option>
                  <Option value="damaged">Damaged — needs repair</Option>
                  <Option value="disposed">Disposed — remove from stock</Option>
                </Select>
              </Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <Button onClick={() => { setReturnModal(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>Process Return</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
