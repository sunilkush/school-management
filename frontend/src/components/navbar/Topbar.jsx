import React, { useState } from "react";
import { Layout, Input, Button, Space, Grid, Drawer } from "antd";
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
const { useBreakpoint } = Grid;

const Topbar = ({ toggleSidebar, isOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const screens = useBreakpoint();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* LEFT */}
        <Space align="center">
          {/* Sidebar Toggle */}
          <Button
            type="text"
            onClick={toggleSidebar}
            icon={
              isOpen ? (
                <CloseOutlined style={{ fontSize: 20 }} />
              ) : (
                <MenuOutlined style={{ fontSize: 20 }} />
              )
            }
          />

          {/* Desktop Search */}
          {screens.md && (
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 260 }}
            />
          )}
        </Space>

        {/* RIGHT */}
        <Space size={screens.md ? "middle" : "small"} align="center">
          {/* Mobile Search Icon */}
          {!screens.md && (
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: 18 }} />}
              onClick={() => setMobileSearchOpen(true)}
            />
          )}

          {/* Academic Year (Hide on mobile) */}
          {screens.sm && user?.role?.name !== "Super Admin" && (
            <AcademicYearSwitcher
              onChange={(year) => console.log("Switched to:", year)}
            />
          )}

          {/* Messages */}
          <Button
            type="text"
            icon={<MessageOutlined style={{ fontSize: 18 }} />}
          />

          {/* Notifications */}
          <NotificationDropdown />

          {/* User */}
          <UserDropdown />
        </Space>
      </Header>

      {/* 🔍 Mobile Search Drawer */}
      <Drawer
        title="Search"
        placement="top"
        height={100}
        onClose={() => setMobileSearchOpen(false)}
        open={mobileSearchOpen}
        closable={false}
      >
        <Input
          autoFocus
          placeholder="Search..."
          prefix={<SearchOutlined />}
          allowClear
        />
      </Drawer>
    </>
  );
};

export default Topbar;
