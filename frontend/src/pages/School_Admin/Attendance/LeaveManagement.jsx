import React, { useEffect, useMemo, useRef, useState } from "react";
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
  InputNumber,
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
  fetchLeaveBalances,
  adjustLeaveBalance,
  fetchCompOffClaims,
  approveCompOff,
  rejectCompOff,
} from "../../../features/leaveRequestSlice";
import PageHeader from "../../../components/layout/PageHeader";
import apiClient from "../../../api/httpClient";

const { TextArea } = Input;

// LeaveRequest.role in the backend model: each role name in snake_case.
const LEAVE_ROLES = [
  "student", "teacher", "class_teacher", "sports_teacher", "staff", "support_staff", "accountant",
  "librarian", "receptionist", "it_support", "counselor", "security", "hostel_warden",
  "transport_manager", "principal", "vice_principal", "subject_coordinator", "exam_coordinator",
  "school_admin", "lab_technician", "medical_officer", "driver",
];
const LEAVE_ROLE_OPTIONS = LEAVE_ROLES.map((value) => ({
  value,
  label: value.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
}));
const toLeaveRole = (roleName = "") => roleName.toLowerCase().trim().replace(/\s+/g, "_");

// Nobody files leave on behalf of these.
const NOT_ON_LEAVE = new Set(["parent", "super_admin"]);

/* ── Helpers ─────────────────────────────────────────────────────── */
const LEAVE_TYPE_COLOR = {
  sick:      "red",
  casual:    "blue",
  paid:      "green",
  compoff:   "purple",
  emergency: "orange",
  other:     "default",
};

const LEAVE_TYPE_LABEL = { casual: "Casual (CL)", paid: "Earned (EL)", compoff: "Comp Off (CO)", sick: "Sick", emergency: "Emergency", other: "Other" };
const HALF_LABEL = { A: "First half", B: "Second half" };

