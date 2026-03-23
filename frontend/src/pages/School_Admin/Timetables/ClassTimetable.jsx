import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Form,
  Select,
  Input,
  TimePicker,
  Button,
  Modal,
  Space,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

const ClassTimetable = () => {
  const [form] = Form.useForm();
  const [timetable, setTimetable] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Add or update timetable entry
  const handleSave = (values) => {
    const newEntry = {
      key: editingRecord ? editingRecord.key : timetable.length + 1,
      className: values.className,
      section: values.section,
      day: values.day,
      subject: values.subject,
      startTime: values.startTime.format("HH:mm"),
      endTime: values.endTime.format("HH:mm"),
    };

    if (editingRecord) {
      // Update existing
      setTimetable(
        timetable.map((item) => (item.key === editingRecord.key ? newEntry : item))
      );
      message.success("Class schedule updated successfully!");
    } else {
      // Add new
      setTimetable([...timetable, newEntry]);
      message.success("Class schedule added successfully!");
    }

    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Edit timetable
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      className: record.className,
      section: record.section,
      day: record.day,
      subject: record.subject,
      startTime: dayjs(record.startTime, "HH:mm"),
      endTime: dayjs(record.endTime, "HH:mm"),
    });
    setModalVisible(true);
  };

  // Delete timetable
  const handleDelete = (record) => {
    setTimetable(timetable.filter((item) => item.key !== record.key));
    message.success("Class schedule removed!");
  };

  const columns = [
    { title: "Class", dataIndex: "className", key: "className" },
    { title: "Section", dataIndex: "section", key: "section" },
    { title: "Day", dataIndex: "day", key: "day" },
    { title: "Subject", dataIndex: "subject", key: "subject" },
    { title: "Start Time", dataIndex: "startTime", key: "startTime" },
    { title: "End Time", dataIndex: "endTime", key: "endTime" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Academics</Breadcrumb.Item>
        <Breadcrumb.Item>Class Timetable</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Class Timetable</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Add Class Schedule
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={timetable}
          pagination={{ pageSize: 5 }}
          rowKey="key"
        />

        {/* Add/Edit Modal */}
        <Modal
          title={editingRecord ? "Edit Class Schedule" : "Add Class Schedule"}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingRecord(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              label="Class"
              name="className"
              rules={[{ required: true, message: "Enter class" }]}
            >
              <Input placeholder="Enter class name" />
            </Form.Item>

            <Form.Item
              label="Section"
              name="section"
              rules={[{ required: true, message: "Enter section" }]}
            >
              <Input placeholder="Enter section" />
            </Form.Item>

            <Form.Item
              label="Day"
              name="day"
              rules={[{ required: true, message: "Select day" }]}
            >
              <Select placeholder="Select day">
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day => (
                  <Option key={day} value={day}>{day}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ required: true, message: "Enter subject" }]}
            >
              <Input placeholder="Enter subject" />
            </Form.Item>

            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: true, message: "Select start time" }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>

            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ required: true, message: "Select end time" }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Button
                style={{ marginRight: 8 }}
                onClick={() => {
                  setModalVisible(false);
                  setEditingRecord(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "Update" : "Add"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ClassTimetable;
