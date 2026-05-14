import React, { useEffect } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  clearRecoveryState,
  forgotPasswordRequest,
} from "../../features/accountRecoverySlice";

const { Title, Text } = Typography;

const ForgetPasswordPage = () => {
  const dispatch = useDispatch();
  const { loading, success, error, message: successMessage } = useSelector(
    (state) => state.accountRecovery.forgotPassword
  );

  const onFinish = async (values) => {
    dispatch(forgotPasswordRequest(values.email));
  };

  useEffect(() => {
    if (success && successMessage) {
      message.success(successMessage);
      dispatch(clearRecoveryState("forgotPassword"));
    }
  }, [dispatch, success, successMessage]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearRecoveryState("forgotPassword"));
    }
  }, [dispatch, error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--surface-page)",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={3} style={{ color: "var(--text-primary)" }}>
            Forgot Password
          </Title>
          <Text type="secondary" style={{ color: "var(--text-primary)" }}>
            Enter your email to receive a reset link
          </Text>
        </div>

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
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text type="secondary" style={{ color: "var(--text-primary)" }}>
            Remember your password? <a href="/">Back to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ForgetPasswordPage;
