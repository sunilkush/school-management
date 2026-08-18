import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Spin,
  Empty,
  message,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchTickets, createTicket, updateTicketStatus, resolveTicket } from "../../../features/supportTicketSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  tableContainer,
  tableHeadCss,
  pill,
  modalTitle,
} from "../../../styles/pageStyles";

const { Search } = Input;
const { Option } = Select;

const TABLE_CLS = "tickets-tbl";

const PRIORITY_COLOR = {
  low:      { color: "var(--success)",  label: "Low" },
  medium:   { color: "var(--warning)",  label: "Medium" },
  high:     { color: "var(--danger)",   label: "High" },
  critical: { color: "var(--accent)",   label: "Critical" },
};

const STATUS_COLOR = {
  open:        { color: "var(--primary)", label: "Open" },
  in_progress: { color: "var(--warning)", label: "In Progress" },
  resolved:    { color: "var(--success)", label: "Resolved" },
  closed:      { color: "var(--text-muted)", label: "Closed" },
};

const TicketPage = () => {
  const dispatch = useDispatch();
  const { tickets = [], loading, error } = useSelector((s) => s.supportTickets || {});

  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText]     = useState("");

  // View modal
  const [viewTicket, setViewTicket]     = useState(null);
  const [viewOpen, setViewOpen]         = useState(false);

  // Resolve modal
  const [resolveOpen, setResolveOpen]   = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveForm] = Form.useForm();
  const [resolving, setResolving]       = useState(false);

  // Status update
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusOpen, setStatusOpen]     = useState(false);
  const [statusForm] = Form.useForm();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New ticket modal
  const [newOpen, setNewOpen]           = useState(false);
  const [newForm] = Form.useForm();
  const [creating, setCreating]         = useState(false);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return (tickets || []).filter((t) => {
      const matchSearch = !searchText ||
        (t.title || "").toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, searchText, statusFilter]);

  /* ── Handlers ── */
  const handleResolve = async (values) => {
    setResolving(true);
    try {
      await dispatch(resolveTicket({ id: resolveTarget._id, resolution: values.resolution })).unwrap();
      message.success("Ticket resolved successfully");
      setResolveOpen(false);
      resolveForm.resetFields();
    } catch (err) {
      message.error(err || "Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  const handleStatusUpdate = async (values) => {
    setUpdatingStatus(true);
    try {
      await dispatch(updateTicketStatus({ id: statusTarget._id, status: values.status })).unwrap();
      message.success("Status updated");
      setStatusOpen(false);
      statusForm.resetFields();
    } catch (err) {
      message.error(err || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      await dispatch(createTicket(values)).unwrap();
      message.success("Ticket created successfully");
      setNewOpen(false);
      newForm.resetFields();
    } catch (err) {
      message.error(err || "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  /* ── Columns ── */
  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      width: 90,
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
          #{String(id).slice(-6)}
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      render: (text) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{text}</span>,
    },
    {
      title: "Submitted By",
      dataIndex: "submittedBy",
      render: (val, rec) => (
        <span style={{ color: "var(--text-primary)" }}>
          {val || rec.user || rec.createdBy?.name || "—"}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (p) => {
        const key = (p || "").toLowerCase();
        const cfg = PRIORITY_COLOR[key] || { color: "var(--text-muted)", label: p || "—" };
        return <span style={pill(cfg.color)}>{cfg.label}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => {
        const key = (s || "").toLowerCase().replace(/ /g, "_");
        const cfg = STATUS_COLOR[key] || { color: "var(--text-muted)", label: s || "—" };
        return <span style={pill(cfg.color)}>{cfg.label}</span>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              style={{ borderColor: "var(--border-muted)" }}
              onClick={() => { setViewTicket(record); setViewOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Change Status">
            <Button
              icon={<EditOutlined />}
              size="small"
              style={{ borderColor: "var(--border-muted)" }}
              onClick={() => {
                setStatusTarget(record);
                statusForm.setFieldsValue({ status: record.status });
                setStatusOpen(true);
              }}
            />
          </Tooltip>
          {record.status !== "resolved" && record.status !== "closed" && (
            <Tooltip title="Resolve Ticket">
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                onClick={() => { setResolveTarget(record); setResolveOpen(true); }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Ticket Management"
        subtitle="View and manage all support tickets from schools"
        icon={<CustomerServiceOutlined />}
        extra={
          <>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchTickets())}
              style={{ borderColor: "var(--border-muted)" }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setNewOpen(true)}
            >
              New Ticket
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Search
          placeholder="Search tickets by title..."
          allowClear
          style={{ width: 280 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => setStatusFilter(v || "")}
        >
          <Option value="open">Open</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="resolved">Resolved</Option>
          <Option value="closed">Closed</Option>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: "16px 20px",
          background: "var(--danger)10",
          border: "1px solid var(--danger)30",
          borderRadius: 10,
          color: "var(--danger)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={() => dispatch(fetchTickets())}>Retry</Button>
        </div>
      )}

      {/* Table */}
      <Spin spinning={loading}>
        <div style={tableContainer}>
          <Table
            className={TABLE_CLS}
            rowKey="_id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: "var(--text-muted)" }}>No tickets found</span>}
                />
              ),
            }}
            scroll={{ x: 700 }}
          />
        </div>
      </Spin>

      {/* ── View Modal ── */}
      <Modal
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        title={modalTitle(<EyeOutlined />, "Ticket Details", "Full ticket information")}
        width={540}
      >
        {viewTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
            {[
              ["Title", viewTicket.title],
              ["Submitted By", viewTicket.submittedBy || viewTicket.user || viewTicket.createdBy?.name || "—"],
              ["Priority", viewTicket.priority],
              ["Status", viewTicket.status],
              ["Created", viewTicket.createdAt ? new Date(viewTicket.createdAt).toLocaleString("en-IN") : "—"],
              ["Description", viewTicket.description],
              ["Resolution", viewTicket.resolution],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ color: "var(--text-primary)", fontSize: 14 }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Resolve Modal ── */}
      <Modal
        open={resolveOpen}
        onCancel={() => { setResolveOpen(false); resolveForm.resetFields(); }}
        title={modalTitle(<CheckCircleOutlined />, "Resolve Ticket", "Enter a resolution note")}
        footer={null}
        width={480}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve} style={{ marginTop: 8 }}>
          <Form.Item
            name="resolution"
            label="Resolution Note"
            rules={[{ required: true, message: "Please enter the resolution" }]}
          >
            <Input.TextArea rows={4} placeholder="Describe how this ticket was resolved..." />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setResolveOpen(false); resolveForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={resolving} icon={<CheckCircleOutlined />}>
              Mark Resolved
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal
        open={statusOpen}
        onCancel={() => { setStatusOpen(false); statusForm.resetFields(); }}
        title={modalTitle(<EditOutlined />, "Update Status", "Change the ticket status")}
        footer={null}
        width={400}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate} style={{ marginTop: 8 }}>
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select status">
              <Option value="open">Open</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="resolved">Resolved</Option>
              <Option value="closed">Closed</Option>
            </Select>
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setStatusOpen(false); statusForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updatingStatus}>Update</Button>
          </div>
        </Form>
      </Modal>

      {/* ── New Ticket Modal ── */}
      <Modal
        open={newOpen}
        onCancel={() => { setNewOpen(false); newForm.resetFields(); }}
        title={modalTitle(<PlusOutlined />, "New Support Ticket", "Create a new ticket")}
        footer={null}
        width={520}
      >
        <Form form={newForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 8 }}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Brief title of the issue" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={4} placeholder="Describe the issue in detail..." />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: "Please select a priority" }]}
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setNewOpen(false); newForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating} icon={<PlusOutlined />}>
              Create Ticket
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TicketPage;
