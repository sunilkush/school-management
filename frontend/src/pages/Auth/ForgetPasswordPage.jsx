import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
} from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ForgetPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // 🔥 API call yaha lagegi
      console.log("Email:", values.email);

      // simulate API
      await new Promise((res) => setTimeout(res, 1500));

      message.success("Reset link sent to your email ✅");
    } catch (error) {
      message.error("Something went wrong ❌",error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fa",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={3}>Forgot Password</Title>
          <Text type="secondary">
            Enter your email to receive a reset link
          </Text>
        </div>

        {/* Form */}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text type="secondary">
            Remember your password?{" "}
            <a href="/">Back to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ForgetPasswordPage;