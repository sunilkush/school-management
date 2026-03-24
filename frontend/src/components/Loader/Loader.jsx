import React from "react";
import { Spin, Typography } from "antd";

const { Title } = Typography;

const Loader = () => (
  <div
    role="status"
    aria-label="Loading application"
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      gap: 16,
      background: "#f0f2f5", // ✅ Matches Ant Design app background
    }}
  >
    {/* Logo */}
    <Title level={3} style={{ margin: 0, color: "#1677ff" }}>
      School ERP
    </Title>

    {/* Spinner */}
    <Spin size="large" />
  </div>
);

export default Loader;