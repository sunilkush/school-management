import React, { useState, memo } from "react";
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
  const [searchValue, setSearchValue] = useState("");

  // ✅ Handle Search (future API / filter)
  const handleSearch = (value) => {
    console.log("Search:", value);
  };

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
          height: 64, // ✅ important
        }}
      >
        {/* LEFT */}
        <Space  align="center" style={{ height: "100%" }}>
          {/* Sidebar Toggle */}
          <Button
            type="text"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            icon={
              isOpen ? (
                <MenuOutlined style={{ fontSize: 20 }} />
              ) : (
                <CloseOutlined style={{ fontSize: 20 }} />
                
              )
            }
          />

          {/* Desktop Search */}
          {screens.md && (
            <Input.Search
              placeholder="Search..."
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              prefix={<SearchOutlined />}
              style={{ width: 260,marginTop:15 }}
            />
          )}
        </Space>

        {/* RIGHT */}
        <Space size={screens.md ? "middle" : "small"} align="center">
          {/* Mobile Search Icon */}
          {!screens.md && (
            <Button
              type="text"
              aria-label="Open Search"
              icon={<SearchOutlined style={{ fontSize: 18 }} />}
              onClick={() => setMobileSearchOpen(true)}
            />
          )}

          {/* Academic Year */}
          {screens.sm && user?.role?.name !== "Super Admin" && (
            <AcademicYearSwitcher />
          )}

          {/* Messages */}
          <Button
            type="text"
            aria-label="Messages"
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
        styles={{
          body: { padding: 12 },
        }}
      >
        <Input.Search
          autoFocus
          placeholder="Search..."
          allowClear
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={(value) => {
            handleSearch(value);
            setMobileSearchOpen(false); // close after search
          }}
          prefix={<SearchOutlined />}
          
        />
      </Drawer>
    </>
  );
};

export default memo(Topbar);