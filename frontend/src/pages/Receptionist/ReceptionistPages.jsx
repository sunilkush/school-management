import React, { useEffect, useMemo, useState } from "react";
import {
  App, Button, Form, Input, Modal, Popconfirm, Select, Spin, Table,
} from "antd";
import {
  LayoutDashboard, Users, Phone, Bell, HelpCircle, UserPlus,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, LogOut, Plus,
  RefreshCw, Clock, Megaphone, CheckCircle, Eye,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGateEntries, fetchGateStats, createGateEntry, markGateExit,
} from "../../features/gateEntrySlice";
import { fetchCallLogs, createCallLog, deleteCallLog } from "../../features/callLogSlice";
import { fetchInquiries, createInquiry, updateInquiry } from "../../features/admissionInquirySlice";
import { fetchNotifications, createNotification } from "../../features/notificationSlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";

/* ── Shared helpers ──────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleString() : "—";

function Avatar({ name = "?", color = "#6366f1" }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: `${color}18`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 13,
    }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div style={statCard({ color, bg: "var(--surface)", accentBar: color })}>
      <div>
        <div style={statLabel(color)}>{label}</div>
        <div style={statValue(color)}>{loading ? "…" : (value ?? 0)}</div>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
    </div>
  );
}

function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9,
      border: "1px solid var(--border-muted)",
      background: "var(--surface)", color: "var(--text-muted)",
      cursor: "pointer", fontSize: 13, fontWeight: 500,
    }}>
      <RefreshCw size={14} strokeWidth={2} /> Refresh
    </button>
  );
}

function PrimaryBtn({ icon: Icon, onClick, loading, children }) {
  return (
    <Button
      type="primary"
      icon={Icon ? <Icon size={14} strokeWidth={2.2} /> : undefined}
      onClick={onClick}
      loading={loading}
      style={{ borderRadius: 9, fontWeight: 600 }}
    >
      {children}
    </Button>
  );
}

const VISITOR_COLORS = {
  Visitor: "#6366f1", Parent: "#0ea5e9", Vendor: "#f59e0b",
  Contractor: "#ec4899", Other: "#8b5cf6",
};
const CALL_COLORS = { Incoming: "#10b981", Outgoing: "#6366f1", Missed: "#ef4444" };
const INQ_COLORS  = { Pending: "#f59e0b", Enrolled: "#10b981", "In Progress": "#0ea5e9", Rejected: "#ef4444" };

/* ══════════════════════════════════════════════════════════════════
   RECEPTIONIST DASHBOARD
══════════════════════════════════════════════════════════════════ */
export const ReceptionistDashboard = () => {
  const dispatch = useDispatch();
  const { stats, entries, loading } = useSelector((s) => s.gateEntries);
  const { inquiries }               = useSelector((s) => s.admissionInquiry);
  const { logs }                    = useSelector((s) => s.callLogs);

  const refresh = () => {
    dispatch(fetchGateStats());
    dispatch(fetchInquiries({}));
    dispatch(fetchCallLogs({}));
    dispatch(fetchGateEntries({}));
  };

  useEffect(() => { refresh(); }, [dispatch]); // eslint-disable-line

  const pending = useMemo(
    () => inquiries.filter((i) => ["pending", "New", "Pending"].includes(i.status)).length,
    [inquiries]
  );
  const todayCalls = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((l) => l.callTime && new Date(l.callTime).toDateString() === today).length;
  }, [logs]);

  const recentEntries = entries.slice(0, 6);

  const columns = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.name || "?"} color={VISITOR_COLORS[r.type] || "#6366f1"} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.phone || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 110,
      render: (v) => {
        const c = VISITOR_COLORS[v] || "#8b5cf6";
        return <span style={pill(c, `${c}15`)}>{v || "Visitor"}</span>;
      },
    },
    {
      title: "Entry", dataIndex: "entryTime", width: 90,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (v) => {
        const inside = v === "Inside";
        return <span style={pill(inside ? "#10b981" : "#94a3b8", inside ? "#10b98115" : "#94a3b815")}>
          {v || "—"}
        </span>;
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("dash-table")}</style>
      <PageHeader
        title="Receptionist Dashboard"
        subtitle="Front desk overview — visitors, enquiries, calls and broadcasts"
        icon={<LayoutDashboard size={20} />}
        extra={<RefreshBtn onClick={refresh} />}
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={Users}       label="Today's Visitors"   value={stats?.todayEntries ?? 0} color="#6366f1" loading={loading} />
        <StatCard icon={HelpCircle}  label="Pending Enquiries"  value={pending}                  color="#f59e0b" loading={loading} />
        <StatCard icon={Phone}       label="Calls Today"        value={todayCalls}               color="#10b981" loading={loading} />
        <StatCard icon={CheckCircle} label="Currently Inside"   value={stats?.inside ?? 0}       color="#0ea5e9" loading={loading} />
      </div>

      <div style={sectionPanel}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Recent Visitor Entries
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}><Spin /></div>
        ) : recentEntries.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🚪</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>No visitors yet today</div>
          </div>
        ) : (
          <Table className="dash-table" rowKey="_id" dataSource={recentEntries} columns={columns} pagination={false} size="small" />
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   VISITOR MANAGEMENT
══════════════════════════════════════════════════════════════════ */
export const VisitorManagement = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchGateEntries({})); }, [dispatch]);

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
          <Avatar name={r.name || "?"} color={VISITOR_COLORS[r.type] || "#6366f1"} />
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
        const c = VISITOR_COLORS[v] || "#8b5cf6";
        return <span style={pill(c, `${c}15`)}>{v || "Visitor"}</span>;
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
        return <span style={pill(inside ? "#10b981" : "#94a3b8", inside ? "#10b98115" : "#94a3b815")}>{v || "—"}</span>;
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
              border: "1px solid #ef444440", background: "#ef444410",
              color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}>
              <LogOut size={12} strokeWidth={2.5} /> Exit
            </button>
          </Popconfirm>
        ) : (
          <span style={{ ...pill("#94a3b8", "#94a3b815"), fontSize: 11 }}>Exited</span>
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
            <RefreshBtn onClick={() => dispatch(fetchGateEntries({}))} />
            <PrimaryBtn icon={Plus} onClick={() => setOpen(true)}>Check In Visitor</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={Users}       label="Total Today"      value={entries.length} color="#6366f1" />
        <StatCard icon={CheckCircle} label="Currently Inside" value={inside}         color="#10b981" />
        <StatCard icon={LogOut}      label="Exited"           value={exited}         color="#94a3b8" />
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

/* ══════════════════════════════════════════════════════════════════
   ENQUIRIES
══════════════════════════════════════════════════════════════════ */
export const Enquiries = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { inquiries, loading, saving } = useSelector((s) => s.admissionInquiry);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchInquiries({})); }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createInquiry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Enquiry recorded");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleStatus = async (id, status) => {
    const res = await dispatch(updateInquiry({ id, data: { status } }));
    if (res.meta.requestStatus === "fulfilled") message.success("Status updated");
    else message.error(res.payload || "Failed");
  };

  const counts = useMemo(() => ({
    total:      inquiries.length,
    pending:    inquiries.filter((i) => ["pending","Pending","New"].includes(i.status)).length,
    enrolled:   inquiries.filter((i) => i.status === "Enrolled").length,
    inProgress: inquiries.filter((i) => ["In Progress","in-progress"].includes(i.status)).length,
  }), [inquiries]);

  const SOURCE_COLORS = { "walk-in": "#6366f1", phone: "#0ea5e9", website: "#10b981", referral: "#f59e0b", other: "#8b5cf6" };

  const columns = [
    {
      title: "Student / Parent",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.studentName || "S"} color="#6366f1" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.studentName || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.parentName || ""} {r.parentPhone ? `· ${r.parentPhone}` : ""}</div>
          </div>
        </div>
      ),
    },
    { title: "Class", dataIndex: "applyingClass", width: 90, render: (v) => <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v || "—"}</span> },
    {
      title: "Source", dataIndex: "source", width: 110,
      render: (v) => {
        const c = SOURCE_COLORS[v] || "#8b5cf6";
        return <span style={pill(c, `${c}15`)}>{v || "—"}</span>;
      },
    },
    {
      title: "Status", dataIndex: "status", width: 120,
      render: (v) => {
        const c = INQ_COLORS[v] || "#94a3b8";
        return <span style={pill(c, `${c}15`)}>{v || "Pending"}</span>;
      },
    },
    {
      title: "Actions", width: 130, align: "center",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <Popconfirm title="Mark as Enrolled?" okText="Enroll" onConfirm={() => handleStatus(r._id, "Enrolled")}>
            <button style={{
              padding: "4px 10px", borderRadius: 7, border: "1px solid #10b98140",
              background: "#10b98110", color: "#10b981", cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>Enroll</button>
          </Popconfirm>
          <button style={{
            padding: "4px 8px", borderRadius: 7, border: "1px solid var(--border-muted)",
            background: "var(--surface-soft)", color: "var(--text-muted)", cursor: "pointer",
          }}>
            <Eye size={12} strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("enq-table")}</style>
      <PageHeader
        title="Admission Enquiries"
        subtitle="Manage incoming admission requests and follow-ups"
        icon={<HelpCircle size={20} />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <RefreshBtn onClick={() => dispatch(fetchInquiries({}))} />
            <PrimaryBtn icon={Plus} onClick={() => setOpen(true)}>New Enquiry</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={HelpCircle}  label="Total Enquiries" value={counts.total}      color="#6366f1" />
        <StatCard icon={Clock}       label="Pending"         value={counts.pending}    color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Enrolled"        value={counts.enrolled}   color="#10b981" />
        <StatCard icon={Users}       label="In Progress"     value={counts.inProgress} color="#0ea5e9" />
      </div>

      <div style={sectionPanel}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><Spin size="large" /></div>
        ) : inquiries.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>No Enquiries Yet</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Click "New Enquiry" to log the first admission enquiry.</div>
          </div>
        ) : (
          <Table className="enq-table" rowKey="_id" dataSource={inquiries} columns={columns} loading={loading} size="small" pagination={{ pageSize: 10, showSizeChanger: false, size: "small" }} scroll={{ x: 680 }} />
        )}
      </div>

      <Modal title={<span style={{ fontWeight: 700 }}>New Admission Enquiry</span>} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Form.Item label="Student Name"  name="studentName"   rules={[{ required: true }]}><Input placeholder="Student's full name" /></Form.Item>
            <Form.Item label="Applying Class" name="applyingClass" rules={[{ required: true }]}><Input placeholder="e.g. Class 5" /></Form.Item>
            <Form.Item label="Parent Name"   name="parentName"    rules={[{ required: true }]}><Input placeholder="Parent / Guardian name" /></Form.Item>
            <Form.Item label="Parent Phone"  name="parentPhone"   rules={[{ required: true }]}><Input placeholder="Phone number" /></Form.Item>
          </div>
          <Form.Item label="Parent Email" name="parentEmail"><Input type="email" placeholder="Optional" /></Form.Item>
          <Form.Item label="Source" name="source" initialValue="walk-in">
            <Select options={["walk-in","phone","website","referral","other"].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} placeholder="Additional notes..." /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} style={{ borderRadius: 8 }}>Save Enquiry</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   CALL LOG
