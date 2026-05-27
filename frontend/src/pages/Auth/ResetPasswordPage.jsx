import React, { useEffect } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  clearRecoveryState,
  resetPasswordRequest,
} from "../../features/accountRecoverySlice";

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { loading, success, error, message: successMessage } = useSelector(
    (state) => state.accountRecovery.resetPassword
  );

  const onFinish = async (values) => {
    const token = searchParams.get("token");

    if (!token) {
      message.error("Reset token is missing or invalid");
      return;
    }

    dispatch(resetPasswordRequest({ token, password: values.password }));
  };

  useEffect(() => {
    if (success && successMessage) {
      message.success(successMessage);
      dispatch(clearRecoveryState("resetPassword"));
    }
  }, [dispatch, success, successMessage]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearRecoveryState("resetPassword"));
    }
  }, [dispatch, error]);

  return (
    <div className="auth-shell">
      <Card className="auth-card">
        <div className="auth-header">
          <Title level={3}>Reset Password</Title>
          <Text type="secondary">Enter your new password below</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 6, message: "Minimum 6 characters required" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" size="large" />
          </Form.Item>

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
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text type="secondary">
            Back to <a href="/login">Login</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
