import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  createTicket,
  fetchTickets,
  resolveTicket,
  updateTicketStatus,
} from "../../features/supportTicketSlice";

const { Text } = Typography;

const PRIORITY_COLOR = { low: "green", medium: "orange", high: "red" };
const STATUS_COLOR = { Open: "orange", "In Progress": "blue", Resolved: "green" };

const UserSupportTickets = () => {
  const dispatch                   = useDispatch();
  const { tickets, loading }       = useSelector((s) => s.supportTickets || { tickets: [], loading: false });
  const [form]                     = Form.useForm();
  const [filter, setFilter]        = useState("All");
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote]   = useState("");

  useEffect(() => { dispatch(fetchTickets()); }, [dispatch]);

  const filtered = useMemo(() => {
    if (filter === "All") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const handleCreate = async (values) => {
    await dispatch(createTicket({ title: values.title, priority: values.priority, description: values.description || "" }));
    form.resetFields();
    message.success("Ticket submitted");
  };

  const handleStatusChange = (id, status) => {
    dispatch(updateTicketStatus({ id, status }));
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    await dispatch(resolveTicket({ id: resolveModal._id, resolution: resolveNote }));
    setResolveModal(null);
    setResolveNote("");
    message.success("Ticket resolved");
  };

  const columns = [
    { title: "Title",    dataIndex: "title",    key: "title",    ellipsis: true },
    { title: "Priority", dataIndex: "priority", key: "priority",
      render: (v) => <Tag color={PRIORITY_COLOR[v?.toLowerCase()] || "default"}>{v}</Tag> },
    { title: "Status",   dataIndex: "status",   key: "status",
      render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{v}</Tag> },
    {
      title: "Actions", key: "actions",
      render: (_, row) => (
        <Space size="small">
          {row.status !== "In Progress" && row.status !== "Resolved" && (
            <Button size="small" onClick={() => handleStatusChange(row._id, "In Progress")}>
              Start
            </Button>
          )}
          {row.status !== "Resolved" && (
            <Button size="small" type="primary" onClick={() => setResolveModal(row)}>
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="Create Support Ticket">
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="Brief summary of the issue" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="description" label="Description">
                <Input placeholder="Details (optional)" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="priority" label="Priority" initialValue="Medium">
                <Select options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={2}>
              <Form.Item label=" ">
                <Button type="primary" htmlType="submit" block>Submit</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title="All Support Tickets"
        extra={
          <Select
            style={{ minWidth: 150 }}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "All",         label: "All" },
              { value: "Open",        label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved",    label: "Resolved" },
            ]}
          />
        }
      >
        <Table
          rowKey={(r) => r._id || r.id}
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="Resolve Ticket"
        open={!!resolveModal}
        onCancel={() => { setResolveModal(null); setResolveNote(""); }}
        onOk={handleResolve}
        okText="Mark Resolved"
      >
        <Text>Title: <strong>{resolveModal?.title}</strong></Text>
        <Input.TextArea
          rows={3}
          placeholder="Resolution note (optional)"
          value={resolveNote}
          onChange={(e) => setResolveNote(e.target.value)}
          style={{ marginTop: 12 }}
        />
      </Modal>
    </Space>
  );
};

export default UserSupportTickets;
