import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Modal, Select, Spin, Table } from "antd";
import { Bell, Megaphone, CheckCircle, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, createNotification } from "../../features/notificationSlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";
import { fmtFull, StatCard, RefreshBtn, PrimaryBtn } from "./receptionistShared.jsx";

const AUDIENCE_MAP = {
  All:      { level: "all",  targetRoles: [] },
  Students: { level: "role", targetRoles: ["Student"] },
  Parents:  { level: "role", targetRoles: ["Parent"] },
  Teachers: { level: "role", targetRoles: ["Teacher"] },
  Staff:    { level: "role", targetRoles: ["Staff", "Support Staff"] },
};
const CHANNEL_MAP = {
  "App":          { inApp: true,  sms: false, email: false },
  "SMS":          { inApp: false, sms: true,  email: false },
  "Email":        { inApp: false, sms: false, email: true  },
  "SMS+App":      { inApp: true,  sms: true,  email: false },
  "All Channels": { inApp: true,  sms: true,  email: true  },
};

const getAudienceLabel = (n) => {
  if (n.level === "all") return "Everyone";
  if (n.level === "role" && n.targetRoles?.length) return n.targetRoles.join(", ");
  return "Everyone";
};

const AUDIENCE_COLORS = { Everyone: "var(--purple)", Student: "var(--info)", Parent: "var(--success)", Teacher: "var(--warning)", Staff: "var(--purple)" };
const CH_ICONS = { App: "📱", SMS: "💬", Email: "📧" };

const Broadcasts = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { items: notifications, loading, creating } = useSelector((s) => s.notification);

  useEffect(() => { dispatch(fetchNotifications({ status: "sent" })); }, [dispatch]);

  const handleSend = async (values) => {
    const audience = AUDIENCE_MAP[values.audience] || AUDIENCE_MAP.All;
    const channels = CHANNEL_MAP[values.channel]   || CHANNEL_MAP["App"];
    const res = await dispatch(createNotification({
      title: values.title,
      message: values.notifMessage,
      level: audience.level,
      targetRoles: audience.targetRoles,
      channels,
      status: "sent",
    }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success(`Broadcast "${values.title}" sent`);
      form.resetFields();
      setOpen(false);
      dispatch(fetchNotifications({ status: "sent" }));
    } else {
      message.error(res.payload || "Failed to send");
    }
  };

  const counts = useMemo(() => ({
    total:     notifications.length,
    sent:      notifications.filter((n) => n.status === "sent").length,
    scheduled: notifications.filter((n) => n.status === "scheduled").length,
  }), [notifications]);

  const columns = [
    {
      title: "Broadcast",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "color-mix(in srgb, var(--purple) 8%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Megaphone size={16} color="var(--purple)" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.title || "Untitled"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {fmtFull(r.createdAt)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Audience", width: 130,
      render: (_, r) => {
        const label = getAudienceLabel(r);
        const firstRole = r.targetRoles?.[0] || "Everyone";
        const c = AUDIENCE_COLORS[firstRole] || AUDIENCE_COLORS.Everyone;
        return <span style={pill(c, `color-mix(in srgb, ${c} 8%, transparent)`)}>{label}</span>;
      },
    },
    {
      title: "Channels", width: 150,
      render: (_, r) => {
        const ch = r.channels || {};
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {ch.inApp  && <span style={pill("var(--purple)", "color-mix(in srgb, var(--purple) 8%, transparent)")}>{CH_ICONS.App} App</span>}
            {ch.sms    && <span style={pill("var(--info)", "color-mix(in srgb, var(--info) 8%, transparent)")}>{CH_ICONS.SMS} SMS</span>}
            {ch.email  && <span style={pill("var(--success)", "color-mix(in srgb, var(--success) 8%, transparent)")}>{CH_ICONS.Email} Email</span>}
            {!ch.inApp && !ch.sms && !ch.email && <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
          </div>
        );
      },
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (v) => {
        const sent = v === "sent";
        const c = sent ? "var(--success)" : v === "scheduled" ? "var(--info)" : "var(--text-muted)";
        return <span style={pill(c, `color-mix(in srgb, ${c} 8%, transparent)`)}>{v || "—"}</span>;
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("bc-table")}</style>
      <PageHeader
        title="Broadcasts"
        subtitle="Send announcements to students, parents, teachers and staff"
        icon={<Bell size={20} />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <RefreshBtn onClick={() => dispatch(fetchNotifications({ status: "sent" }))} />
            <PrimaryBtn icon={Megaphone} onClick={() => setOpen(true)}>New Broadcast</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(150), marginTop: 20 }}>
        <StatCard icon={Megaphone}    label="Total Broadcasts" value={counts.total}     color="var(--purple)" loading={loading} />
        <StatCard icon={CheckCircle}  label="Sent"             value={counts.sent}      color="var(--success)" loading={loading} />
        <StatCard icon={Clock}        label="Scheduled"        value={counts.scheduled} color="var(--info)" loading={loading} />
      </div>

      <div style={sectionPanel}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><Spin size="large" /></div>
        ) : notifications.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📣</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No Broadcasts Yet</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click "New Broadcast" to send your first announcement.</div>
          </div>
        ) : (
          <Table className="bc-table" rowKey="_id" dataSource={notifications} columns={columns} loading={loading} size="small" pagination={{ pageSize: 10, showSizeChanger: false, size: "small" }} locale={{ emptyText: "No broadcasts sent yet." }} />
        )}
      </div>

      <Modal title={<span style={{ fontWeight: 700 }}>Send Broadcast</span>} open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} destroyOnClose width={520}>
        <Form form={form} layout="vertical" onFinish={handleSend} style={{ marginTop: 8 }}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: "Enter a title" }]}>
            <Input placeholder="e.g. School closed tomorrow" />
          </Form.Item>
          <Form.Item label="Message" name="notifMessage" rules={[{ required: true, message: "Enter a message" }]}>
            <Input.TextArea rows={4} placeholder="Write your announcement here..." />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Form.Item label="Audience" name="audience" initialValue="All">
              <Select options={["All","Students","Parents","Teachers","Staff"].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item label="Channel" name="channel" initialValue="App">
              <Select options={["App","SMS","Email","SMS+App","All Channels"].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => { setOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={creating} style={{ borderRadius: 8 }} icon={<Megaphone size={14} strokeWidth={2} />}>
                Send Now
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Broadcasts;