══════════════════════════════════════════════════════════════════ */
export const CallLog = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { logs, loading, saving } = useSelector((s) => s.callLogs);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchCallLogs({})); }, [dispatch]);

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
    if (type === "Incoming") return <PhoneIncoming size={14} color="#10b981" strokeWidth={2} />;
    if (type === "Outgoing") return <PhoneOutgoing size={14} color="#6366f1" strokeWidth={2} />;
    return <PhoneMissed size={14} color="#ef4444" strokeWidth={2} />;
  };

  const columns = [
    {
      title: "Caller",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.callerName || "?"} color={CALL_COLORS[r.type] || "#6366f1"} />
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
        const c = CALL_COLORS[v] || "#94a3b8";
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 5, ...pill(c, `${c}15`) }}>
            <CallIcon type={v} /> {v || "—"}
          </span>
        );
      },
    },
    { title: "Purpose", dataIndex: "purpose", render: (v) => <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v || "—"}</span> },
    {
      title: "Duration", dataIndex: "duration", width: 100,
      render: (v) => v ? <span style={pill("#6366f1", "#6366f115")}>{v} min</span> : <span style={{ color: "var(--text-muted)" }}>—</span>,
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
            border: "1px solid #ef444430", background: "#ef444410",
            color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 600,
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
            <RefreshBtn onClick={() => dispatch(fetchCallLogs({}))} />
            <PrimaryBtn icon={Plus} onClick={() => setOpen(true)}>Log Call</PrimaryBtn>
          </div>
        }
      />

      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={PhoneIncoming} label="Incoming" value={counts.incoming} color="#10b981" />
        <StatCard icon={PhoneOutgoing} label="Outgoing" value={counts.outgoing} color="#6366f1" />
        <StatCard icon={PhoneMissed}   label="Missed"   value={counts.missed}   color="#ef4444" />
        <StatCard icon={Phone}         label="Total"    value={logs.length}     color="#0ea5e9" />
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

