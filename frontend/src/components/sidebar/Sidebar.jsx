import React from "react";
import { Layout, Typography, Spin } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import SidebarMenu from "./SidebarMenu";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ isOpen }) => {
  const token = localStorage.getItem("accessToken");
  const { user } = useSelector((state) => state.auth);

  const role = user?.role?.name?.toLowerCase();
  const schoolName = user?.school?.name || "School";

  // 🔹 Loading / unauthenticated state
  if (!token) {
    return (
      <Sider
        width={260}
        theme="light"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <Spin tip="Authenticating..." />
      </Sider>
    );
  }

  return (
    <Sider
      width={260}
      theme="light"
      collapsible
      collapsed={!isOpen}
      trigger={null}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        borderRight: "1px solid #f0f0f0",
        zIndex: 100,
        overflow: "auto",
      }}
    >
      {/* 🔹 School Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontWeight: 600,
          color: "#1677ff",
        }}
      >
        <div
          style={{
            background: "#e6f4ff",
            padding: 8,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HomeOutlined style={{ fontSize: 16 }} />
        </div>

        <Text ellipsis style={{ fontSize: 14 }}>
          {schoolName}
        </Text>
      </div>

      {/* 🔹 Divider */}
      <div style={{ borderBottom: "1px solid #f0f0f0", margin: "0 16px" }} />

      {/* 🔹 Role Based Menu */}
      <SidebarMenu role={role} />
    </Sider>
  );
};

export default Sidebar;
