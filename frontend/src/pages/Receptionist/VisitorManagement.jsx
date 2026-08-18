import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Spin, Table } from "antd";
import { UserPlus, LogOut, Plus, Users, CheckCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGateEntries, createGateEntry, markGateExit } from "../../features/gateEntrySlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";
import { fmt, Avatar, StatCard, RefreshBtn, PrimaryBtn, VISITOR_COLORS } from "./receptionistShared.jsx";

const VisitorManagement = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchGateEntries({ limit: 500 })); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createGateEntry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Visitor checked in");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleExit = async (id) => {
    const res = await dispatch(markGateExit(id));
    if (res.meta.requestStatus === "fulfilled") message.success("Exit marked");
    else message.error(res.payload || "Failed");
  };

  const inside  = useMemo(() => entries.filter((e) => e.status === "Inside").length,  [entries]);
  const exited  = useMemo(() => entries.filter((e) => e.status !== "Inside").length,  [entries]);

  const columns = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.name || "?"} color={VISITOR_COLORS[r.type] || "var(--purple)"} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.purpose || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 110,
      render: (v) => {
        const c = VISITOR_COLORS[v] || "var(--purple)";
        return <span style={pill(c, `color-mix(in srgb, ${c} 8%, transparent)`)}>{v || "Visitor"}</span>;
      },
    },
    { title: "Phone", dataIndex: "phone", width: 130, render: (v) => <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{v || "—"}</span> },
    {
      title: "Entry", dataIndex: "entryTime", width: 90,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Exit", dataIndex: "exitTime", width: 90,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (v) => {
        const inside = v === "Inside";
        return <span style={pill(inside ? "var(--success)" : "var(--text-muted)", inside ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--text-muted) 8%, transparent)")}>{v || "—"}</span>;
      },
    },
    {
      title: "Action", width: 120, align: "center",
      render: (_, r) =>
        r.status === "Inside" ? (
          <Popconfirm title="Mark exit for this visitor?" okText="Mark Exit" cancelText="Cancel" onConfirm={() => handleExit(r._id)}>
            <button style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)", background: "color-mix(in srgb, var(--danger) 6%, transparent)",
              color: "var(--danger)", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}>
              <LogOut size={12} strokeWidth={2.5} /> Exit
            </button>
          </Popconfirm>
        ) : (
          <span style={{ ...pill("var(--text-muted)", "color-mix(in srgb, var(--text-muted) 8%, transparent)"), fontSize: 11 }}>Exited</span>
        ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("visitor-table")}</style>
      <PageHeader
        title="Visitor Management"
        subtitle="Track all gate entries and exits in real time"
        icon={<UserPlus size={20} />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <RefreshBtn onClick={() => dispatch(fetchGateEntries({ limit: 500 }))} />
            <PrimaryBtn icon={Plus} onClick={() => setOpen(true)}>Check In Visitor</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={Users}       label="Total Today"      value={entries.length} color="var(--purple)" />
        <StatCard icon={CheckCircle} label="Currently Inside" value={inside}         color="var(--success)" />
        <StatCard icon={LogOut}      label="Exited"           value={exited}         color="var(--text-muted)" />
      </div>

      <div style={sectionPanel}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><Spin size="large" /></div>
        ) : entries.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🚪</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No Visitor Entries</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click "Check In Visitor" to log the first entry.</div>
          </div>
        ) : (
          <Table className="visitor-table" rowKey="_id" dataSource={entries} columns={columns} loading={loading} size="small" pagination={{ pageSize: 10, showSizeChanger: false, size: "small" }} scroll={{ x: 700 }} />
        )}
      </div>

      <Modal title={<span style={{ fontWeight: 700 }}>Visitor Check-In</span>} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <Form.Item label="Visitor Name" name="name" rules={[{ required: true }]}><Input placeholder="Full name" /></Form.Item>
          <Form.Item label="Visitor Type" name="type" initialValue="Visitor">
            <Select options={["Visitor", "Parent", "Vendor", "Contractor", "Other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Phone" name="phone"><Input placeholder="Contact number" /></Form.Item>
          <Form.Item label="Purpose of Visit" name="purpose"><Input placeholder="e.g. Meet Principal" /></Form.Item>
          <Form.Item label="Vehicle Number" name="vehicleNo"><Input placeholder="Optional" /></Form.Item>
          <Form.Item label="Gate" name="gate" initialValue="Main">
            <Select options={["Main", "Side", "Back"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} style={{ borderRadius: 8 }}>Check In</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VisitorManagement;
