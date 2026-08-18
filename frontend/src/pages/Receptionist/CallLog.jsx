import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Spin, Table } from "antd";
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCallLogs, createCallLog, deleteCallLog } from "../../features/callLogSlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";
import { fmtFull, Avatar, StatCard, RefreshBtn, PrimaryBtn } from "./receptionistShared.jsx";

const CALL_COLORS = { Incoming: "var(--success)", Outgoing: "var(--purple)", Missed: "var(--danger)" };

const CallLog = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { logs, loading, saving } = useSelector((s) => s.callLogs);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchCallLogs({ limit: 500 })); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createCallLog(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Call logged");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const counts = useMemo(() => ({
    incoming: logs.filter((l) => l.type === "Incoming").length,
    outgoing: logs.filter((l) => l.type === "Outgoing").length,
    missed:   logs.filter((l) => l.type === "Missed").length,
  }), [logs]);

  const CallIcon = ({ type }) => {
    if (type === "Incoming") return <PhoneIncoming size={14} color="var(--success)" strokeWidth={2} />;
    if (type === "Outgoing") return <PhoneOutgoing size={14} color="var(--purple)" strokeWidth={2} />;
    return <PhoneMissed size={14} color="var(--danger)" strokeWidth={2} />;
  };

  const columns = [
    {
      title: "Caller",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.callerName || "?"} color={CALL_COLORS[r.type] || "var(--purple)"} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.callerName || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.phone || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 120,
      render: (v) => {
        const c = CALL_COLORS[v] || "var(--text-muted)";
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 5, ...pill(c, `color-mix(in srgb, ${c} 8%, transparent)`) }}>
            <CallIcon type={v} /> {v || "—"}
          </span>
        );
      },
    },
    { title: "Purpose", dataIndex: "purpose", render: (v) => <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v || "—"}</span> },
    {
      title: "Duration", dataIndex: "duration", width: 100,
      render: (v) => v ? <span style={pill("var(--purple)", "color-mix(in srgb, var(--purple) 8%, transparent)")}>{v} min</span> : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "Time", dataIndex: "callTime", width: 140,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtFull(v)}</span>,
    },
    {
      title: "", width: 70, align: "center",
      render: (_, r) => (
        <Popconfirm title="Delete this call log?" okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel" onConfirm={() => dispatch(deleteCallLog(r._id))}>
          <button style={{
            padding: "4px 10px", borderRadius: 7,
            border: "1px solid color-mix(in srgb, var(--danger) 19%, transparent)", background: "color-mix(in srgb, var(--danger) 6%, transparent)",
            color: "var(--danger)", cursor: "pointer", fontSize: 11, fontWeight: 600,
          }}>Del</button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("call-table")}</style>
      <PageHeader
        title="Call Log"
        subtitle="Record and track all incoming, outgoing and missed calls"
        icon={<Phone size={20} />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <RefreshBtn onClick={() => dispatch(fetchCallLogs({ limit: 500 }))} />
            <PrimaryBtn icon={Plus} onClick={() => setOpen(true)}>Log Call</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={PhoneIncoming} label="Incoming" value={counts.incoming} color="var(--success)" />
        <StatCard icon={PhoneOutgoing} label="Outgoing" value={counts.outgoing} color="var(--purple)" />
        <StatCard icon={PhoneMissed}   label="Missed"   value={counts.missed}   color="var(--danger)" />
        <StatCard icon={Phone}         label="Total"    value={logs.length}     color="var(--info)" />
      </div>

      <div style={sectionPanel}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><Spin size="large" /></div>
        ) : logs.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📞</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No Calls Logged</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click "Log Call" to record the first call.</div>
          </div>
        ) : (
          <Table className="call-table" rowKey="_id" dataSource={logs} columns={columns} loading={loading} size="small" pagination={{ pageSize: 10, showSizeChanger: false, size: "small" }} scroll={{ x: 680 }} />
        )}
      </div>

      <Modal title={<span style={{ fontWeight: 700 }}>Log a Call</span>} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Form.Item label="Caller Name" name="callerName" rules={[{ required: true }]}><Input placeholder="Full name" /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input placeholder="Contact number" /></Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Form.Item label="Call Type" name="type" initialValue="Incoming">
              <Select options={["Incoming","Outgoing","Missed"].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="Duration (min)" name="duration"><Input type="number" min={0} placeholder="0" /></Form.Item>
          </div>
          <Form.Item label="Purpose" name="purpose"><Input placeholder="Reason for call" /></Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} placeholder="Additional notes..." /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} style={{ borderRadius: 8 }}>Save Call</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CallLog;
