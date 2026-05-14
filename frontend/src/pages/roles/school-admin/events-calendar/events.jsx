import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Layout,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  EVENT_AUDIENCES,
  EVENT_STATUSES,
  EVENT_TYPES,
  createSchoolEvent,
  deleteSchoolEvent,
  fetchSchoolEventStats,
  fetchSchoolEvents,
  updateSchoolEvent,
} from "../../../../services/schoolEventApi";

const { Content } = Layout;
const { RangePicker } = DatePicker;

const EVENT_COLORS = {
  Event: "blue",
  Holiday: "green",
  Meeting: "purple",
  Exam: "red",
  Activity: "orange",
  Reminder: "cyan",
};

const toDate = (value) => (value ? dayjs(value).format("YYYY-MM-DD") : "-");

const toPayload = (values) => ({
  title: values.title?.trim(),
  type: values.type,
  description: values.description?.trim() || "",
  location: values.location?.trim() || "",
  audience: values.audience,
  status: values.status,
  allDay: values.allDay ?? true,
  startDate: values.dateRange?.[0]?.startOf("day").toISOString(),
  endDate: values.dateRange?.[1]?.endOf("day").toISOString(),
  color: values.color || "#1677ff",
});

const Events = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filters, setFilters] = useState({ q: "", type: undefined, status: undefined });
  const [form] = Form.useForm();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [eventRows, statData] = await Promise.all([fetchSchoolEvents(filters), fetchSchoolEventStats()]);
      setEvents(eventRows);
      setStats(statData);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load school events");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openModal = (event = null) => {
    setEditingEvent(event);
    form.setFieldsValue(
      event
        ? {
            title: event.title,
            type: event.type,
            description: event.description,
            location: event.location,
            audience: event.audience,
            status: event.status,
            color: event.color || "#1677ff",
            allDay: event.allDay,
            dateRange: [dayjs(event.startDate), dayjs(event.endDate)],
          }
        : {
            type: "Event",
            audience: "All",
            status: "scheduled",
            color: "#1677ff",
            allDay: true,
            dateRange: [dayjs(), dayjs()],
          }
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleSaveEvent = async (values) => {
    setSaving(true);
    try {
      const payload = toPayload(values);
      if (editingEvent?._id) {
        await updateSchoolEvent(editingEvent._id, payload);
        message.success("Event updated successfully");
      } else {
        await createSchoolEvent(payload);
        message.success("Event added successfully");
      }
      closeModal();
      await loadEvents();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      await deleteSchoolEvent(event._id);
      message.success("Event deleted successfully");
      await loadEvents();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete event");
    }
  };

  const columns = [
      {
        title: "Event Name",
        dataIndex: "title",
        key: "title",
        render: (title, record) => (
          <Space direction="vertical" size={0}>
            <strong>{title}</strong>
            {record.location ? <span style={{ color: "#64748b" }}>{record.location}</span> : null}
          </Space>
        ),
      },
      {
        title: "Date",
        key: "date",
        render: (_, record) =>
          toDate(record.startDate) === toDate(record.endDate)
            ? toDate(record.startDate)
            : `${toDate(record.startDate)} to ${toDate(record.endDate)}`,
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (type) => <Tag color={EVENT_COLORS[type] || "default"}>{type}</Tag>,
      },
      { title: "Audience", dataIndex: "audience", key: "audience" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => <Tag color={status === "cancelled" ? "red" : status === "completed" ? "green" : "blue"}>{status}</Tag>,
      },
      { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
              Edit
            </Button>
            <Popconfirm
              title="Delete event?"
              description={`Do you want to delete "${record.title}"?`}
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteEvent(record)}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[{ title: "Dashboard" }, { title: "Events" }]} />

      <Content>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Create and manage school events, holidays, meetings, exams, and reminders. Events saved here are also shown on the Calendar page."
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Total Events" value={stats.total || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Upcoming" value={stats.upcoming || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Past" value={stats.past || 0} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Cancelled" value={stats.cancelled || 0} /></Card>
          </Col>
        </Row>

        <Card
          title="Events List"
          extra={
            <Space wrap>
              <Input.Search
                allowClear
                placeholder="Search events"
                onSearch={(q) => setFilters((prev) => ({ ...prev, q }))}
                style={{ width: 220 }}
              />
              <Select
                allowClear
                placeholder="Type"
                style={{ width: 150 }}
                options={EVENT_TYPES.map((type) => ({ label: type, value: type }))}
                onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
              />
              <Select
                allowClear
                placeholder="Status"
                style={{ width: 150 }}
                options={EVENT_STATUSES.map((status) => ({ label: status, value: status }))}
                onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
              />
              <Button icon={<ReloadOutlined />} onClick={loadEvents}>Refresh</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Event</Button>
            </Space>
          }
        >
          <Table columns={columns} dataSource={events} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
        </Card>

        <Modal title={editingEvent ? "Edit Event" : "Add Event"} open={modalOpen} onCancel={closeModal} footer={null} destroyOnClose>
          <Form form={form} layout="vertical" onFinish={handleSaveEvent}>
            <Form.Item label="Event Name" name="title" rules={[{ required: true, message: "Enter event name" }]}>
              <Input placeholder="Enter event name" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Event Type" name="type" rules={[{ required: true, message: "Select event type" }]}>
                  <Select options={EVENT_TYPES.map((type) => ({ label: type, value: type }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Audience" name="audience" rules={[{ required: true, message: "Select audience" }]}>
                  <Select options={EVENT_AUDIENCES.map((audience) => ({ label: audience, value: audience }))} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Date Range" name="dateRange" rules={[{ required: true, message: "Select event dates" }]}>
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Status" name="status" rules={[{ required: true, message: "Select status" }]}>
                  <Select options={EVENT_STATUSES.map((status) => ({ label: status, value: status }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Color" name="color">
                  <Input type="color" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Location" name="location">
              <Input placeholder="Venue / room / online link" />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea placeholder="Enter description" rows={3} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Space>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={saving}>{editingEvent ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Events;