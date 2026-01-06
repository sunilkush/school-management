import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

const Events = () => {
  const [events, setEvents] = useState([
    { key: 1, name: "Sports Day", date: "2026-01-15", type: "Event", description: "Annual sports activities" },
    { key: 2, name: "Parent-Teacher Meeting", date: "2026-01-20", type: "Meeting", description: "Discuss student progress" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();

  // Open modal for add/edit
  const openModal = (event = null) => {
    setEditingEvent(event);
    if (event) {
      form.setFieldsValue({
        ...event,
        date: dayjs(event.date),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Save event
  const handleSaveEvent = (values) => {
    const newEvent = {
      key: editingEvent ? editingEvent.key : events.length + 1,
      name: values.name,
      type: values.type,
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

  // Delete event
  const handleDeleteEvent = (event) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete the event "${event.name}"?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setEvents(events.filter((e) => e.key !== event.key));
        message.success("Event deleted successfully!");
      },
    });
  };

  // Summary
  const totalEvents = events.length;
  const today = dayjs();
  const upcomingEvents = events.filter((e) => dayjs(e.date).isAfter(today)).length;
  const pastEvents = events.filter((e) => dayjs(e.date).isBefore(today)).length;

  const columns = [
    { title: "Event Name", dataIndex: "name", key: "name" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)}>Edit</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteEvent(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Events</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card title="Total Events">{totalEvents}</Card></Col>
          <Col xs={24} sm={8}><Card title="Upcoming Events">{upcomingEvents}</Card></Col>
          <Col xs={24} sm={8}><Card title="Past Events">{pastEvents}</Card></Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Events List</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Add Event</Button>
        </div>

        <Table columns={columns} dataSource={events} rowKey="key" pagination={{ pageSize: 5 }} />

        {/* Add/Edit Modal */}
        <Modal
          title={editingEvent ? "Edit Event" : "Add Event"}
          visible={modalVisible}
          onCancel={() => { setModalVisible(false); setEditingEvent(null); form.resetFields(); }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveEvent}>
            <Form.Item label="Event Name" name="name" rules={[{ required: true, message: "Enter event name" }]}>
              <Input placeholder="Enter event name" />
            </Form.Item>
            <Form.Item label="Event Type" name="type" rules={[{ required: true, message: "Select event type" }]}>
              <Select placeholder="Select event type">
                <Option value="Event">Event</Option>
                <Option value="Holiday">Holiday</Option>
                <Option value="Meeting">Meeting</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true, message: "Enter description" }]}>
              <Input.TextArea placeholder="Enter description" rows={3} />
            </Form.Item>
            <Form.Item label="Date" name="date" rules={[{ required: true, message: "Select date" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => { setModalVisible(false); setEditingEvent(null); form.resetFields(); }}>Cancel</Button>
                <Button type="primary" htmlType="submit">{editingEvent ? "Update" : "Add"}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Events;