/* ══════════════════════════════════════════════════════════════════
   BROADCASTS
══════════════════════════════════════════════════════════════════ */
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

const getChannelLabel = (ch = {}) => {
  const a = [];
  if (ch.inApp) a.push("App");
  if (ch.sms)   a.push("SMS");
  if (ch.email) a.push("Email");
  return a.join(" + ") || "App";
};
const getAudienceLabel = (n) => {
  if (n.level === "all") return "Everyone";
  if (n.level === "role" && n.targetRoles?.length) return n.targetRoles.join(", ");
  return "Everyone";
};

const AUDIENCE_COLORS = { Everyone: "#6366f1", Student: "#0ea5e9", Parent: "#10b981", Teacher: "#f59e0b", Staff: "#8b5cf6" };
const CH_ICONS = { App: "📱", SMS: "💬", Email: "📧" };

export const Broadcasts = () => {
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
            background: "#6366f115",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Megaphone size={16} color="#6366f1" strokeWidth={1.8} />
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
        return <span style={pill(c, `${c}15`)}>{label}</span>;
      },
    },
    {
      title: "Channels", width: 150,
      render: (_, r) => {
        const ch = r.channels || {};
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {ch.inApp  && <span style={pill("#6366f1", "#6366f115")}>{CH_ICONS.App} App</span>}
            {ch.sms    && <span style={pill("#0ea5e9", "#0ea5e915")}>{CH_ICONS.SMS} SMS</span>}
            {ch.email  && <span style={pill("#10b981", "#10b98115")}>{CH_ICONS.Email} Email</span>}
            {!ch.inApp && !ch.sms && !ch.email && <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
          </div>
        );
      },
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (v) => {
        const sent = v === "sent";
        const c = sent ? "#10b981" : v === "scheduled" ? "#0ea5e9" : "#94a3b8";
        return <span style={pill(c, `${c}15`)}>{v || "—"}</span>;
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
        <StatCard icon={Megaphone}    label="Total Broadcasts" value={counts.total}     color="#6366f1" loading={loading} />
        <StatCard icon={CheckCircle}  label="Sent"             value={counts.sent}      color="#10b981" loading={loading} />
        <StatCard icon={Clock}        label="Scheduled"        value={counts.scheduled} color="#0ea5e9" loading={loading} />
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
