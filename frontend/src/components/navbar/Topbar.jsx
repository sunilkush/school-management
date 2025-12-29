import React from "react";
import { Layout, Input, Button, Space } from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  SearchOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import UserDropdown from "./UserDropdown";
import NotificationDropdown from "./NotificationDropdown";
import AcademicYearSwitcher from "../layout/AcademicYearSwitcher";
import { useSelector } from "react-redux";


const { Header } = Layout;

const Topbar = ({ toggleSidebar, isOpen }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {/* Mobile Sidebar Toggle */}
      <Button
        type="text"
        onClick={toggleSidebar}
        className="sidebar-toggle-btn"
      >
        {isOpen ? <CloseOutlined style={{ fontSize: 20 }} /> : <MenuOutlined style={{ fontSize: 20 }} />}
      </Button>

      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: 300, marginLeft: 16, marginRight: 16 }}>
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined />}
          size="middle"
          allowClear
        />
      </div>

      {/* Right Icons & Profile */}
      <Space size="middle" align="center">
        {user?.role?.name !== "Super Admin" && (
          <AcademicYearSwitcher onChange={(year) => console.log("Switched to:", year)} />
        )}

        <Button type="text" icon={<MessageOutlined style={{ fontSize: 18 }} />} />

        <NotificationDropdown />

        <UserDropdown />
      </Space>
    </Header>
  );
};

export default Topbar;
