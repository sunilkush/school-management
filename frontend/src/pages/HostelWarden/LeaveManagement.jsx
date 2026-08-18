import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Form, Input, Modal, Popconfirm,
  Row, Select, Spin, Table, Tag, message, Badge,
} from "antd";
import {
  CheckOutlined, ClockCircleOutlined, CloseOutlined,
  ExportOutlined, LoginOutlined, LogoutOutlined, PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchHostelLeaves, createHostelLeave, updateLeaveStatus,
  recordLeaveCheckOut, recordLeaveCheckIn, deleteHostelLeave,
} from "../../features/hostelWardenSlice";
import { fetchLibraryStudents } from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, pill, sectionPanel, statGrid, iconWell, tableHeadCss } from "../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const STATUS_COLORS = { pending: "var(--warning)", approved: "var(--success)", rejected: "var(--danger)", cancelled: "var(--text-secondary)" };
const TYPE_COLORS   = { home: "var(--accent)", emergency: "var(--danger)", medical: "var(--cyan)", personal: "var(--success)", other: "var(--text-secondary)" };

const money = (v) => v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—";

const LeaveManagement = () => {
  const dispatch = useDispatch();
  const { leaves, leavesTotal, leavesSummary, leavesLoading, actionLoading } = useSelector((s) => s.hostelWarden || {});
  const { students = [] } = useSelector((s) => s.library || {});
  const { user } = useSelector((s) => s.auth);
  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;

  const [form] = Form.useForm();
  const [addModal, setAddModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHostelLeaves({ page, limit: 20 }));
    if (schoolId) dispatch(fetchLibraryStudents({ schoolId, limit: 500 }));
  }, [dispatch, page, schoolId]);

  const handleFilter = () => {
    const params = { page: 1, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (dateRange?.length === 2) {
      params.fromDate = dateRange[0].toISOString();
      params.toDate   = dateRange[1].toISOString();
    }
    dispatch(fetchHostelLeaves(params));
    setPage(1);
  };

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        fromDate: values.dateRange[0].toISOString(),
        toDate:   values.dateRange[1].toISOString(),
      };
      delete payload.dateRange;
      await dispatch(createHostelLeave(payload)).unwrap();
      message.success("Leave request created");
      setAddModal(false);
      form.resetFields();
      dispatch(fetchHostelLeaves({ page: 1, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const handleAction = async () => {
    if (!selectedLeave) return;
    try {
      if (actionType === "approved" || actionType === "rejected") {
        await dispatch(updateLeaveStatus({ id: selectedLeave._id, status: actionType, approvalNote: actionNote })).unwrap();
        message.success(`Leave ${actionType}`);
      } else if (actionType === "checkout") {
        await dispatch(recordLeaveCheckOut({ id: selectedLeave._id })).unwrap();
        message.success("Check-out recorded");
      } else if (actionType === "checkin") {
        await dispatch(recordLeaveCheckIn({ id: selectedLeave._id })).unwrap();
        message.success("Check-in recorded");
      }
      setActionModal(false);
      setActionNote("");
      dispatch(fetchHostelLeaves({ page, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const openAction = (leave, type) => { setSelectedLeave(leave); setActionType(type); setActionModal(true); };

  const summary = useMemo(() => {
    const m = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    leavesSummary.forEach((s) => { if (m[s._id] !== undefined) m[s._id] = s.count; });
    return m;
  }, [leavesSummary]);

  const handleExport = () => {
    const headers = ["Student", "Type", "From", "To", "Reason", "Status", "Checkout", "Checkin"];
    const rows = leaves.map((l) => [
      l.studentId?.name || "—", l.leaveType,
      dayjs(l.fromDate).format("DD-MM-YYYY"), dayjs(l.toDate).format("DD-MM-YYYY"),
      l.reason, l.status, l.checkOutTime ? dayjs(l.checkOutTime).format("DD-MM-YYYY HH:mm") : "—",
      l.checkInTime ? dayjs(l.checkInTime).format("DD-MM-YYYY HH:mm") : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leave-report-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const columns = [
    { title: "Student", render: (_, r) => (<div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.studentId?.name || "—"}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.studentId?.admissionNo}</div></div>) },
    { title: "Room", dataIndex: "roomNumber", render: (v) => v || "—" },
    { title: "Type", dataIndex: "leaveType", render: (v) => {
      const c = TYPE_COLORS[v] || "var(--text-secondary)";
      return <span style={pill(c, `color-mix(in srgb, ${c} 9%, transparent)`)}>{v}</span>;
    } },
    { title: "From", dataIndex: "fromDate", render: (d) => dayjs(d).format("DD MMM") },
    { title: "To",   dataIndex: "toDate",   render: (d) => dayjs(d).format("DD MMM") },
    { title: "Status", dataIndex: "status", render: (s) => <Badge status={s === "approved" ? "success" : s === "pending" ? "warning" : "error"} text={<span style={{ fontWeight: 600 }}>{s}</span>} /> },
    { title: "Check-Out", dataIndex: "checkOutTime", render: money },
    { title: "Check-In",  dataIndex: "checkInTime",  render: money },
    {
      title: "Actions", width: 180,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {r.status === "pending" && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openAction(r, "approved")}>Approve</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => openAction(r, "rejected")}>Reject</Button>
            </>
          )}
          {r.status === "approved" && !r.checkOutTime && (
            <Button size="small" icon={<LogoutOutlined />} onClick={() => openAction(r, "checkout")}>Check-Out</Button>
          )}
          {r.status === "approved" && r.checkOutTime && !r.checkInTime && (
            <Button size="small" icon={<LoginOutlined />} onClick={() => openAction(r, "checkin")}>Check-In</Button>
          )}
          <Popconfirm title="Delete this leave?" onConfirm={() => dispatch(deleteHostelLeave(r._id)).then(() => dispatch(fetchHostelLeaves({ page, limit: 20 })))} okType="danger">
            <Button size="small" type="text" danger>Del</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("leave-tbl")}</style>
      <PageHeader
        title="Leave Management"
        subtitle="Manage student hostel leave requests — approve, reject, track check-in/out"
        icon={<ClockCircleOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ExportOutlined />} onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>New Leave</Button>
          </div>
        }
      />

      {/* ── Summary KPIs ─────────────────────────────────────── */}
      <div style={statGrid(140)}>
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div style={iconWell(STATUS_COLORS[status], 36)}><ClockCircleOutlined /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[status], textTransform: "uppercase" }}>{status}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "12px 18px", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Select value={statusFilter} onChange={setStatusFilter} placeholder="Status" style={{ width: 130 }} allowClear>
          {["pending", "approved", "rejected", "cancelled"].map((s) => <Option key={s} value={s}>{s}</Option>)}
        </Select>
        <RangePicker onChange={(r) => setDateRange(r ? [r[0].toDate(), r[1].toDate()] : [])} />
        <Button type="primary" onClick={handleFilter}>Apply</Button>
        <Button onClick={() => { setStatusFilter(""); setDateRange([]); dispatch(fetchHostelLeaves({ page: 1, limit: 20 })); }}>Clear</Button>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div style={sectionPanel}>
        {leavesLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="leave-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={leaves}
            pagination={{ total: leavesTotal, current: page, pageSize: 20, onChange: setPage, showSizeChanger: false, showTotal: (t) => `${t} records` }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="No leave requests" /> }}
            size="small"
            rowClassName={(r) => r.isEmergency ? "ant-table-row-selected" : ""}
          />
        )}
      </div>

      {/* ── Add Leave Modal ───────────────────────────────────── */}
      <Modal title="Create Leave Request" open={addModal} onCancel={() => setAddModal(false)} onOk={() => form.submit()} confirmLoading={actionLoading} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="studentId" label="Student" rules={[{ required: true }]}>
                <Select placeholder="Select student" showSearch optionFilterProp="children">
                  {students.map((s) => (
                    <Option key={s._id} value={s?.user?._id || s._id}>
                      {s?.user?.name || s?.userDetails?.name || s?.studentName || s?.name || "Unnamed Student"} ({s.admissionNo || "—"})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
                <Select>
                  {["home", "emergency", "medical", "personal", "other"].map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="Leave Period" rules={[{ required: true }]}>
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="parentPhone" label="Parent Phone">
                <Input placeholder="Parent contact" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="roomNumber" label="Room Number">
                <Input placeholder="Room no." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Reason for leave" />
          </Form.Item>
          <Form.Item name="destinationAddress" label="Destination Address">
            <Input placeholder="Where the student is going" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Action Modal ───────────────────────────────────────── */}
      <Modal
        title={actionType === "approved" ? "Approve Leave" : actionType === "rejected" ? "Reject Leave" : actionType === "checkout" ? "Record Check-Out" : "Record Check-In"}
        open={actionModal}
        onCancel={() => { setActionModal(false); setActionNote(""); }}
        onOk={handleAction}
        confirmLoading={actionLoading}
        okButtonProps={{ danger: actionType === "rejected" }}
      >
        {selectedLeave && (
          <div style={{ marginBottom: 12 }}>
            <p><strong>Student:</strong> {selectedLeave.studentId?.name}</p>
            <p><strong>Period:</strong> {dayjs(selectedLeave.fromDate).format("DD MMM")} – {dayjs(selectedLeave.toDate).format("DD MMM YYYY")}</p>
            <p><strong>Reason:</strong> {selectedLeave.reason}</p>
          </div>
        )}
        {(actionType === "approved" || actionType === "rejected") && (
          <Input.TextArea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder={actionType === "rejected" ? "Rejection reason (required for rejection)" : "Optional note for student"}
            rows={3}
          />
        )}
        {(actionType === "checkout" || actionType === "checkin") && (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Current time will be recorded as {actionType === "checkout" ? "check-out" : "check-in"} time.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default LeaveManagement;
