import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Calendar as AntCalendar,
  Badge,
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Space, // ✅ Add this
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;

const CalendarPage = () => {
  const [events, setEvents] = useState([
    {
      key: 1,
      date: "2026-01-10",
      title: "Staff Meeting",
      description: "Monthly staff meeting in conference hall",
    },
    {
      key: 2,
      date: "2026-01-15",
      title: "Parent-Teacher Meeting",
      description: "Discuss student progress",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();

  const dateCellRender = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayEvents = events.filter((e) => e.date === dateStr);
    return (
      <ul className="events">
        {dayEvents.map((item) => (
          <li key={item.key}>
            <Badge status="success" text={item.title} />
          </li>
        ))}
      </ul>
    );
  };

  const openModal = (event = null) => {
    setEditingEvent(event);
    if (event) {
      form.setFieldsValue({
        title: event.title,
        description: event.description,
        date: dayjs(event.date),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSaveEvent = (values) => {
    const newEvent = {
      key: editingEvent ? editingEvent.key : events.length + 1,
      title: values.title,
      description: values.description,
      date: values.date.format("YYYY-MM-DD"),
    };

    if (editingEvent) {
      setEvents(events.map((e) => (e.key === editingEvent.key ? newEvent : e)));
      message.success("Event updated successfully!");
    } else {
      setEvents([...events, newEvent]);
      message.success("Event added successfully!");
    }

    setModalVisible(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleDeleteEvent = (event) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete the event "${event.title}"?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setEvents(events.filter((e) => e.key !== event.key));
        message.success("Event deleted successfully!");
      },
    });
  };

  const onSelectDate = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayEvents = events.filter((e) => e.date === dateStr);
    if (dayEvents.length > 0) {
      Modal.info({
        title: `Events on ${dateStr}`,
        content: (
          <ul>
            {dayEvents.map((e) => (
              <li key={e.key}>
                <b>{e.title}</b>: {e.description}{" "}
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openModal(e)}
                />
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteEvent(e)}
                />
              </li>
            ))}
          </ul>
        ),
        okText: "Close",
      });
    }
  };

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Calendar</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>School Calendar</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Add Event
          </Button>
        </div>

        <AntCalendar
          dateCellRender={dateCellRender}
          onSelect={onSelectDate}
        />

        <Modal
          title={editingEvent ? "Edit Event" : "Add Event"}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingEvent(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveEvent}>
            <Form.Item
              label="Event Title"
              name="title"
              rules={[{ required: true, message: "Please enter event title" }]}
            >
              <Input placeholder="Enter event title" />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter description" }]}
            >
              <Input.TextArea placeholder="Enter description" rows={3} />
            </Form.Item>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: "Please select date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setEditingEvent(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingEvent ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default CalendarPage;
