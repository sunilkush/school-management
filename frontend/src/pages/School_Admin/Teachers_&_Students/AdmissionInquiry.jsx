import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table, Button, Modal, Form, Select, Input, DatePicker, Tag, message,
  Popconfirm, Badge, Tabs, Tooltip, Row, Col, Statistic,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined,
  PhoneOutlined, MailOutlined, CalendarOutlined, SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchInquiries, fetchInquiryStats,
  createInquiry, updateInquiry, deleteInquiry,
} from "../../../features/admissionInquirySlice.js";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, toolbarRow, tableHeadCss, pill, statGrid, iconWell,
} from "../../../styles/pageStyles";

const TABLE_CLS = "ai-tbl";

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_MAP = {
  new:             { color: "#5B9EC9", label: "New",            order: 0 },
  contacted:       { color: "#9B87B8", label: "Contacted",      order: 1 },
  visit_scheduled: { color: "#D4922A", label: "Visit Scheduled",order: 2 },
  docs_submitted:  { color: "#0891b2", label: "Docs Submitted", order: 3 },
  approved:        { color: "#5BA89A", label: "Approved",       order: 4 },
  enrolled:        { color: "#5BA89A", label: "Enrolled",       order: 5 },
  rejected:        { color: "#D96B7A", label: "Rejected",       order: 6 },
  waitlist:        { color: "#6b7280", label: "Waitlist",       order: 7 },
};

const SOURCE_MAP = {
  "walk-in":    "Walk-in",
  phone:        "Phone",
  website:      "Website",
  referral:     "Referral",
  social_media: "Social Media",
  other:        "Other",
};

const STATUS_TABS = [
  { key: "", label: "All" },
  ...Object.entries(STATUS_MAP)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([k, v]) => ({ key: k, label: v.label })),
];

/* ── Stat card ───────────────────────────────────────────────────── */
const StatCard = ({ label, value, color }) => (
  <div style={{
    ...sectionPanel,
    display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0,
  }}>
    <div style={iconWell(color, 40)}>
      <UserAddOutlined style={{ fontSize: 18 }} />
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value ?? 0}
      </div>
    </div>
  </div>
);

