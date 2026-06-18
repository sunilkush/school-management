import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Tabs,
  Table,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Badge,
  Tag,
  message,
  Button,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  createLeaveRequest,
} from "../../../features/leaveRequestSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";

const { TextArea } = Input;

/* ── Helpers ─────────────────────────────────────────────────────── */
const LEAVE_TYPE_COLOR = {
  sick:      "red",
  casual:    "blue",
  paid:      "green",
  emergency: "orange",
  other:     "default",
};

const STATUS_COLOR = {
  pending:  "#D4922A",
  approved: "#5BA89A",
  rejected: "#D96B7A",
};

const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

/* ── Sub-component: role tag ─────────────────────────────────────── */
const RoleTag = ({ role }) => {
  const colorMap = { Teacher: "purple", Student: "cyan", Staff: "geekblue" };
  return <Tag color={colorMap[role] || "default"}>{role || "—"}</Tag>;
};

/* ── Build table columns ─────────────────────────────────────────── */
const buildColumns = ({ isPending, onApprove, onReject }) => [
  {
    title: "Name",
    render: (_, r) => (
      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
        {r?.userId?.name || "—"}
      </span>
    ),
  },
  {
    title: "Role",
    render: (_, r) => <RoleTag role={r?.userId?.role?.name || r?.role} />,
  },
  {
    title: "Leave Type",
    render: (_, r) => (
      <Tag color={LEAVE_TYPE_COLOR[r?.leaveType] || "default"}>
        {r?.leaveType ? r.leaveType.charAt(0).toUpperCase() + r.leaveType.slice(1) : "—"}
      </Tag>
    ),
  },
  {
    title: "Date Range",
    render: (_, r) => (
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {fmtDate(r?.startDate)} — {fmtDate(r?.endDate)}
      </span>
    ),
  },
  {
    title: "Days",
    dataIndex: "totalDays",
    render: (v) => (
      <span style={{ fontWeight: 600 }}>{v ?? "—"}</span>
    ),
  },
  {
    title: "Reason",
    render: (_, r) => {
      const txt = r?.reason || "—";
      return (
        <span
          title={txt}
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          {txt.length > 40 ? txt.slice(0, 40) + "…" : txt}
        </span>
      );
    },
  },
  {
    title: "Status",
    render: (_, r) => {
      const color = STATUS_COLOR[r?.status] || "var(--text-muted)";
      return (
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 600, color,
          }}
        >
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%", background: color,
              display: "inline-block",
            }}
          />
          {r?.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—"}
        </span>
      );
    },
  },
  ...(isPending
    ? [
        {
          title: "Actions",
          render: (_, r) => (
            <div style={{ display: "flex", gap: 6 }}>
              <Button
                size="small"
                icon={<CheckOutlined />}
                onClick={() => onApprove(r._id, r?.userId?.name, r?.totalDays)}
                style={{
                  borderColor: "#5BA89A", color: "#5BA89A",
                  fontWeight: 600, fontSize: 12,
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => onReject(r._id)}
                style={{
                  borderColor: "#D96B7A", color: "#D96B7A",
                  fontWeight: 600, fontSize: 12,
                }}
              >
                Reject
              </Button>
            </div>
          ),
        },
      ]
    : []),
];

