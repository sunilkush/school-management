import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge, Button, Calendar as AntCalendar, Card, Col, DatePicker, Empty, Form,
  Input, List, Modal, Popconfirm, Row, Select, Space, Tag, Typography, message,
} from "antd";
import {
  CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  EVENT_AUDIENCES, EVENT_STATUSES, EVENT_TYPES,
  createSchoolEvent, deleteSchoolEvent, fetchSchoolEvents, updateSchoolEvent,
} from "../../../services/schoolEventApi";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, pill, iconWell } from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const BADGE_STATUS = {
  Event: "processing",
  Holiday: "success",
  Meeting: "warning",
  Exam: "error",
  Activity: "default",
  Reminder: "processing",
};

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

const toPayload = (values) => ({
  title: values.title?.trim(),
  type: values.type,
  description: values.description?.trim() || "",
  location: values.location?.trim() || "",
  audience: values.audience,
  status: values.status,
  allDay: true,
  startDate: values.dateRange?.[0]?.startOf("day").toISOString(),
  endDate: values.dateRange?.[1]?.endOf("day").toISOString(),
  color: values.color || "#14B8A6",
});

const occursOnDate = (event, date) => {
  const selected = date.startOf("day");
  return (
    selected.isSame(dayjs(event.startDate), "day") ||
    selected.isSame(dayjs(event.endDate), "day") ||
    (selected.isAfter(dayjs(event.startDate), "day") && selected.isBefore(dayjs(event.endDate), "day"))
  );
};

const formatEventDate = (event) => {
  const start = dayjs(event.startDate).format("DD MMM YYYY");
  const end = dayjs(event.endDate).format("DD MMM YYYY");
  return start === end ? start : `${start} – ${end}`;
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalOpen, setModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();

  const loadEvents = useCallback(async (month = calendarDate) => {
    setLoading(true);
    try {
      const rows = await fetchSchoolEvents({
        from: month.startOf("month").subtract(7, "day").toISOString(),
        to: month.endOf("month").add(7, "day").toISOString(),
      });
      setEvents(rows);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [calendarDate]);

  useEffect(() => { loadEvents(calendarDate); }, [calendarDate, loadEvents]);

  const selectedDateEvents = useMemo(
    () => events.filter((event) => occursOnDate(event, selectedDate)),
    [events, selectedDate]
  );

  const openModal = (event = null, date = selectedDate) => {
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
            dateRange: [dayjs(event.startDate), dayjs(event.endDate)],
          }
        : {
            type: "Event",
            audience: "All",
            status: "scheduled",
            color: "#14B8A6",
            dateRange: [date, date],
          }
    );
    setDayModalOpen(false);
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
      await loadEvents(calendarDate);
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
      await loadEvents(calendarDate);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete event");
    }
  };

  const dateCellRender = (value) => {
    const dayEvents = events.filter((event) => occursOnDate(event, value));
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {dayEvents.slice(0, 3).map((item) => (
          <li key={item._id}>
            <Badge
              status={BADGE_STATUS[item.type] || "default"}
              text={<span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.title}</span>}
            />
          </li>
        ))}
        {dayEvents.length > 3 ? (
          <li><Text type="secondary" style={{ fontSize: 11 }}>+{dayEvents.length - 3} more</Text></li>
        ) : null}
      </ul>
    );
  };

  const EventListItem = ({ event, onEdit, onDelete }) => {
    const s = TYPE_STYLE[event.type] || { color: "#64748B", bg: "var(--surface-soft)" };
    return (
      <List.Item
        actions={[
          <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(event)}>Edit</Button>,
          <Popconfirm
            key="delete"
            title="Delete event?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(event)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space size={6}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{event.title}</span>
              <span style={pill(s.color, s.bg)}>{event.type}</span>
            </Space>
          }
          description={
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatEventDate(event)}</Text>
              {event.location ? <Text type="secondary" style={{ fontSize: 12 }}>{event.location}</Text> : null}
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <>
      <PageHeader
        title="School Calendar"
        subtitle="View and manage all scheduled events by date"
        icon={<CalendarOutlined />}
        extra={
          <Space size={8}>
            <Button icon={<ReloadOutlined />} onClick={() => loadEvents(calendarDate)} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null, selectedDate)}>Add Event</Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={18}>
            <div style={{
              background: "var(--surface)",
              borderRadius: 18,
              border: "1px solid var(--border-muted)",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <AntCalendar
                value={calendarDate}
                cellRender={(current, info) => (info.type === "date" ? dateCellRender(current) : info.originNode)}
                onSelect={(value) => { setSelectedDate(value); setDayModalOpen(true); }}
                onPanelChange={(value) => setCalendarDate(value)}
              />
            </div>
          </Col>

          <Col xs={24} lg={6}>
            <div style={sectionPanel}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
                {selectedDate.format("DD MMM YYYY")}
              </div>
              {selectedDateEvents.length ? (
                <List
                  dataSource={selectedDateEvents}
                  renderItem={(event) => (
                    <EventListItem key={event._id} event={event} onEdit={openModal} onDelete={handleDeleteEvent} />
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>No events for this date</span>}
                />
              )}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
                onClick={() => openModal(null, selectedDate)}
              >
                Add Event Here
              </Button>
            </div>
          </Col>
        </Row>

        {/* Day detail modal (mobile tap) */}
        <Modal
          title={`Events · ${selectedDate.format("DD MMM YYYY")}`}
          open={dayModalOpen}
          onCancel={() => setDayModalOpen(false)}
          footer={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null, selectedDate)}>
              Add Event
            </Button>
          }
          centered
        >
          {selectedDateEvents.length ? (
            <List
              dataSource={selectedDateEvents}
              renderItem={(event) => (
                <EventListItem key={event._id} event={event} onEdit={openModal} onDelete={handleDeleteEvent} />
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No events for selected date" />
          )}
        </Modal>

        {/* Add / Edit event modal */}
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
            <Form.Item label="Event Title" name="title" rules={[{ required: true, message: "Please enter event title" }]}>
              <Input placeholder="Enter event title" />
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
            <Form.Item label="Date Range" name="dateRange" rules={[{ required: true, message: "Please select event dates" }]}>
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

export default CalendarPage;