/* ── Main component ──────────────────────────────────────────────── */
const AdmissionInquiry = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { inquiries, total, loading, saving } = useSelector((s) => s.admissionInquiry);
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState({});

  const [activeTab,  setActiveTab]  = useState("");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [statusOnly, setStatusOnly] = useState(null); // quick status-change modal

  const load = useCallback(() => {
    dispatch(fetchInquiries({ status: activeTab || undefined, search: search || undefined, page, limit: 15 }));
  }, [dispatch, activeTab, search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    dispatch(fetchInquiryStats()).unwrap()
      .then((s) => setStats(s || {}))
      .catch(() => {});
  }, [dispatch, inquiries.length]);

  /* ── Open create ── */
  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({ source: "walk-in", gender: "male", relationship: "father" });
    setModalOpen(true);
  };

  /* ── Open edit ── */
  const openEdit = (record) => {
    setEditTarget(record);
    form.setFieldsValue({
      studentName:   record.studentName,
      dateOfBirth:   record.dateOfBirth   ? dayjs(record.dateOfBirth)   : null,
      gender:        record.gender,
      applyingClass: record.applyingClass,
      academicYear:  record.academicYear,
      parentName:    record.parentName,
      parentPhone:   record.parentPhone,
      parentEmail:   record.parentEmail,
      relationship:  record.relationship,
      address:       record.address,
      previousSchool:record.previousSchool,
      previousClass: record.previousClass,
      source:        record.source,
      status:        record.status,
      notes:         record.notes,
      followUpDate:  record.followUpDate  ? dayjs(record.followUpDate)  : null,
    });
    setModalOpen(true);
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      const payload = {
        ...vals,
        dateOfBirth:  vals.dateOfBirth  ? vals.dateOfBirth.toISOString()  : undefined,
        followUpDate: vals.followUpDate ? vals.followUpDate.toISOString() : undefined,
      };

      if (editTarget) {
        await dispatch(updateInquiry({ id: editTarget._id, data: payload })).unwrap();
        message.success("Inquiry updated");
      } else {
        await dispatch(createInquiry(payload)).unwrap();
        message.success("Inquiry created");
      }
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(typeof err === "string" ? err : "Operation failed");
    }
  };

  /* ── Quick status change ── */
  const handleStatusChange = async (record, newStatus) => {
    try {
      await dispatch(updateInquiry({ id: record._id, data: { status: newStatus } })).unwrap();
      message.success("Status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteInquiry(id)).unwrap();
      message.success("Inquiry deleted");
    } catch {
      message.error("Delete failed");
    }
  };

  /* ── Columns ── */
  const columns = [
    {
      title: "#",
      width: 42,
      render: (_, __, i) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{(page - 1) * 15 + i + 1}</span>,
    },
    {
      title:     "Student",
      dataIndex: "studentName",
      render:    (v, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.applyingClass}{r.academicYear ? ` • ${r.academicYear}` : ""}
          </div>
        </div>
      ),
    },
    {
      title:  "Parent",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{r.parentName}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <PhoneOutlined style={{ marginRight: 4 }} />{r.parentPhone}
            </span>
            {r.parentEmail && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <MailOutlined style={{ marginRight: 4 }} />{r.parentEmail}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title:  "Status",
      width:  150,
      render: (_, r) => {
        const sm = STATUS_MAP[r.status];
        return (
          <Select
            size="small"
            value={r.status}
            onChange={(v) => handleStatusChange(r, v)}
            style={{ width: 145 }}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        );
      },
    },
    {
      title:  "Source",
      width:  110,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {SOURCE_MAP[r.source] || r.source}
        </span>
      ),
    },
    {
      title:  "Follow-up",
      width:  110,
      render: (_, r) => r.followUpDate ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {dayjs(r.followUpDate).format("DD MMM YYYY")}
        </span>
      ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
    {
      title:  "Date",
      width:  100,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {dayjs(r.createdAt).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      title:  "Actions",
      width:  90,
      align:  "center",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(r)}
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          />
          <Popconfirm
            title="Delete this inquiry?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(r._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const tabItems = STATUS_TABS.map((t) => ({
    key:   t.key,
    label: (
      <span>
        {t.label}
        {t.key && stats[t.key] ? (
          <Badge count={stats[t.key]} size="small" style={{ marginLeft: 6, backgroundColor: STATUS_MAP[t.key]?.color }} />
        ) : null}
      </span>
    ),
  }));

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Admission Inquiries"
        subtitle="Track prospective student inquiries through the admission pipeline"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{ background: "var(--primary)", borderColor: "var(--primary)" }}
          >
            New Inquiry
          </Button>
        }
      />

      {/* ── Stats ── */}
      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard label="Total" value={Object.values(stats).reduce((a, b) => a + b, 0)} color="#9B87B8" />
        <StatCard label="New"       value={stats.new}       color="#5B9EC9" />
        <StatCard label="Approved"  value={stats.approved}  color="#5BA89A" />
        <StatCard label="Enrolled"  value={stats.enrolled}  color="#5BA89A" />
      </div>

      {/* ── Table panel ── */}
      <div style={sectionPanel}>
        {/* Toolbar */}
        <div style={toolbarRow}>
          <Input
            placeholder="Search by name / phone / email..."
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 280 }}
            allowClear
          />
        </div>

        {/* Status tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(k) => { setActiveTab(k); setPage(1); }}
          items={tabItems}
          style={{ marginBottom: 12 }}
        />

        <Table
          className={TABLE_CLS}
          rowKey="_id"
          columns={columns}
          dataSource={inquiries}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current:    page,
            pageSize:   15,
            total,
            onChange:   (p) => setPage(p),
            showSizeChanger: false,
            showTotal:  (t) => `${t} inquiries`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", color: "var(--text-muted)" }}>
                No inquiries found. Click "New Inquiry" to add one.
              </div>
            ),
          }}
        />
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={modalOpen}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>
            {editTarget ? "Edit Inquiry" : "New Admission Inquiry"}
          </span>
        }
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={saving}
        okButtonProps={{ style: { background: "var(--primary)", borderColor: "var(--primary)" } }}
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Student info */}
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Student Information
          </div>
          <Row gutter={14}>
            <Col span={16}>
              <Form.Item name="studentName" label="Student Name" rules={[{ required: true }]}>
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="Gender">
                <Select options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col span={8}>
              <Form.Item name="dateOfBirth" label="Date of Birth">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="applyingClass" label="Applying for Class" rules={[{ required: true }]}>
                <Input placeholder="e.g. Class 5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="academicYear" label="Academic Year">
                <Input placeholder="e.g. 2025-26" />
              </Form.Item>
            </Col>
          </Row>

          {/* Parent info */}
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0" }}>
            Parent / Guardian
          </div>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="parentName" label="Parent Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="relationship" label="Relationship">
                <Select options={[
                  { value: "father", label: "Father" },
                  { value: "mother", label: "Mother" },
                  { value: "guardian", label: "Guardian" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="parentPhone" label="Phone" rules={[{ required: true }]}>
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parentEmail" label="Email">
                <Input prefix={<MailOutlined />} type="email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          {/* Pipeline */}
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0" }}>
            Pipeline
          </div>
          <Row gutter={14}>
            <Col span={8}>
              <Form.Item name="source" label="Source">
                <Select options={Object.entries(SOURCE_MAP).map(([k, v]) => ({ value: k, label: v }))} />
              </Form.Item>
            </Col>
            {editTarget && (
              <Col span={8}>
                <Form.Item name="status" label="Status">
                  <Select options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Form.Item>
              </Col>
            )}
            <Col span={8}>
              <Form.Item name="followUpDate" label="Follow-up Date">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="previousSchool" label="Previous School">
                <Input placeholder="School name (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="previousClass" label="Previous Class">
                <Input placeholder="e.g. Class 4" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdmissionInquiry;
