import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Select, message } from "antd";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Same category set SupportTicketsPage.jsx / ContactSupport.jsx (the authenticated version) use —
// there's no public, unauthenticated ticket-creation endpoint yet (SupportTicket.createdBy is a
// required User ref), so this reaches support the same way any pre-account visitor would: a
// pre-filled email, not a ticket. Once a public ticket endpoint exists this can switch to that.
const CATEGORIES = ["General", "Technical", "Academic", "Finance", "Transport", "Hostel", "Library", "Other"];
const SUPPORT_EMAIL = "support@yoursaas.com";

const ContactSupportPage = () => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  const onFinish = (values) => {
    setSending(true);
    const subject = `[${values.category}] ${values.subject}`;
    const body = `Name: ${values.name}\nEmail: ${values.email}\n\n${values.message}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    message.success("Opening your email app — send the pre-filled message to reach us.");
    setSending(false);
  };

  return (
    <div className="auth-shell">
      <Card className="auth-card auth-card-wide">
        <div className="auth-header">
          <Title level={3} className="auth-title">Contact Support</Title>
          <Text type="secondary" className="auth-text">
            We're here to help — reach out and we'll get back to you
          </Text>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 22, flexWrap: "wrap" }}>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <MailOutlined /> {SUPPORT_EMAIL}
          </a>
          <a href="tel:+919876543210" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <PhoneOutlined /> +91 98765 43210
          </a>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Your Name" name="name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input prefix={<UserOutlined />} placeholder="Full name" size="large" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@school.edu" size="large" />
          </Form.Item>

          <Form.Item label="Category" name="category" initialValue="General" rules={[{ required: true }]}>
            <Select size="large" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>

          <Form.Item label="Subject" name="subject" rules={[{ required: true, message: "Please enter a subject" }]}>
            <Input placeholder="What do you need help with?" size="large" />
          </Form.Item>

          <Form.Item label="Message" name="message" rules={[{ required: true, message: "Please describe your issue" }]}>
            <TextArea rows={4} placeholder="Describe your issue or question…" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sending} block size="large">
              Send Message
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text type="secondary" className="auth-text">
            <a href="/login">Back to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ContactSupportPage;
