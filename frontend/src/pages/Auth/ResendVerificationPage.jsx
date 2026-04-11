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
        <div style={{ textAlign: "center", marginBottom: 20 }}>
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

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Text type="secondary">
            Already verified? <a href="/login">Go to Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResendVerificationPage;
