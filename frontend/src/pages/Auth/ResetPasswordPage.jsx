import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
} from "antd";
import { LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // 🔥 API call (token + password)
      console.log("New Password:", values.password);

      // simulate API
      await new Promise((res) => setTimeout(res, 1500));

      message.success("Password reset successfully ✅");
    } catch (error) {
      message.error("Failed to reset password ❌",error);
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
          <Title level={3}>Reset Password</Title>
          <Text type="secondary">
            Enter your new password below
          </Text>
        </div>

        {/* Form */}
        <Form layout="vertical" onFinish={onFinish}>
          {/* New Password */}
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 6, message: "Minimum 6 characters required" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match");
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm password"
              size="large"
            />
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text type="secondary">
            Back to{" "}
            <a href="/login">Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;