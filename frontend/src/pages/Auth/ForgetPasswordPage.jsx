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
    <div className="auth-shell">
      <Card className="auth-card">
        <div className="auth-header">
          <Title level={3} className="auth-title">
            Forgot Password
          </Title>
          <Text type="secondary" className="auth-text">
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

        <div className="auth-footer">
          <Text type="secondary" className="auth-text">
            Remember your password? <a href="/">Back to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ForgetPasswordPage;
