import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  message,
  Collapse,
} from "antd";
import { useDispatch } from "react-redux";

import {
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { createTicket } from "../../../features/supportTicketSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// Matches SupportTicket.model.js's enums exactly (Title Case) — the same options
// Support/SupportTicketsPage.jsx's own create form already uses successfully.
const CATEGORIES = ["General", "Technical", "Academic", "Finance", "Transport", "Hostel", "Library", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const ContactSupport = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await dispatch(createTicket({
        title: values.subject,
        description: values.message,
        category: values.category,
        priority: values.priority,
      })).unwrap();
      message.success("Support ticket submitted!");
      form.resetFields();
    } catch (err) {
      message.error(err || "Failed to submit support ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page-shell">
      
      {/* HEADER */}
      <Title level={3}>📩 Contact Support</Title>

      <Row gutter={16}>
        
        {/* LEFT - FORM */}
        <Col xs={24} md={14}>
          <Card title="Submit a Ticket">
            <Form form={form} layout="vertical" onFinish={onFinish}>

              <Form.Item
                label="Subject"
                name="subject"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter issue subject" />
              </Form.Item>

              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select category">
                  {CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>

              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select priority">
                  {PRIORITIES.map((p) => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              </Form.Item>

              <Form.Item
                label="Message"
                name="message"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={4} placeholder="Describe your issue..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Submit Request
              </Button>
            </Form>
          </Card>
        </Col>

        {/* RIGHT - CONTACT INFO + FAQ */}
        <Col xs={24} md={10}>
          
          {/* CONTACT INFO */}
          <Card title="Support Info" className="support-info-card">
            <p><MailOutlined /> support@yoursaas.com</p>
            <p><PhoneOutlined /> +91 9876543210</p>
            <p><MessageOutlined /> Live Chat Available</p>
          </Card>

          {/* FAQ */}
          <Card title="FAQs">
            <Collapse accordion>
              <Panel header="How to reset password?" key="1">
                <Text>Go to profile → reset password.</Text>
              </Panel>

              <Panel header="How to upgrade plan?" key="2">
                <Text>Go to billing section and upgrade.</Text>
              </Panel>

              <Panel header="Payment failed?" key="3">
                <Text>Contact support with transaction ID.</Text>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContactSupport;
