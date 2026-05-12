import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Breadcrumb,
  Button,
  Calendar as AntCalendar,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Typography,
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
  fetchSchoolEvents,
  updateSchoolEvent,
} from "../../../services/schoolEventApi";

const { Content } = Layout;
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
  color: values.color || "#1677ff",
});

const occursOnDate = (event, date) => {
  const selected = date.startOf("day");
  return selected.isSame(dayjs(event.startDate), "day") || selected.isSame(dayjs(event.endDate), "day") ||
    (selected.isAfter(dayjs(event.startDate), "day") && selected.isBefore(dayjs(event.endDate), "day"));
};

const formatEventDate = (event) => {
  const start = dayjs(event.startDate).format("DD MMM YYYY");
  const end = dayjs(event.endDate).format("DD MMM YYYY");
  return start === end ? start : `${start} - ${end}`;
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

  useEffect(() => {
    loadEvents(calendarDate);
  }, [calendarDate, loadEvents]);

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
            color: event.color || "#1677ff",
            dateRange: [dayjs(event.startDate), dayjs(event.endDate)],
          }
        : {
            type: "Event",
            audience: "All",
            status: "scheduled",
            color: "#1677ff",
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
            <Badge status={BADGE_STATUS[item.type] || "default"} text={<span style={{ fontSize: 12 }}>{item.title}</span>} />
          </li>
        ))}
        {dayEvents.length > 3 ? <li><Text type="secondary">+{dayEvents.length - 3} more</Text></li> : null}
      </ul>
    );
  };

  const handleSelectDate = (value) => {
    setSelectedDate(value);
    setDayModalOpen(true);
  };

  const handlePanelChange = (value) => {
    setCalendarDate(value);
  };

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[{ title: "Dashboard" }, { title: "Calendar" }]} />

      <Content>
        <Card
          title="School Calendar"
          extra={
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={() => loadEvents(calendarDate)} loading={loading}>Refresh</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null, selectedDate)}>Add Event</Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={18}>
              <AntCalendar
                value={calendarDate}
                cellRender={(current, info) => (info.type === "date" ? dateCellRender(current) : info.originNode)}
                onSelect={handleSelectDate}
                onPanelChange={handlePanelChange}
              />
            </Col>
            <Col xs={24} lg={6}>
              <Card size="small" title={`Events on ${selectedDate.format("DD MMM YYYY")}`}>
                {selectedDateEvents.length ? (
                  <List
                    dataSource={selectedDateEvents}
                    renderItem={(event) => (
                      <List.Item
                        actions={[
                          <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openModal(event)}>Edit</Button>,
                          <Popconfirm
                            key="delete"
                            title="Delete event?"
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDeleteEvent(event)}
                          >
                            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={<Space><span>{event.title}</span><Tag>{event.type}</Tag></Space>}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">{formatEventDate(event)}</Text>
                              {event.location ? <Text type="secondary">{event.location}</Text> : null}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No events for selected date" />
                )}
              </Card>
            </Col>
          </Row>
        </Card>

        <Modal
          title={`Events on ${selectedDate.format("DD MMM YYYY")}`}
          open={dayModalOpen}
          onCancel={() => setDayModalOpen(false)}
          footer={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null, selectedDate)}>Add Event</Button>}
        >
          {selectedDateEvents.length ? (
            <List
              dataSource={selectedDateEvents}
              renderItem={(event) => (
                <List.Item
                  actions={[
                    <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openModal(event)}>Edit</Button>,
                    <Popconfirm key="delete" title="Delete event?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => handleDeleteEvent(event)}>
                      <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta title={<Space><span>{event.title}</span><Tag>{event.type}</Tag></Space>} description={event.description || formatEventDate(event)} />
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No events for selected date" />
          )}
        </Modal>

        <Modal title={editingEvent ? "Edit Event" : "Add Event"} open={modalOpen} onCancel={closeModal} footer={null} destroyOnClose>
          <Form form={form} layout="vertical" onFinish={handleSaveEvent}>
            <Form.Item label="Event Title" name="title" rules={[{ required: true, message: "Please enter event title" }]}>
              <Input placeholder="Enter event title" />
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
            <Form.Item label="Date Range" name="dateRange" rules={[{ required: true, message: "Please select event dates" }]}>
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

export default CalendarPage;