import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  CustomerServiceOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import httpClient from "../../api/httpClient";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell, tableHeadCss } from "../../styles/pageStyles.js";

const { TextArea } = Input;
const { Text } = Typography;

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const CATEGORY_OPTIONS = ["General", "Technical", "Academic", "Finance", "Transport", "Hostel", "Library", "Other"];

const supportPath = (import.meta.env.VITE_API_URL || "/api/v1").includes("/api/v1")
  ? "/support-tickets"
  : "/v1/support-tickets";

const STATUS_COLOR = { Open: "gold", "In Progress": "blue", Resolved: "green", Closed: "default" };
const STATUS_HEX = { Open: "#F59E0B", "In Progress": "#2563EB", Resolved: "#22C55E", Closed: "#94A3B8" };
const PRIORITY_COLOR = { Low: "default", Medium: "processing", High: "orange", Urgent: "red" };

const STATUS_STATS = [
  { key: "Open", label: "Open", color: "#F59E0B", icon: <ExclamationCircleOutlined /> },
  { key: "In Progress", label: "In Progress", color: "#2563EB", icon: <ClockCircleOutlined /> },
  { key: "Resolved", label: "Resolved", color: "#22C55E", icon: <CheckCircleOutlined /> },
  { key: "Closed", label: "Closed", color: "#94A3B8", icon: <MinusCircleOutlined /> },
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: undefined, priority: undefined, category: undefined });

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const roleName = useSelector((state) => state.auth.user?.role?.name || "");

  const fetchTickets = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      };
      const response = await httpClient.get(supportPath, { params });
      const payload = response.data || {};
      setTickets(payload.data || []);
      const meta = payload.meta || {};
      setPagination((prev) => ({
        ...prev,
        current: Number(meta.page || page),
        pageSize: Number(meta.limit || pageSize),
        total: Number(meta.total || 0),
      }));
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to fetch support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.category]);

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setSaving(true);
      await httpClient.post(supportPath, values);
      message.success("Ticket created successfully");
      setCreateOpen(false);
      fetchTickets(1, pagination.pageSize);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || "Ticket create failed");
    } finally {
      setSaving(false);
    }
  };

  const openUpdateModal = (ticket) => {
    setEditingTicket(ticket);
    updateForm.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      note: "",
    });
  };

  const handleUpdate = async () => {
    if (!editingTicket?._id) return;
    try {
      const values = await updateForm.validateFields();
      setSaving(true);
      const { status, ...rest } = values;
      await httpClient.patch(`${supportPath}/${editingTicket._id}`, rest);
      if (status && status !== editingTicket.status) {
        await httpClient.patch(`${supportPath}/${editingTicket._id}/status`, {
          status,
          note: values.note || "",
        });
      }
      message.success("Ticket updated successfully");
      setEditingTicket(null);
      fetchTickets(pagination.current, pagination.pageSize);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || "Ticket update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      await httpClient.patch(`${supportPath}/${ticketId}/resolve`, { note: "Resolved from support dashboard" });
      message.success("Ticket resolved");
      fetchTickets(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error?.response?.data?.message || "Resolve failed");
    }
  };

  const ticketCountByStatus = useMemo(() => {
    const counts = {};
    tickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  const columns = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: "var(--text-primary)" }}>{value}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>#{record._id?.slice(-6) || "------"}</Text>
          </Space>
        ),
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (value) => <Tag style={{ borderRadius: 99 }}>{value}</Tag>,
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (value) => (
          <Tag color={PRIORITY_COLOR[value] || "default"} style={{ borderRadius: 99, fontWeight: 600 }}>{value}</Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value) => (
          <Tag color={STATUS_COLOR[value] || "default"} style={{ borderRadius: 99 }}>{value}</Tag>
        ),
      },
      {
        title: "Raised By",
        dataIndex: ["createdBy", "name"],
        key: "raisedBy",
        render: (_value, record) => (
          <Text style={{ fontSize: 13 }}>{record?.createdBy?.name || "-"}</Text>
        ),
      },
      {
        title: "Actions",
        key: "action",
        render: (_value, record) => (
          <Space wrap>
            <Button size="small" onClick={() => openUpdateModal(record)}>Update</Button>
            {record.status !== "Resolved" && (
              <Popconfirm title="Mark this ticket as resolved?" onConfirm={() => handleResolve(record._id)}>
                <Button size="small" type="primary" ghost>Resolve</Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <style>{tableHeadCss("support-tbl")}</style>
      <PageHeader
        title="Support Tickets"
        subtitle={`${roleName || "User"} — create, update and resolve support tickets.`}
        icon={<CustomerServiceOutlined />}
        extra={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchTickets(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Ticket
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* Status summary strip */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {STATUS_STATS.map((s) => (
            <Col xs={12} sm={6} key={s.key}>
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 14,
                  border: "1px solid var(--border-muted)",
                  borderTop: `4px solid ${s.color}`,
                  padding: "14px 18px",
                  cursor: "pointer",
                  transition: "box-shadow 0.18s ease",
                }}
                onClick={() => setFilters((f) => ({ ...f, status: f.status === s.key ? undefined : s.key }))}
              >
                <Flex align="center" gap={12}>
                  <div style={iconWell(s.color, 40)}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                      {ticketCountByStatus[s.key] || 0}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
                      {s.label}
                    </div>
                  </div>
                </Flex>
              </div>
            </Col>
          ))}
        </Row>

        {/* Filters */}
        <div style={{ ...sectionPanel, marginBottom: 16, padding: "12px 16px" }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Flex gap={8} wrap="wrap">
              <Select
                allowClear
                placeholder="Filter by status"
                style={{ width: 155 }}
                options={STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
                value={filters.status}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              />
              <Select
                allowClear
                placeholder="Filter by priority"
                style={{ width: 155 }}
                options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))}
                value={filters.priority}
                onChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              />
              <Select
                allowClear
                placeholder="Filter by category"
                style={{ width: 155 }}
                options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))}
                value={filters.category}
                onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              />
              {(filters.status || filters.priority || filters.category) && (
                <Button onClick={() => setFilters({ status: undefined, priority: undefined, category: undefined })}>
                  Clear
                </Button>
              )}
            </Flex>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {pagination.total} total tickets
            </Text>
          </Flex>
        </div>

        {/* Table */}
        <div style={sectionPanel}>
          <Table
            className="support-tbl"
            rowKey="_id"
            columns={columns}
            loading={loading}
            dataSource={tickets}
            scroll={{ x: 700 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: (t) => `${t} tickets`,
              onChange: (page, pageSize) => fetchTickets(page, pageSize),
            }}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div style={iconWell("#2563EB", 34)}>
              <PlusOutlined style={{ fontSize: 15 }} />
            </div>
            <Text strong style={{ fontSize: 15 }}>Create Support Ticket</Text>
          </Flex>
        }
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Submit Ticket"
        okButtonProps={{ loading: saving }}
        destroyOnHidden
      >
        <Form layout="vertical" form={createForm} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Enter ticket title" maxLength={180} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
            <TextArea rows={4} placeholder="Describe the issue in detail" maxLength={5000} />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item name="category" label="Category" initialValue="General">
                <Select options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="priority" label="Priority" initialValue="Medium">
                <Select options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Update Modal */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div style={iconWell("#7C3AED", 34)}>
              <CustomerServiceOutlined style={{ fontSize: 15 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 15, display: "block" }}>Update Ticket</Text>
              {editingTicket && (
                <Text type="secondary" style={{ fontSize: 12 }}>#{editingTicket._id?.slice(-6)}</Text>
              )}
            </div>
          </Flex>
        }
        open={Boolean(editingTicket)}
        onCancel={() => setEditingTicket(null)}
        onOk={handleUpdate}
        okText="Save Changes"
        okButtonProps={{ loading: saving }}
        destroyOnHidden
      >
        <Form layout="vertical" form={updateForm} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input maxLength={180} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
            <TextArea rows={3} maxLength={5000} />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={8}>
              <Form.Item name="category" label="Category">
                <Select options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item name="priority" label="Priority">
                <Select options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Form.Item name="status" label="Status">
                <Select options={STATUS_OPTIONS.map((item) => ({
                  label: <Tag color={STATUS_COLOR[item]} style={{ borderRadius: 99 }}>{item}</Tag>,
                  value: item,
                }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="Update Note (Optional)">
            <TextArea rows={2} maxLength={1000} placeholder="Add a note about this update" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