/* ── Main component ──────────────────────────────────────────────── */
const LeaveManagement = () => {
  const dispatch = useDispatch();
  const { requests: _raw = [], loading, saving } = useSelector((s) => s.leaveRequests || {});
  const requests = Array.isArray(_raw) ? _raw : [];
  const { user: currentUser }              = useSelector((s) => s.auth || {});

  const schoolId = currentUser?.school?._id;

  /* ── Local state ── */
  const [approveModal, setApproveModal]   = useState({ open: false, id: null, name: "", days: 0 });
  const [rejectModal,  setRejectModal]    = useState({ open: false, id: null });
  const [rejectReason, setRejectReason]   = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  /* ── Fetch ── */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchLeaveRequests({ schoolId }));
  }, [schoolId, dispatch]);

  /* ── Derived lists ── */
  const pending  = useMemo(() => requests.filter((r) => r.status === "pending"),  [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const rejected = useMemo(() => requests.filter((r) => r.status === "rejected"), [requests]);

  /* ── Approve flow ── */
  const openApprove = (id, name, days) =>
    setApproveModal({ open: true, id, name: name || "this person", days: days || 0 });

  const handleApprove = async () => {
    try {
      await dispatch(approveLeaveRequest(approveModal.id)).unwrap();
      message.success("Leave approved successfully");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to approve leave");
    } finally {
      setApproveModal({ open: false, id: null, name: "", days: 0 });
    }
  };

  /* ── Reject flow ── */
  const openReject = (id) => { setRejectReason(""); setRejectModal({ open: true, id }); };

  const handleReject = async () => {
    if (!rejectReason.trim()) return message.warning("Please enter a rejection reason");
    try {
      await dispatch(rejectLeaveRequest({ id: rejectModal.id, rejectionReason: rejectReason })).unwrap();
      message.success("Leave rejected");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to reject leave");
    } finally {
      setRejectModal({ open: false, id: null });
      setRejectReason("");
    }
  };

  /* ── Create leave flow ── */
  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      const { startDate, endDate, ...rest } = vals;
      const start = startDate ? startDate.startOf("day").toISOString() : null;
      const end   = endDate   ? endDate.startOf("day").toISOString()   : null;
      const totalDays =
        startDate && endDate ? endDate.diff(startDate, "day") + 1 : 1;

      await dispatch(
        createLeaveRequest({ ...rest, schoolId, startDate: start, endDate: end, totalDays })
      ).unwrap();
      message.success("Leave request created");
      form.resetFields();
      setCreateModalOpen(false);
    } catch (e) {
      if (e?.errorFields) return; // AntD validation error
      message.error(typeof e === "string" ? e : "Failed to create leave request");
    }
  };

  /* ── Table columns instances ── */
  const pendingCols  = buildColumns({ isPending: true,  onApprove: openApprove, onReject: openReject });
  const resolvedCols = buildColumns({ isPending: false });

  const tableProps = (data, isPending) => ({
    rowKey: "_id",
    columns: isPending ? pendingCols : resolvedCols,
    dataSource: data,
    pagination: { pageSize: 15, showSizeChanger: false },
    scroll: { x: 750 },
    locale: {
      emptyText: (
        <div style={{ padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
          No leave requests found
        </div>
      ),
    },
  });

  /* ── Tabs items ── */
  const tabItems = [
    {
      key: "pending",
      label: (
        <span>
          Pending{" "}
          {pending.length > 0 && (
            <Badge
              count={pending.length}
              style={{ backgroundColor: "#D4922A", marginLeft: 4 }}
            />
          )}
        </span>
      ),
      children: <Table {...tableProps(pending, true)} />,
    },
    {
      key: "approved",
      label: `Approved (${approved.length})`,
      children: <Table {...tableProps(approved, false)} />,
    },
    {
      key: "rejected",
      label: `Rejected (${rejected.length})`,
      children: <Table {...tableProps(rejected, false)} />,
    },
    {
      key: "all",
      label: `All (${requests.length})`,
      children: <Table {...tableProps(requests, false)} />,
    },
  ];

  /* ── Render ── */
  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Leave Management"
        subtitle="Review, approve and manage all leave requests"
        icon={<CalendarOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Leave
          </Button>
        }
      />

      {/* ── Stats bar ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
          marginBottom: 4,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Pending",  count: pending.length,  color: "#D4922A" },
          { label: "Approved", count: approved.length, color: "#5BA89A" },
          { label: "Rejected", count: rejected.length, color: "#D96B7A" },
          { label: "Total",    count: requests.length, color: "var(--primary)" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-muted)",
              borderRadius: 12,
              padding: "12px 20px",
              minWidth: 100,
              flex: "1 1 100px",
            }}
          >
            <div
              style={{
                fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2 }}>
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ ...sectionPanel, marginTop: 16 }}>
        <Spin spinning={loading}>
          <Tabs items={tabItems} defaultActiveKey="pending" />
        </Spin>
      </div>

      {/* ── Approve Modal ── */}
      <Modal
        open={approveModal.open}
        title={
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            Approve Leave Request
          </span>
        }
        onOk={handleApprove}
        onCancel={() => setApproveModal({ open: false, id: null, name: "", days: 0 })}
        okText="Approve"
        okButtonProps={{ style: { background: "#5BA89A", borderColor: "#5BA89A" } }}
        confirmLoading={loading}
        width={400}
      >
        <p style={{ color: "var(--text-primary)", margin: "16px 0 8px" }}>
          Approve leave for{" "}
          <strong>{approveModal.name}</strong> ({approveModal.days} day
          {approveModal.days !== 1 ? "s" : ""})?
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          This action will notify the employee and update records.
        </p>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal
        open={rejectModal.open}
        title={
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            Reject Leave Request
          </span>
        }
        onOk={handleReject}
        onCancel={() => { setRejectModal({ open: false, id: null }); setRejectReason(""); }}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
        width={420}
      >
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8,
            }}
          >
            Rejection Reason <span style={{ color: "#D96B7A" }}>*</span>
          </div>
          <TextArea
            rows={4}
            placeholder="Enter reason for rejection…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Create Leave Modal ── */}
      <Modal
        open={createModalOpen}
        title={
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            Create Leave Request
          </span>
        }
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText="Create"
        confirmLoading={saving}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="User ID / Name" name="userId" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Enter user ID" />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select role"
              options={[
                { value: "Teacher", label: "Teacher" },
                { value: "Staff",   label: "Staff"   },
                { value: "Student", label: "Student" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Leave Type" name="leaveType" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select leave type"
              options={[
                { value: "sick",      label: "Sick"      },
                { value: "casual",    label: "Casual"    },
                { value: "paid",      label: "Paid"      },
                { value: "emergency", label: "Emergency" },
                { value: "other",     label: "Other"     },
              ]}
            />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="End Date" name="endDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: "Required" }]}>
            <TextArea rows={3} placeholder="Enter leave reason…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
