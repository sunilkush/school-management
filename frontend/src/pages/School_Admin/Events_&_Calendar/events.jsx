import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Col, DatePicker, Form, Input, Modal,
  Popconfirm, Row, Select, Space, Table, Tag, Tooltip, message,
} from "antd";
import {
  CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  EVENT_AUDIENCES, EVENT_STATUSES, EVENT_TYPES,
  createSchoolEvent, deleteSchoolEvent, fetchSchoolEventStats,
  fetchSchoolEvents, updateSchoolEvent,
} from "../../../services/schoolEventApi";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, pageCard, toolbarRow, tableHeadCss,
  statCard, statLabel, statValue, statGrid, pill, iconWell,
} from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

// NOTE: `color` fields here are passed into the shared `pill()` helper
// (frontend/src/styles/pageStyles.js), which builds its border as
// `1px solid ${color}25` — a raw-hex alpha-suffix trick that breaks with a
// var() string (produces invalid CSS like "var(--accent)25"). Since that
// helper is outside this task's scope, `color` is left as hex; `bg` (used
// directly, no suffix) is safely converted to shared tokens.
const TYPE_STYLE = {
  Event:    { color: "#14B8A6", bg: "rgba(var(--accent-rgb), 0.2)" },
  Holiday:  { color: "#22C55E", bg: "var(--success-light)" },
  Meeting:  { color: "#2563EB", bg: "var(--primary-light)" },
  Exam:     { color: "#EF4444", bg: "var(--danger-light)" },
  Activity: { color: "#F59E0B", bg: "rgba(var(--warning-rgb), 0.08)" },
  Reminder: { color: "#0e7490", bg: "#ecfeff" },
};

const STATUS_STYLE = {
  scheduled: { color: "#2563EB", bg: "var(--primary-light)" },
  cancelled:  { color: "#EF4444", bg: "var(--danger-light)" },
  completed:  { color: "#22C55E", bg: "var(--success-light)" },
};

const STAT_META = [
  { key: "total",    label: "Total Events", color: "var(--accent)" },
  { key: "upcoming", label: "Upcoming",     color: "var(--primary)" },
  { key: "past",     label: "Past",         color: "var(--text-secondary)" },
  { key: "cancelled",label: "Cancelled",    color: "var(--danger)" },
];

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
  color: values.color || "#14B8A6",
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

  useEffect(() => { loadEvents(); }, [loadEvents]);

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
            color: event.color || "#14B8A6",
            allDay: event.allDay,
            dateRange: [dayjs(event.startDate), dayjs(event.endDate)],
          }
        : {
            type: "Event",
            audience: "All",
            status: "scheduled",
            color: "#14B8A6",
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
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{title}</span>
          {record.location ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{record.location}</span> : null}
        </Space>
      ),
    },
    {
      title: "Date",
      key: "date",
      render: (_, record) =>
        toDate(record.startDate) === toDate(record.endDate)
          ? <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{toDate(record.startDate)}</span>
          : <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{toDate(record.startDate)} → {toDate(record.endDate)}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const s = TYPE_STYLE[type] || { color: "#64748B", bg: "var(--surface-soft)" };
        return <span style={pill(s.color, s.bg)}>{type}</span>;
      },
    },
    {
      title: "Audience",
      dataIndex: "audience",
      key: "audience",
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const s = STATUS_STYLE[status] || { color: "#64748B", bg: "var(--surface-soft)" };
        return <span style={pill(s.color, s.bg)}>{status}</span>;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v || "—"}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: "var(--warning)" }} onClick={() => openModal(record)} />
          </Tooltip>
          <Popconfirm
            title={`Delete "${record.title}"?`}
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteEvent(record)}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("events-table")}</style>

      <PageHeader
        title="School Events"
        subtitle="Manage events, holidays, meetings and reminders"
        icon={<CalendarOutlined />}
        extra={
          <Space size={8}>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={loadEvents} loading={loading} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Event</Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 10, marginBottom: 20 }}
          message="Events saved here are also shown on the Calendar page."
        />

        {/* KPI stats */}
        <div className="stat-grid" style={statGrid(180)}>
          {STAT_META.map(({ key, label, color }) => (
            <div key={key} style={statCard({ color })}>
              <div>
                <div style={statLabel(color)}>{label}</div>
                <div style={statValue(color)}>{stats[key] || 0}</div>
              </div>
              <div style={{ fontSize: 28, color, opacity: 0.5 }}><CalendarOutlined /></div>
            </div>
          ))}
        </div>

        <div style={pageCard}>
          <div style={{ padding: "20px 20px 0" }}>
            <div className="page-toolbar" style={toolbarRow}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                All Events
              </span>
              <div style={{ flex: 1 }} />
              <Input.Search
                allowClear
                placeholder="Search events"
                onSearch={(q) => setFilters((prev) => ({ ...prev, q }))}
                style={{ width: 220 }}
              />
              <Select
                allowClear
                placeholder="Type"
                style={{ width: 140 }}
                options={EVENT_TYPES.map((type) => ({ label: type, value: type }))}
                onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
              />
              <Select
                allowClear
                placeholder="Status"
                style={{ width: 130 }}
                options={EVENT_STATUSES.map((status) => ({ label: status, value: status }))}
                onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
              />
            </div>
          </div>

          <div className="events-table" style={{ borderTop: "1px solid var(--border-muted)" }}>
            <Table
              columns={columns}
              dataSource={events}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                size: "small",
                showTotal: (total) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{total} events</span>,
              }}
              scroll={{ x: 800 }}
            />
          </div>
        </div>

        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={iconWell("var(--primary)", 34)}><CalendarOutlined /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                  {editingEvent ? "Edit Event" : "Add Event"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Fill in the event details</div>
              </div>
            </div>
          }
          open={modalOpen}
          onCancel={closeModal}
          footer={null}
          destroyOnClose
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSaveEvent} style={{ marginTop: 8 }}>
            <Form.Item label="Event Name" name="title" rules={[{ required: true, message: "Enter event name" }]}>
              <Input placeholder="Enter event name" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Event Type" name="type" rules={[{ required: true }]}>
                  <Select options={EVENT_TYPES.map((type) => ({ label: type, value: type }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Audience" name="audience" rules={[{ required: true }]}>
                  <Select options={EVENT_AUDIENCES.map((audience) => ({ label: audience, value: audience }))} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Date Range" name="dateRange" rules={[{ required: true, message: "Select event dates" }]}>
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                  <Select options={EVENT_STATUSES.map((status) => ({ label: status, value: status }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Color" name="color">
                  <Input type="color" style={{ height: 32, padding: 2 }} />
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
                <Button type="primary" htmlType="submit" loading={saving}>
                  {editingEvent ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default Events;
