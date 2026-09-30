import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Form, Input, DatePicker, Select, Modal, Table, Tag, Popconfirm, message, Empty, Radio, Switch,
  Progress, Segmented, Tooltip as AntTooltip,
} from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import {
  getMyLeaveRequests,
  createLeaveRequest,
  deleteLeaveRequest,
  fetchMyLeaveBalance,
} from "../../../features/leaveRequestSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { getRoleName } from "../../../utils/roles";

const { RangePicker } = DatePicker;

const STATUS_COLOR = { pending: "orange", approved: "green", rejected: "red" };

const LEAVE_TYPES = [
  { value: "sick",      label: "Sick Leave" },
  { value: "casual",    label: "Casual Leave (CL)" },
  { value: "paid",      label: "Earned Leave (EL)" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "other",     label: "Other" },
];
const SHORT_TYPE = { casual: "CL", paid: "EL" };
const HALF_LABEL = { A: "1st half", B: "2nd half" };
const fyLabel = (fy) => (fy ? `${fy}-${String(fy + 1).slice(2)}` : "");

const tile = {
  border: "1px solid var(--border-muted)", borderRadius: 12, padding: "10px 12px",
  background: "var(--surface)", minWidth: 0,
};
const tileLabel = (color) => ({ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" });

// One balance (CL or EL): what is free now, with a bar of how much of what was earned is spent.
const BalanceTile = ({ label, b, color }) => {
  const total = (b?.earned || 0) + (b?.adjusted || 0);
  const spent = (b?.used || 0) + (b?.pending || 0) + (b?.encashed || 0);
  return (
    <div style={tile}>
      <div style={tileLabel(color)}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{b?.available ?? 0}</span>
        <span className="u-muted" style={{ fontSize: 11 }}>left of {total}</span>
      </div>
      <AntTooltip title={`Used ${b?.used || 0} · Pending ${b?.pending || 0}${b?.encashed ? ` · Paid out ${b.encashed}` : ""}`}>
        <Progress percent={total ? Math.min((spent / total) * 100, 100) : 0} showInfo={false} size="small" strokeColor={color} style={{ margin: "4px 0 0" }} />
      </AntTooltip>
      <div className="u-muted" style={{ fontSize: 11 }}>
        Used {b?.used ?? 0}{b?.pending ? ` · Pending ${b.pending}` : ""}
      </div>
    </div>
  );
};

const TeacherLeave = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { myRequests = [], loading, saving, myBalance } = useSelector((s) => s.leaveRequests || {});
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form] = Form.useForm();
  const halfDay = Form.useWatch("halfDay", form);
  const isStaff = Boolean(myBalance?.isStaff);

  const refresh = () => {
    dispatch(getMyLeaveRequests());
    dispatch(fetchMyLeaveBalance());
  };
  useEffect(() => { refresh(); }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Staff take only CL or EL, paid from what they have earned; each option says what is left.
  const typeOptions = isStaff
    ? [
        { value: "casual", label: `Casual Leave (CL) · ${myBalance?.CL?.available ?? 0} left`, disabled: !(myBalance?.CL?.available > 0) },
        { value: "paid",   label: `Earned Leave (EL) · ${myBalance?.EL?.available ?? 0} left`, disabled: !(myBalance?.EL?.available > 0) },
      ]
    : LEAVE_TYPES;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const [from, to] = values.halfDay ? [values.date, values.date] : values.dateRange;
    const roleSlug = (getRoleName(user) || "teacher").toLowerCase().replace(/\s+/g, "_");
    const result = await dispatch(createLeaveRequest({
      role: roleSlug,
      leaveType: values.leaveType,
      reason: values.reason,
      // Plain calendar days: the school's day is IST, and a UTC timestamp can shift it.
      startDate: from.format("YYYY-MM-DD"),
      endDate: to.format("YYYY-MM-DD"),
      totalDays: values.halfDay ? 0.5 : to.diff(from, "day") + 1,
      halfDaySession: values.halfDay ? values.halfDaySession : null,
    }));
    if (createLeaveRequest.fulfilled.match(result)) {
      message.success("Leave request submitted.");
      form.resetFields();
      setOpen(false);
      refresh();
    } else {
      message.error(result.payload || "Failed to submit leave request.");
    }
  };

  const handleDelete = async (id) => {
    const result = await dispatch(deleteLeaveRequest(id));
    if (deleteLeaveRequest.fulfilled.match(result)) {
      message.success("Leave request cancelled.");
      dispatch(fetchMyLeaveBalance());
    } else {
      message.error("Failed to cancel.");
    }
  };

  const counts = {
    all:      myRequests.length,
    pending:  myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  };
  const shown = filter === "all" ? myRequests : myRequests.filter((r) => r.status === filter);

  const monthly = useMemo(
    () => (myBalance?.monthly || []).map((m) => ({ ...m, label: dayjs(`${m.month}-01`).format("MMM") })),
    [myBalance],
  );
  const thisMonth = monthly.find((m) => m.month === dayjs().format("YYYY-MM")) || {};
  // Consumed this month: approved plus applied-for (still pending), so a request counts the
  // moment it is made; the chart shows only what has been approved.
  const approvedNow = (thisMonth.CL || 0) + (thisMonth.EL || 0);
  const pendingNow = (thisMonth.pendingCL || 0) + (thisMonth.pendingEL || 0);

  const columns = [
    {
      title: "Type",
      dataIndex: "leaveType",
      render: (v) => <Tag color={v === "casual" ? "blue" : v === "paid" ? "green" : "default"}>{SHORT_TYPE[v] || LEAVE_TYPES.find((t) => t.value === v)?.label || v || "—"}</Tag>,
    },
    {
      title: "Dates",
      render: (_, r) => (
        <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>
          {r.startDate ? dayjs(r.startDate).format("DD MMM") : "—"}
          {r.endDate && !dayjs(r.endDate).isSame(dayjs(r.startDate), "day") ? ` – ${dayjs(r.endDate).format("DD MMM YYYY")}` : r.startDate ? ` ${dayjs(r.startDate).format("YYYY")}` : ""}
        </span>
      ),
    },
    {
      title: "Days",
      render: (_, r) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {r.totalDays ?? "—"}
          {r.halfDaySession ? <span className="u-muted" style={{ fontSize: 11 }}> · {HALF_LABEL[r.halfDaySession]}</span> : null}
        </span>
      ),
    },
    { title: "Reason", dataIndex: "reason", ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      render: (v, r) => (
        <>
          <Tag color={STATUS_COLOR[v] || "default"}>{String(v || "—").toUpperCase()}</Tag>
          {r.rejectionReason ? <div style={{ color: "var(--danger)", fontSize: 11 }}>{r.rejectionReason}</div> : null}
        </>
      ),
    },
    {
      title: "Applied",
      dataIndex: "createdAt",
      render: (v) => v ? <span className="u-muted" style={{ fontSize: 12 }}>{dayjs(v).format("DD MMM")}</span> : "—",
    },
    {
      title: "",
      render: (_, r) => r.status === "pending" ? (
        <Popconfirm title="Cancel this leave request?" onConfirm={() => handleDelete(r._id)} okText="Cancel" okButtonProps={{ danger: true }}>
          <Button size="small" danger type="text">Cancel</Button>
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <div className="page-wrapper">
      <PageHeader
        title="My Leave Requests"
        subtitle="Your leave balance, what you have used, and your applications"
        icon={<CalendarOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Apply Leave
          </Button>
        }
      />

      {isStaff && (
        <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            <span className="u-title">Leave balance · {fyLabel(myBalance.fy)}</span>
            <span className="u-muted" style={{ fontSize: 11.5 }}>
              +{myBalance.policy?.clPerMonth ?? 1} CL and +{myBalance.policy?.elPerMonth ?? 0.5} EL every month · unused leave is paid with March salary
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, alignContent: "start" }}>
              <BalanceTile label="Casual (CL)" b={myBalance.CL} color="var(--primary)" />
              <BalanceTile label="Earned (EL)" b={myBalance.EL} color="var(--success)" />
              <div style={tile}>
                <div style={tileLabel("var(--warning)")}>{dayjs().format("MMM")} consumed</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{approvedNow + pendingNow}</span>
                  <span className="u-muted" style={{ fontSize: 11 }}>day(s)</span>
                </div>
                <div className="u-muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.6 }}>
                  Approved {approvedNow}
                  <br />
                  Pending {pendingNow}
                </div>
              </div>
            </div>
            <div>
              <div className="u-muted" style={{ fontSize: 11, marginBottom: 4 }}>Approved leave by month</div>
              <div style={{ width: "100%", height: 150 }}>
                <ResponsiveContainer>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} tickLine={false} />
                    <YAxis allowDecimals tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v, name) => [`${v} day(s)`, name]} cursor={{ fill: "var(--border-muted)", opacity: 0.4 }} />
                    <Bar dataKey="CL" name="CL" stackId="leave" fill="var(--primary)" />
                    <Bar dataKey="EL" name="EL" stackId="leave" fill="var(--success)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-panel" style={{ marginTop: 16, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <span className="u-title">My applications</span>
          <Segmented
            size="small"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All ${counts.all}` },
              { value: "pending", label: `Pending ${counts.pending}` },
              { value: "approved", label: `Approved ${counts.approved}` },
              { value: "rejected", label: `Rejected ${counts.rejected}` },
            ]}
          />
        </div>
        <Table
          size="small"
          columns={columns} dataSource={shown} rowKey="_id"
          loading={loading} pagination={{ pageSize: 8, hideOnSinglePage: true }} scroll={{ x: "max-content" }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No leave requests" /> }}
        />
      </div>

      <Modal title="Apply for Leave" open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} destroyOnClose width={440}>
        {isStaff && !(myBalance?.CL?.available > 0) && !(myBalance?.EL?.available > 0) && (
          <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="No leave balance left" description="You can apply once more CL or EL is earned next month." />
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ halfDay: false, halfDaySession: "A" }} requiredMark={false}>
          <Form.Item label="Leave type" name="leaveType" rules={[{ required: true, message: "Choose a leave type" }]}>
            <Select placeholder="Select leave type" options={typeOptions} />
          </Form.Item>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Form.Item name="halfDay" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
            <span style={{ fontSize: 13 }}>Half day</span>
          </div>
          {halfDay ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <Form.Item label="Date" name="date" rules={[{ required: true, message: "Pick a date" }]}>
                <DatePicker className="u-full" disabledDate={(d) => d && d.isBefore(dayjs(), "day")} />
              </Form.Item>
              <Form.Item label="Half" name="halfDaySession" rules={[{ required: true }]}>
                <Radio.Group optionType="button" buttonStyle="solid" options={[{ value: "A", label: "A · 1st" }, { value: "B", label: "B · 2nd" }]} />
              </Form.Item>
            </div>
          ) : (
            <Form.Item label="Dates" name="dateRange" rules={[{ required: true, message: "Pick the dates" }]}
              extra={isStaff ? "Sundays and holidays in between are not counted." : undefined}>
              <RangePicker className="u-full" disabledDate={(d) => d && d.isBefore(dayjs(), "day")} />
            </Form.Item>
          )}
          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: "Add a reason" }]}>
            <Input.TextArea rows={2} placeholder="Reason for leave" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>Submit Request</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherLeave;
