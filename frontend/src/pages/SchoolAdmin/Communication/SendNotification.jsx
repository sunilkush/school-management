import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Space,
  Card,
  Row,
  Col,
  message,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const SendNotification = () => {
  const [form] = Form.useForm();
  const [notifications, setNotifications] = useState([]);

  // Send notification handler
  const handleSendNotification = (values) => {
    const newNotification = {
      key: notifications.length + 1,
      title: values.title,
      message: values.message,
      recipients: values.recipients.join(", "),
      schedule: values.schedule ? values.schedule.format("YYYY-MM-DD HH:mm") : "Immediate",
      dateSent: dayjs().format("YYYY-MM-DD HH:mm"),
    };

    setNotifications([newNotification, ...notifications]);
    message.success("Notification sent successfully!");
    form.resetFields();
  };

  // Summary counts
  const totalNotifications = notifications.length;

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Notifications</Breadcrumb.Item>
        <Breadcrumb.Item>Send Notification</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        {/* Summary */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Notifications Sent">{totalNotifications}</Card>
          </Col>
        </Row>

        {/* Notification Form */}
        <Card title="Send Notification" style={{ marginBottom: 24 }}>
          <Form form={form} layout="vertical" onFinish={handleSendNotification}>
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: "Enter notification title" }]}
            >
              <Input placeholder="Enter title" />
            </Form.Item>

            <Form.Item
              label="Message"
              name="message"
              rules={[{ required: true, message: "Enter message" }]}
            >
              <TextArea placeholder="Enter message" rows={4} />
            </Form.Item>

            <Form.Item
              label="Recipients"
              name="recipients"
              rules={[{ required: true, message: "Select at least one recipient" }]}
            >
              <Select mode="multiple" placeholder="Select recipients">
                <Option value="Students">Students</Option>
                <Option value="Teachers">Teachers</Option>
                <Option value="Parents">Parents</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Schedule (Optional)" name="schedule">
              <DatePicker showTime style={{ width: "100%" }} placeholder="Select date & time" />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => form.resetFields()}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                  Send
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Notification History Table */}
        {notifications.length > 0 && (
          <Card title="Notification History">
            <Table
              dataSource={notifications}
              rowKey="key"
              pagination={{ pageSize: 5 }}
              columns={[
                { title: "Title", dataIndex: "title", key: "title" },
                { title: "Message", dataIndex: "message", key: "message" },
                { title: "Recipients", dataIndex: "recipients", key: "recipients" },
                { title: "Scheduled For", dataIndex: "schedule", key: "schedule" },
                { title: "Sent At", dataIndex: "dateSent", key: "dateSent" },
              ]}
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default SendNotification;
