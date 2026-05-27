import React, { useEffect } from "react";
import { Card, Typography, Spin, Result, Button } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  clearRecoveryState,
  verifyEmailRequest,
} from "../../features/accountRecoverySlice";

const { Title, Text } = Typography;

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { loading, success, error } = useSelector((state) => state.accountRecovery.verifyEmail);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      dispatch(clearRecoveryState("verifyEmail"));
      return;
    }

    dispatch(verifyEmailRequest(token));
  }, [dispatch, token]);

  const status = !token ? "error" : success ? "success" : error ? "error" : "loading";

  return (
    <div className="auth-shell">
      <Card className="auth-card auth-card-wide verify-card">
        {loading || status === "loading" ? (
          <>
            <Spin size="large" />
            <div className="verify-spin-copy">
              <Title level={4}>Verifying your email...</Title>
              <Text type="secondary">Please wait while we verify your account</Text>
            </div>
          </>
        ) : status === "success" ? (
          <Result
            icon={<CheckCircleOutlined className="success-icon" />}
            title="Email Verified Successfully 🎉"
            subTitle="Your account is now active. You can login."
            extra={[
              <Button type="primary" href="/login" key="login">
                Go to Login
              </Button>,
            ]}
          />
        ) : (
          <Result
            status="error"
            icon={<CloseCircleOutlined />}
            title="Verification Failed"
            subTitle={error || "The link is invalid, missing, or expired"}
            extra={[
              <Button type="primary" href="/resend-verification" key="resend">
                Resend Verification
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
