import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, DatePicker, Empty, Form, Input, Modal, Popconfirm,
  Select, Space, Table, Tag, message,
} from "antd";
import { CalendarOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMyLeaveRequests,
  createLeaveRequest,
  deleteLeaveRequest,
} from "../../../features/leaveRequestSlice";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statCard, statLabel, statValue, statGrid } from "../../../styles/pageStyles";

const { TextArea } = Input;
const STAT_COLORS  = ["var(--accent)", "var(--warning)", "var(--success)", "var(--danger)"];
const LEAVE_TYPES  = ["sick", "casual", "emergency", "other"];

const statusColor = { pending: "orange", approved: "green", rejected: "red" };

const ChildLeave = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});
  const { myRequests = [], loading, saving } = useSelector((s) => s.leaveRequests || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [form]                                = Form.useForm();

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((c) => c.userId === selectedChildId),
    [children, selectedChildId]
  );

  const fetchLeaves = useCallback(() => {
    if (selectedChildId) dispatch(getMyLeaveRequests({ userId: selectedChildId, role: "student" }));
  }, [dispatch, selectedChildId]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const stats = useMemo(() => ({
    total:    myRequests.length,
    pending:  myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  }), [myRequests]);

  const statMeta = [
    { key: "total",    label: "Total",    value: stats.total    },
    { key: "pending",  label: "Pending",  value: stats.pending  },
    { key: "approved", label: "Approved", value: stats.approved },
    { key: "rejected", label: "Rejected", value: stats.rejected },
  ];

  const handleSubmit = async (values) => {
    if (!selectedChildId) { message.warning("Select a child first"); return; }
    try {
      const [from, to] = values.dateRange;
      const totalDays = to.diff(from, "day") + 1;
      await dispatch(createLeaveRequest({
        role:      "student",
        userId:    selectedChildId,
        leaveType: values.leaveType,
        reason:    values.reason,
        startDate: from.toISOString(),
        endDate:   to.toISOString(),
        totalDays,
      })).unwrap();
      message.success("Leave request submitted successfully");
      setModalOpen(false);
      form.resetFields();
      fetchLeaves();
    } catch (err) {
      message.error(err?.message || "Failed to submit leave request");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteLeaveRequest(id)).unwrap();
      message.success("Leave request cancelled");
      fetchLeaves();
    } catch (err) {
      message.error(err?.message || "Failed to cancel leave");
    }
  };

  const columns = [
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      render: (v) => <Tag color="blue">{String(v || "—").toUpperCase()}</Tag>,
    },
    {
      title: "From",
      dataIndex: "startDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title: "To",
      dataIndex: "endDate",
      render: (v) => v ? dayjs(v).format("DD MMM YYYY") : "—",
    },
    {
      title: "Days",
      render: (_, r) => {
        if (!r.startDate || !r.endDate) return "—";
        return dayjs(r.endDate).diff(dayjs(r.startDate), "day") + 1;
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={statusColor[s] || "default"}>{String(s || "—").toUpperCase()}</Tag>,
    },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "pending" ? (
          <Popconfirm
            title="Cancel this leave request?"
            onConfirm={() => handleDelete(r._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Cancel</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Child Leave Requests"
        subtitle="Apply leave for your child and track approval status."
        icon={<CalendarOutlined />}
        extra={
          <Space>
            <Select
              placeholder="Select child"
              value={selectedChildId}
              onChange={(v) => setSelectedChildId(v)}
              loading={childLoading}
              style={{ minWidth: 200 }}
              options={children.map((c) => ({ label: c.name, value: c.userId }))}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchLeaves}>Refresh</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              disabled={!selectedChildId}
            >
              Apply Leave
            </Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        <div className="stat-grid" style={statGrid(160)}>
          {statMeta.map(({ key, label, value }, i) => (
            <div key={key} style={statCard({ color: STAT_COLORS[i] })}>
              <div>
                <div style={statLabel(STAT_COLORS[i])}>{label}</div>
                <div style={statValue(STAT_COLORS[i])}>{value}</div>
              </div>
              <div style={{ fontSize: 26, color: STAT_COLORS[i], opacity: 0.5 }}><CalendarOutlined /></div>
            </div>
          ))}
        </div>

        <div style={sectionPanel}>
          {!selectedChildId ? (
            <Empty description="Select a child to view leave requests" />
          ) : !myRequests.length ? (
            <Empty description="No leave requests submitted yet" />
          ) : (
            <Table
              columns={columns}
              dataSource={myRequests}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 700 }}
            />
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        open={modalOpen}
        title={`Apply Leave — ${selectedChild?.name || "Child"}`}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Submit"
        confirmLoading={saving}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select options={LEAVE_TYPES.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))} />
          </Form.Item>
          <Form.Item name="dateRange" label="Leave Dates" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: "100%" }} disabledDate={(d) => d && d.isBefore(dayjs(), "day")} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, min: 10, message: "Please provide a reason (min 10 chars)" }]}>
            <TextArea rows={3} placeholder="Reason for leave..." maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ChildLeave;
