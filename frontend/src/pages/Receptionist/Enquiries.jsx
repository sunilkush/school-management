import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Spin, Table } from "antd";
import { HelpCircle, Plus, Clock, CheckCircle, Users, Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInquiries, createInquiry, updateInquiry } from "../../features/admissionInquirySlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";
import { Avatar, StatCard, RefreshBtn, PrimaryBtn } from "./receptionistShared.jsx";

// AdmissionInquiry.status enum values (backend/src/models/AdmissionInquiry.model.js) — lowercase,
// snake_case. Keep these in sync with that schema, not with display casing.
const INQ_STATUS_LABELS = {
  new: "New", contacted: "Contacted", visit_scheduled: "Visit Scheduled",
  docs_submitted: "Docs Submitted", approved: "Approved", enrolled: "Enrolled",
  rejected: "Rejected", waitlist: "Waitlisted",
};
const INQ_COLORS = {
  new: "#f59e0b", contacted: "#0ea5e9", visit_scheduled: "#0ea5e9",
  docs_submitted: "#0ea5e9", approved: "#0ea5e9", enrolled: "#10b981",
  rejected: "#ef4444", waitlist: "#8b5cf6",
};
const INQ_IN_PROGRESS = ["contacted", "visit_scheduled", "docs_submitted", "approved", "waitlist"];

const Enquiries = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { inquiries, loading, saving } = useSelector((s) => s.admissionInquiry);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchInquiries({ limit: 500 })); }, [dispatch]);

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
    pending:    inquiries.filter((i) => i.status === "new" || !i.status).length,
    enrolled:   inquiries.filter((i) => i.status === "enrolled").length,
    inProgress: inquiries.filter((i) => INQ_IN_PROGRESS.includes(i.status)).length,
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
        return <span style={pill(c, `${c}15`)}>{INQ_STATUS_LABELS[v] || "New"}</span>;
      },
    },
    {
      title: "Actions", width: 130, align: "center",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <Popconfirm title="Mark as Enrolled?" okText="Enroll" onConfirm={() => handleStatus(r._id, "enrolled")}>
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
            <RefreshBtn onClick={() => dispatch(fetchInquiries({ limit: 500 }))} />
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

export default Enquiries;
