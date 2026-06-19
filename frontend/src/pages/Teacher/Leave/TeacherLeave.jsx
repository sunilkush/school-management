import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, DatePicker, Select, Modal, Table, Tag, Popconfirm, message, Empty,
} from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMyLeaveRequests,
  createLeaveRequest,
  deleteLeaveRequest,
} from "../../../features/leaveRequestSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell } from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

const STATUS_COLOR = { pending: "orange", approved: "green", rejected: "red" };

const LEAVE_TYPES = [
  { value: "sick",        label: "Sick Leave" },
  { value: "casual",      label: "Casual Leave" },
  { value: "earned",      label: "Earned Leave" },
  { value: "maternity",   label: "Maternity Leave" },
  { value: "paternity",   label: "Paternity Leave" },
  { value: "personal",    label: "Personal Leave" },
  { value: "other",       label: "Other" },
];

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const TeacherLeave = () => {
  const dispatch = useDispatch();
  const { myRequests = [], loading, saving } = useSelector((s) => s.leaveRequests || {});
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(getMyLeaveRequests()); }, [dispatch]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const [from, to] = values.dateRange;
    const result = await dispatch(createLeaveRequest({
      role: "teacher",
      leaveType: values.leaveType,
      reason: values.reason,
      startDate: from.toISOString(),
      endDate: to.toISOString(),
    }));
    if (createLeaveRequest.fulfilled.match(result)) {
      message.success("Leave request submitted.");
      form.resetFields();
      setOpen(false);
      dispatch(getMyLeaveRequests());
    } else {
      message.error(result.payload || "Failed to submit leave request.");
    }
  };

  const handleDelete = async (id) => {
    const result = await dispatch(deleteLeaveRequest(id));
    if (deleteLeaveRequest.fulfilled.match(result)) {
      message.success("Leave request cancelled.");
    } else {
      message.error("Failed to cancel.");
    }
  };

  const stats = {
    total:    myRequests.length,
    pending:  myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  };

  const columns = [
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      render: (v) => LEAVE_TYPES.find((t) => t.value === v)?.label || v || "—",
    },
    {
      title: "Dates",
      render: (_, r) => (
        <span style={{ fontSize: 13 }}>
          {r.startDate ? dayjs(r.startDate).format("DD MMM YYYY") : "—"}
          {r.endDate && r.startDate !== r.endDate ? ` → ${dayjs(r.endDate).format("DD MMM YYYY")}` : ""}
        </span>
      ),
    },
    {
      title: "Days",
      render: (_, r) => {
        if (!r.startDate || !r.endDate) return "—";
        return dayjs(r.endDate).diff(dayjs(r.startDate), "day") + 1;
      },
    },
    { title: "Reason", dataIndex: "reason", ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{String(v || "—").toUpperCase()}</Tag>,
    },
    {
      title: "Rejection Note",
      dataIndex: "rejectionReason",
      render: (v) => v ? <span style={{ color: "#D96B7A", fontSize: 12 }}>{v}</span> : "—",
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title: "Actions",
      render: (_, r) => r.status === "pending" ? (
        <Popconfirm title="Cancel this leave request?" onConfirm={() => handleDelete(r._id)} okText="Cancel" okButtonProps={{ danger: true }}>
          <Button size="small" danger>Cancel</Button>
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Leave Requests"
        subtitle="Apply for and track your leave applications"
        icon={<CalendarOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Apply Leave
          </Button>
        }
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<CalendarOutlined />} label="Total"    value={stats.total}    color="#9B87B8" />
        <StatCard icon={<CalendarOutlined />} label="Pending"  value={stats.pending}  color="#D4922A" />
        <StatCard icon={<CalendarOutlined />} label="Approved" value={stats.approved} color="#5BA89A" />
        <StatCard icon={<CalendarOutlined />} label="Rejected" value={stats.rejected} color="#D96B7A" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <Table
          columns={columns} dataSource={myRequests} rowKey="_id"
          loading={loading} pagination={{ pageSize: 8 }}
          locale={{ emptyText: <Empty description="No leave requests yet" /> }}
        />
      </div>

      <Modal title="Apply for Leave" open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Leave Type" name="leaveType" rules={[{ required: true, message: "Required" }]}>
            <Select placeholder="Select leave type" options={LEAVE_TYPES} />
          </Form.Item>
          <Form.Item label="Date Range" name="dateRange" rules={[{ required: true, message: "Required" }]}>
            <RangePicker style={{ width: "100%" }} disabledDate={(d) => d && d.isBefore(dayjs(), "day")} />
          </Form.Item>
          <Form.Item label="Reason" name="reason" rules={[{ required: true, message: "Required" }]}>
            <Input.TextArea rows={3} placeholder="Reason for leave" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saving}>Submit Request</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherLeave;
