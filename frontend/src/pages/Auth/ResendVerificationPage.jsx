import React, { useEffect } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined, ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  clearRecoveryState,
  resendVerificationRequest,
} from "../../features/accountRecoverySlice";

const { Title, Text } = Typography;

const ResendVerificationPage = () => {
  const dispatch = useDispatch();
  const { loading, success, error, message: successMessage } = useSelector(
    (state) => state.accountRecovery.resendVerification
  );

  const onFinish = async (values) => {
    dispatch(resendVerificationRequest(values.email));
  };

  useEffect(() => {
    if (success && successMessage) {
      message.success(successMessage);
      dispatch(clearRecoveryState("resendVerification"));
    }
  }, [dispatch, success, successMessage]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearRecoveryState("resendVerification"));
    }
  }, [dispatch, error]);

  return (
    <div className="auth-shell">
      <Card className="auth-card">
        <div className="auth-header">
          <Title level={3}>Resend Verification</Title>
          <Text type="secondary">Didn’t receive the email? Enter your email again</Text>
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
            <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<ReloadOutlined />}
            >
              Resend Verification
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text type="secondary">
            Already verified? <a href="/login">Go to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResendVerificationPage;