const STATUS_COLOR = {
  pending:  "var(--warning)",
  approved: "var(--success)",
  rejected: "var(--danger)",
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
      <span className="u-strong">
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
        {LEAVE_TYPE_LABEL[r?.leaveType] || r?.leaveType || "—"}
      </Tag>
    ),
  },
  {
    title: "Date Range",
    render: (_, r) => (
      <span className="u-meta">
        {fmtDate(r?.startDate)} — {fmtDate(r?.endDate)}
      </span>
    ),
  },
  {
    title: "Days",
    dataIndex: "totalDays",
    render: (v, r) => (
      <span style={{ fontWeight: 600 }}>
        {v ?? "—"}
        {r?.halfDaySession ? <Tag style={{ marginLeft: 6, fontWeight: 400 }}>{HALF_LABEL[r.halfDaySession]}</Tag> : null}
      </span>
    ),
  },
  {
    title: "Reason",
    render: (_, r) => {
      const txt = r?.reason || "—";
      return (
        <span
          title={txt}
          className="u-meta"
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
                  borderColor: "var(--success)", color: "var(--success)",
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
                  borderColor: "var(--danger)", color: "var(--danger)",
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
  const { requests: _raw = [], loading, saving, balances, balancesLoading } = useSelector((s) => s.leaveRequests || {});
  const requests = useMemo(() => Array.isArray(_raw) ? _raw : [], [_raw]);
  const { user: currentUser }              = useSelector((s) => s.auth || {});

  const schoolId = currentUser?.school?._id;

  /* ── Local state ── */
  const [approveModal, setApproveModal]   = useState({ open: false, id: null, name: "", days: 0 });
  const [rejectModal,  setRejectModal]    = useState({ open: false, id: null });
  const [rejectReason, setRejectReason]   = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [adjustFor, setAdjustFor] = useState(null);
  const [coClaims, setCoClaims] = useState([]);
  const [coLoading, setCoLoading] = useState(false);
  const loadCompOffs = () => {
    setCoLoading(true);
    dispatch(fetchCompOffClaims()).unwrap()
      .then((d) => setCoClaims(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCoLoading(false));
  };
  const [coReject, setCoReject] = useState({ id: null, reason: "" });
  const decideCompOff = async (id, approve, rejectionReason = "") => {
    if (!approve && !rejectionReason.trim()) {
      setCoReject({ id, reason: "" });
      return;
    }
    try {
      await dispatch(approve ? approveCompOff({ id }) : rejectCompOff({ id, body: { rejectionReason } })).unwrap();
      message.success(approve ? "Comp Off approved" : "Comp Off rejected");
      loadCompOffs();
      dispatch(fetchLeaveBalances());
      setCoReject({ id: null, reason: "" });
    } catch (e) {
      message.error(typeof e === "string" ? e : "Could not update the claim");
    }
  };
  const [adjustForm] = Form.useForm();

  /* ── Person picker ──
     This used to be a free-text "User ID / Name" box, but the server needs the user's id: a typed
     name was rejected, and an admin had no way to find anyone's id. Search the school's users by
     name, email or registration id instead, and take their role from the account. */
  const [userOptions, setUserOptions] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const searchTimer = useRef(null);
  const latestSearch = useRef("");

  const searchUsers = (term) => {
    clearTimeout(searchTimer.current);
    latestSearch.current = term;
    searchTimer.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await apiClient.get("/user/all", { params: { search: term, limit: 20 } });
        if (latestSearch.current !== term) return; // a newer search is on its way
        const users = Array.isArray(res?.data?.data) ? res.data.data : [];
        setUserOptions(
          users
            .filter((u) => !NOT_ON_LEAVE.has(toLeaveRole(u?.role?.name)))
            .map((u) => ({
              value: u._id,
              label: `${u.name}${u.role?.name ? ` · ${u.role.name}` : ""}${u.email ? ` (${u.email})` : ""}`,
              leaveRole: toLeaveRole(u?.role?.name),
            }))
        );
      } catch {
        if (latestSearch.current === term) setUserOptions([]);
      } finally {
        if (latestSearch.current === term) setUserSearching(false);
      }
    }, 300);
  };

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const openCreate = () => {
    form.resetFields();
    setUserOptions([]);
    setCreateModalOpen(true);
    searchUsers("");
  };

  const onPickUser = (_value, option) => {
    if (LEAVE_ROLES.includes(option?.leaveRole)) form.setFieldsValue({ role: option.leaveRole });
  };

  /* ── Fetch ── */
  useEffect(() => {
    if (!schoolId) return;
    // The page splits one list into Pending / Approved / Rejected tabs itself, so it needs all of
    // it — the API returns 20 by default, which hid every older request, pending ones included.
    dispatch(fetchLeaveRequests({ schoolId, limit: 1000 }));
    dispatch(fetchLeaveBalances());
    loadCompOffs();
  }, [schoolId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Balance adjustment (opening balance or a correction) ── */
  const handleAdjust = async () => {
    try {
      const vals = await adjustForm.validateFields();
      await dispatch(adjustLeaveBalance({ userId: adjustFor.userId, ...vals })).unwrap();
      message.success(`${vals.leaveType} balance updated for ${adjustFor.name}`);
      setAdjustFor(null);
      adjustForm.resetFields();
      dispatch(fetchLeaveBalances());
    } catch (e) {
      if (e?.errorFields) return;
      message.error(typeof e === "string" ? e : "Could not update the balance");
    }
  };

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
      dispatch(fetchLeaveBalances());
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
      // Local calendar-date strings, not .toISOString() — avoids the day-shift toISOString()
      // causes near midnight for positive-UTC-offset zones (IST included).
      const start = startDate ? startDate.format("YYYY-MM-DD") : null;
      const end   = endDate   ? endDate.format("YYYY-MM-DD")   : null;
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
              style={{ backgroundColor: "var(--warning)", marginLeft: 4 }}
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
    {
      key: "compoff",
      label: (
        <span>
          Comp Off{" "}
          {coClaims.filter((c) => c.status === "pending").length > 0 && (
            <Badge count={coClaims.filter((c) => c.status === "pending").length} style={{ backgroundColor: "var(--purple)", marginLeft: 4 }} />
          )}
        </span>
      ),
      children: (
        <>
          <div className="u-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Staff claim a Sunday or holiday they worked. Approving adds it to their Comp Off (CO) balance.
          </div>
          <Table
            rowKey="_id"
            loading={coLoading}
            dataSource={coClaims}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 700 }}
            columns={[
              { title: "Name", render: (_, r) => <span className="u-strong">{r.userId?.name || "—"}</span> },
              { title: "Day worked", dataIndex: "date", render: (v) => dayjs(v).format("ddd, DD MMM YYYY") },
              { title: "Days", dataIndex: "days" },
              { title: "Work", dataIndex: "reason", ellipsis: true },
              {
                title: "Status", dataIndex: "status",
                render: (v, r) => (
                  <>
                    <Tag color={v === "approved" ? "green" : v === "rejected" ? "red" : "orange"}>{String(v).toUpperCase()}</Tag>
                    {r.decidedBy?.name ? <div className="u-muted" style={{ fontSize: 11 }}>by {r.decidedBy.name}</div> : null}
                  </>
                ),
              },
              {
                title: "",
                render: (_, r) => r.status === "pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button size="small" icon={<CheckOutlined />} onClick={() => decideCompOff(r._id, true)}>Approve</Button>
                    <Button size="small" danger icon={<CloseOutlined />} onClick={() => decideCompOff(r._id, false)}>Reject</Button>
                  </div>
                ) : null,
              },
            ]}
          />
        </>
      ),
    },
    {
      key: "balances",
      label: "Leave Balances",
      children: (
        <>
          <div className="u-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Financial year {balances?.fy ? `${balances.fy}-${String(balances.fy + 1).slice(2)}` : ""}. Staff earn CL and EL every month;
            leave is approved only against what is available, and what is left on 31 March is paid with March salary.
          </div>
          <Table
            rowKey="userId"
            loading={balancesLoading}
            dataSource={balances?.rows || []}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 750 }}
            columns={[
              { title: "Name", render: (_, r) => <span className="u-strong">{r.name}</span>, sorter: (a, b) => String(a.name).localeCompare(String(b.name)) },
              { title: "Code", dataIndex: "employeeCode", render: (v) => v || "—" },
              ...["CL", "EL", "CO"].map((t) => ({
                title: { CL: "Casual (CL)", EL: "Earned (EL)", CO: "Comp Off (CO)" }[t],
                render: (_, r) => (
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{r[t]?.available ?? 0}</span>
                    <span className="u-muted" style={{ fontSize: 11 }}> available</span>
                    <div className="u-muted" style={{ fontSize: 11 }}>
                      Earned {r[t]?.earned ?? 0}{r[t]?.adjusted ? ` · Adj ${r[t].adjusted > 0 ? "+" : ""}${r[t].adjusted}` : ""} · Used {r[t]?.used ?? 0}{r[t]?.pending ? ` · Pending ${r[t].pending}` : ""}
                    </div>
                  </div>
                ),
              })),
              {
                title: "",
                render: (_, r) => (
                  <Button size="small" onClick={() => { adjustForm.resetFields(); setAdjustFor(r); }}>Adjust</Button>
                ),
              },
            ]}
          />
        </>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Leave Management"
        subtitle="Review, approve and manage all leave requests"
        icon={<CalendarOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
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
          { label: "Pending",  count: pending.length,  color: "var(--warning)" },
          { label: "Approved", count: approved.length, color: "var(--success)" },
          { label: "Rejected", count: rejected.length, color: "var(--danger)" },
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
      <div className="section-panel u-mt-4">
        <Spin spinning={loading}>
          <Tabs items={tabItems} defaultActiveKey="pending" />
        </Spin>
      </div>

      {/* ── Approve Modal ── */}
      <Modal
        open={approveModal.open}
        title={
          <span className="u-strong-bold">
            Approve Leave Request
          </span>
        }
        onOk={handleApprove}
        onCancel={() => setApproveModal({ open: false, id: null, name: "", days: 0 })}
        okText="Approve"
        okButtonProps={{ style: { background: "var(--success)", borderColor: "var(--success)" } }}
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
          <span className="u-strong-bold">
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
        <div className="u-mt-4">
          <div
            style={{
              fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8,
            }}
          >
            Rejection Reason <span style={{ color: "var(--danger)" }}>*</span>
          </div>
          <TextArea
            rows={4}
            placeholder="Enter reason for rejection…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Reject Comp Off Modal ── */}
      <Modal
        open={Boolean(coReject.id)}
        title={<span className="u-strong-bold">Reject Comp Off claim</span>}
        onOk={() => {
          if (!coReject.reason.trim()) return message.warning("Please enter a reason");
          return decideCompOff(coReject.id, false, coReject.reason);
        }}
        onCancel={() => setCoReject({ id: null, reason: "" })}
        okText="Reject"
        okButtonProps={{ danger: true }}
        width={420}
      >
        <TextArea rows={3} className="u-mt-4" placeholder="Reason for rejection…" value={coReject.reason}
          onChange={(e) => setCoReject((c) => ({ ...c, reason: e.target.value }))} />
      </Modal>

      {/* ── Adjust Balance Modal ── */}
      <Modal
        open={Boolean(adjustFor)}
        title={<span className="u-strong-bold">Adjust leave balance · {adjustFor?.name}</span>}
        onOk={handleAdjust}
        onCancel={() => setAdjustFor(null)}
        okText="Save"
        width={420}
        destroyOnClose
      >
        <Form form={adjustForm} layout="vertical" className="u-mt-4" initialValues={{ leaveType: "CL" }}>
          <Form.Item label="Leave" name="leaveType" rules={[{ required: true }]}>
            <Select options={[{ value: "CL", label: "Casual (CL)" }, { value: "EL", label: "Earned (EL)" }, { value: "CO", label: "Comp Off (CO)" }]} />
          </Form.Item>
          <Form.Item label="Days to add (use minus to take away)" name="days" rules={[{ required: true, message: "Required" }]}
            extra="Whole or half days, e.g. 2 or -0.5">
            <InputNumber className="u-full" step={0.5} min={-365} max={365} />
          </Form.Item>
          <Form.Item label="Note" name="note" rules={[{ required: true, message: "Say why, e.g. opening balance" }]}>
            <TextArea rows={2} placeholder="e.g. Opening balance carried from the old register" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Create Leave Modal ── */}
      <Modal
        open={createModalOpen}
        title={
          <span className="u-strong-bold">
            Create Leave Request
          </span>
        }
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText="Create"
        confirmLoading={saving}
        width={480}
      >
        <Form form={form} layout="vertical" className="u-mt-4">
          <Form.Item label="Person" name="userId" rules={[{ required: true, message: "Choose who the leave is for" }]}>
            <Select
              showSearch
              placeholder="Search by name, email or registration id"
              filterOption={false}
              onSearch={searchUsers}
              onChange={onPickUser}
              options={userOptions}
              loading={userSearching}
              notFoundContent={userSearching ? <Spin size="small" /> : "No matching user in this school"}
            />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true, message: "Required" }]}>
            <Select placeholder="Filled in from the person — change if needed" options={LEAVE_ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item label="Leave Type" name="leaveType" rules={[{ required: true, message: "Required" }]}>
            <Select
              placeholder="Select leave type"
              options={[
                { value: "sick",      label: "Sick"      },
                { value: "casual",    label: "Casual (CL)" },
                { value: "paid",      label: "Earned (EL)" },
                { value: "compoff",   label: "Comp Off (CO)" },
                { value: "emergency", label: "Emergency" },
                { value: "other",     label: "Other"     },
              ]}
            />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Start Date" name="startDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker className="u-full" />
            </Form.Item>
            <Form.Item label="End Date" name="endDate" rules={[{ required: true, message: "Required" }]}>
              <DatePicker className="u-full" />
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
