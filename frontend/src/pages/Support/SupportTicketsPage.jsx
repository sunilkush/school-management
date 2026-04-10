import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import httpClient from "../../api/httpClient";

const { TextArea } = Input;
const { Title, Text } = Typography;

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const CATEGORY_OPTIONS = ["General", "Technical", "Academic", "Finance", "Transport", "Hostel", "Library", "Other"];

const supportPath = (import.meta.env.VITE_API_URL || "/api").includes("/api/v1")
  ? "/support-tickets"
  : "/v1/support-tickets";

const statusColor = {
  Open: "gold",
  "In Progress": "blue",
  Resolved: "green",
  Closed: "default",
};

const priorityColor = {
  Low: "default",
  Medium: "processing",
  High: "orange",
  Urgent: "red",
};

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

  const columns = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (value, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              #{record._id?.slice(-6) || "------"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (value) => <Tag>{value}</Tag>,
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (value) => <Tag color={priorityColor[value] || "default"}>{value}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value) => <Tag color={statusColor[value] || "default"}>{value}</Tag>,
      },
      {
        title: "Raised By",
        dataIndex: ["createdBy", "name"],
        key: "raisedBy",
        render: (_value, record) => record?.createdBy?.name || "-",
      },
      {
        title: "Action",
        key: "action",
        render: (_value, record) => (
          <Space wrap>
            <Button size="small" onClick={() => openUpdateModal(record)}>
              Update
            </Button>
            {record.status !== "Resolved" && (
              <Popconfirm title="Resolve this ticket?" onConfirm={() => handleResolve(record._id)}>
                <Button size="small" type="primary" ghost>
                  Resolve
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>Support Tickets</Title>
          <Text type="secondary">
            {roleName || "User"} can create, update and resolve tickets from this module.
          </Text>
        </Space>
      </Card>

      <Card>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Select
              allowClear
              placeholder="Filter by status"
              style={{ width: 170 }}
              options={STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            />
            <Select
              allowClear
              placeholder="Filter by priority"
              style={{ width: 170 }}
              options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))}
              value={filters.priority}
              onChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
            />
            <Select
              allowClear
              placeholder="Filter by category"
              style={{ width: 170 }}
              options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))}
              value={filters.category}
              onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
            />
          </Space>

          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchTickets(pagination.current, pagination.pageSize)}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Ticket
            </Button>
          </Space>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Tip"
        description="Non-privileged roles can typically manage their own tickets while admins/support roles can manage broader school tickets."
      />

      <Card>
        <Table
          rowKey="_id"
          columns={columns}
          loading={loading}
          dataSource={tickets}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchTickets(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="Create Support Ticket"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okButtonProps={{ loading: saving }}
        destroyOnHidden
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Enter ticket title" maxLength={180} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
            <TextArea rows={4} placeholder="Describe issue" maxLength={5000} />
          </Form.Item>
          <Form.Item name="category" label="Category" initialValue="General">
            <Select options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="Medium">
            <Select options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Update Ticket"
        open={Boolean(editingTicket)}
        onCancel={() => setEditingTicket(null)}
        onOk={handleUpdate}
        okButtonProps={{ loading: saving }}
        destroyOnHidden
      >
        <Form layout="vertical" form={updateForm}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input maxLength={180} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
            <TextArea rows={4} maxLength={5000} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select options={CATEGORY_OPTIONS.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select options={PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={STATUS_OPTIONS.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item name="note" label="Update Note (Optional)">
            <TextArea rows={3} maxLength={1000} placeholder="Add update note" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
