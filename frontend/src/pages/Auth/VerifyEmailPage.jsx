import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Result, Button } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const VerifyEmailPage = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("loading"); // success | error

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // 🔥 token get from URL
        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) throw new Error("Invalid token");

        // 🔥 API call
        console.log("Verifying token:", token);

        // simulate API
        await new Promise((res) => setTimeout(res, 1500));

        setStatus("success");
      } catch (error) {
        setStatus("error",error);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, []);

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
          width: 420,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {loading ? (
          <>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Verifying your email...</Title>
              <Text type="secondary">
                Please wait while we verify your account
              </Text>
            </div>
          </>
        ) : status === "success" ? (
          <Result
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
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
            subTitle="The link is invalid or expired"
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