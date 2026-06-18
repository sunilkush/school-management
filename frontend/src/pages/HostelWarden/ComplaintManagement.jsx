import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Badge, Button, Col, Empty, Form, Input, Modal, Popconfirm,
  Row, Select, Spin, Table, Tag, Timeline, message,
} from "antd";
import {
  AlertOutlined, ExportOutlined, PlusOutlined, WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchHostelComplaints, createHostelComplaint, updateHostelComplaint, deleteHostelComplaint,
} from "../../features/hostelWardenSlice";
import { fetchLibraryStudents } from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import { iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss } from "../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS  = { open: "#D96B7A", in_progress: "#D4922A", resolved: "#5BA89A", closed: "#6B7890", rejected: "#9333ea" };
const PRIORITY_COLORS= { low: "#6B7890", medium: "#0891b2", high: "#D4922A", urgent: "#D96B7A" };
const TYPE_LIST      = ["room", "food", "maintenance", "safety", "electricity", "plumbing", "furniture", "cleanliness", "other"];
const STATUS_LIST    = ["open", "in_progress", "resolved", "closed", "rejected"];

const ComplaintManagement = () => {
  const dispatch = useDispatch();
  const { complaints, complaintsTotal, complaintsSummary, complaintsLoading, actionLoading } = useSelector((s) => s.hostelWarden || {});
  const { students = [] } = useSelector((s) => s.library || {});
  const { user } = useSelector((s) => s.auth);
  const schoolId = user?.schoolId?._id || user?.schoolId;

  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [addModal, setAddModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHostelComplaints({ page, limit: 20 }));
    if (schoolId) dispatch(fetchLibraryStudents({ schoolId, limit: 500 }));
  }, [dispatch, page, schoolId]);

  const handleFilter = () => {
    const params = { page: 1, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    dispatch(fetchHostelComplaints(params));
    setPage(1);
  };

  const handleAdd = async (values) => {
    try {
      await dispatch(createHostelComplaint(values)).unwrap();
      message.success("Complaint registered");
      setAddModal(false);
      form.resetFields();
      dispatch(fetchHostelComplaints({ page: 1, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const handleUpdate = async (values) => {
    try {
      await dispatch(updateHostelComplaint({ id: updateModal._id, ...values })).unwrap();
      message.success("Complaint updated");
      setUpdateModal(null);
      updateForm.resetFields();
      dispatch(fetchHostelComplaints({ page, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const openUpdate = (record) => {
    setUpdateModal(record);
    updateForm.setFieldsValue({ status: record.status, priority: record.priority, assignedTo: record.assignedTo, resolution: record.resolution || "" });
  };

  const summary = useMemo(() => {
    const m = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    complaintsSummary.forEach((s) => { if (m[s._id] !== undefined) m[s._id] = s.count; });
    return m;
  }, [complaintsSummary]);

  const handleExport = () => {
    const headers = ["No.", "Title", "Type", "Priority", "Status", "Student", "Room", "Date", "Resolved"];
    const rows = complaints.map((c) => [
      c.complaintNo, c.title, c.type, c.priority, c.status,
      c.studentId?.name || "—", c.roomNumber || "—",
      dayjs(c.createdAt).format("DD-MM-YYYY"),
      c.resolvedAt ? dayjs(c.resolvedAt).format("DD-MM-YYYY") : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `complaints-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const columns = [
    {
      title: "Complaint",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--primary)" }} onClick={() => setDetailModal(r)}>{r.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>#{r.complaintNo} · {r.type}</div>
        </div>
      ),
    },
    { title: "Priority", dataIndex: "priority", render: (v) => <span style={pill(PRIORITY_COLORS[v] || "#6B7890", `${PRIORITY_COLORS[v] || "#6B7890"}18`)}>{v}</span> },
    { title: "Status",   dataIndex: "status",   render: (s) => <Badge status={s === "open" ? "error" : s === "in_progress" ? "warning" : s === "resolved" ? "success" : "default"} text={<span style={{ fontWeight: 600, textTransform: "capitalize" }}>{s.replace("_", " ")}</span>} /> },
    { title: "Student",  render: (_, r) => r.studentId?.name || "—" },
    { title: "Room",     dataIndex: "roomNumber", render: (v) => v || "—" },
    { title: "Date",     dataIndex: "createdAt", render: (d) => dayjs(d).format("DD MMM YYYY") },
    {
      title: "Actions", width: 120,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button size="small" onClick={() => openUpdate(r)}>Update</Button>
          <Popconfirm title="Delete this complaint?" onConfirm={() => dispatch(deleteHostelComplaint(r._id)).then(() => dispatch(fetchHostelComplaints({ page, limit: 20 })))} okType="danger">
            <Button size="small" type="text" danger>Del</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("complaint-tbl")}</style>
      <PageHeader
        title="Complaint Management"
        subtitle="Track, assign, and resolve hostel complaints by priority"
        icon={<AlertOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ExportOutlined />} onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>New Complaint</Button>
          </div>
        }
      />

      {/* ── Summary KPIs ─────────────────────────────────────── */}
      <div style={statGrid(130)}>
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div style={iconWell(STATUS_COLORS[status] || "#6B7890", 36)}><WarningOutlined /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[status], textTransform: "uppercase" }}>{status.replace("_", " ")}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "12px 18px", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Select value={statusFilter} onChange={setStatusFilter} placeholder="Status" style={{ width: 140 }} allowClear>
          {STATUS_LIST.map((s) => <Option key={s} value={s}>{s.replace("_", " ")}</Option>)}
        </Select>
        <Select value={priorityFilter} onChange={setPriorityFilter} placeholder="Priority" style={{ width: 120 }} allowClear>
          {["low", "medium", "high", "urgent"].map((p) => <Option key={p} value={p}>{p}</Option>)}
        </Select>
        <Button type="primary" onClick={handleFilter}>Apply</Button>
        <Button onClick={() => { setStatusFilter(""); setPriorityFilter(""); dispatch(fetchHostelComplaints({ page: 1, limit: 20 })); }}>Clear</Button>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div style={sectionPanel}>
        {complaintsLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="complaint-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={complaints}
            pagination={{ total: complaintsTotal, current: page, pageSize: 20, onChange: setPage, showSizeChanger: false }}
            scroll={{ x: 800 }}
            locale={{ emptyText: <Empty description="No complaints found" /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Add Complaint Modal ───────────────────────────────── */}
      <Modal title="Register Complaint" open={addModal} onCancel={() => setAddModal(false)} onOk={() => form.submit()} confirmLoading={actionLoading} width={560} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 8 }}>
          <Form.Item name="title" label="Complaint Title" rules={[{ required: true }]}>
            <Input placeholder="Brief title of the complaint" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select>
                  {TYPE_LIST.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select>
                  {["low", "medium", "high", "urgent"].map((p) => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="studentId" label="Raised By (Student)">
                <Select showSearch optionFilterProp="children" placeholder="Select student" allowClear>
                  {students.map((s) => <Option key={s._id} value={s._id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="roomNumber" label="Room Number">
                <Input placeholder="Room no." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Detailed description of the complaint" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Update Status Modal ───────────────────────────────── */}
      <Modal title="Update Complaint" open={!!updateModal} onCancel={() => setUpdateModal(null)} onOk={() => updateForm.submit()} confirmLoading={actionLoading} width={480} destroyOnClose>
        {updateModal && (
          <Form form={updateForm} layout="vertical" onFinish={handleUpdate} style={{ marginTop: 8 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Status">
                  <Select>
                    {STATUS_LIST.map((s) => <Option key={s} value={s}>{s.replace("_", " ")}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priority" label="Priority">
                  <Select>
                    {["low", "medium", "high", "urgent"].map((p) => <Option key={p} value={p}>{p}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="assignedTo" label="Assigned To (Staff Name)">
              <Input placeholder="Name of staff handling this" />
            </Form.Item>
            <Form.Item name="resolution" label="Resolution / Action Taken">
              <TextArea rows={3} placeholder="Describe the resolution" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <Modal title="Complaint Detail" open={!!detailModal} onCancel={() => setDetailModal(null)} footer={null} width={560}>
        {detailModal && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <Tag color="red">{detailModal.complaintNo}</Tag>
              <span style={pill(PRIORITY_COLORS[detailModal.priority] || "#6B7890", `${PRIORITY_COLORS[detailModal.priority] || "#6B7890"}18`)}>{detailModal.priority}</span>
              <span style={pill(STATUS_COLORS[detailModal.status] || "#6B7890", `${STATUS_COLORS[detailModal.status] || "#6B7890"}18`)}>{detailModal.status.replace("_", " ")}</span>
            </div>
            <p><strong>Title:</strong> {detailModal.title}</p>
            <p><strong>Type:</strong> {detailModal.type}</p>
            <p><strong>Student:</strong> {detailModal.studentId?.name || "—"}</p>
            <p><strong>Room:</strong> {detailModal.roomNumber || "—"}</p>
            <p><strong>Description:</strong> {detailModal.description}</p>
            {detailModal.resolution && <p><strong>Resolution:</strong> {detailModal.resolution}</p>}
            {detailModal.resolvedAt && <p><strong>Resolved At:</strong> {dayjs(detailModal.resolvedAt).format("DD MMM YYYY hh:mm A")}</p>}
            {detailModal.actionHistory?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>History:</strong>
                <Timeline style={{ marginTop: 8 }}>
                  {detailModal.actionHistory.map((h, i) => (
                    <Timeline.Item key={i}>
                      <div style={{ fontSize: 12 }}><strong>{h.action}</strong> — {h.note || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dayjs(h.at).format("DD MMM, hh:mm A")}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintManagement;
