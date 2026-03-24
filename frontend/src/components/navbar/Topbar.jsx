import React, { useState, memo, lazy, Suspense, useEffect } from "react";
import { Layout, Input, Button, Space, Grid, Drawer, Spin } from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  SearchOutlined,
  MessageOutlined,
   MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";

const UserDropdown = lazy(() => import("./UserDropdown"));
const NotificationDropdown = lazy(() => import("./NotificationDropdown"));
const AcademicYearSwitcher = lazy(() =>
  import("../layout/AcademicYearSwitcher")
);
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";

const { Header } = Layout;
const { useBreakpoint } = Grid;

const Topbar = ({ toggleSidebar, isOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const screens = useBreakpoint();
  const { isDark, toggleTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const handleSearch = (value) => {
    console.log("Search:", value);
  };
   useEffect(() => {
    const checkDarkMode = () => {
      const root = document.documentElement;
      const body = document.body;
      const savedTheme = localStorage.getItem("theme");

      const darkEnabled =
        savedTheme === "dark" ||
        root.classList.contains("dark") ||
        body.classList.contains("dark") ||
        root.getAttribute("data-theme") === "dark";

      setIsDarkMode(darkEnabled);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("storage", checkDarkMode);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", checkDarkMode);
    };
  }, []);
  // 🔹 Common Loader
  const loader = <Spin size="small" />;

  return (
    <>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          color: "var(--text-primary)",
           background: isDarkMode ? "#141414" : "#fff",
          borderBottom: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 64,
        }}
      >
        {/* LEFT */}
        <Space align="center" style={{ height: "100%" }}>
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
            style={{ color: isDarkMode ? "#ffffff" : undefined }}
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
              style={{ width: 260, marginTop: 15 }}
            />
          )}
        </Space>

        {/* RIGHT */}
        <Space size={screens.md ? "middle" : "small"} align="center">
          {/* Mobile Search */}
          {!screens.md && (
            <Button
              type="text"
              aria-label="Open Search"
              icon={<SearchOutlined style={{ fontSize: 18 }} />}
              onClick={() => setMobileSearchOpen(true)}
               style={{ color: isDarkMode ? "#ffffff" : undefined }}
            />
          )}

          {/* Academic Year */}
          {screens.sm && user?.role?.name !== "Super Admin" && (
            <Suspense fallback={loader}>
              <AcademicYearSwitcher />
            </Suspense>
          )}

          {/* Messages */}
          <Button
            type="text"
            aria-label="Messages"
            icon={<MessageOutlined style={{ fontSize: 18 }} />}
            style={{ color: isDarkMode ? "#ffffff" : undefined }}
          />
            <Button
            type="text"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            onClick={toggleTheme}
            icon={
              isDark ? (
                <SunOutlined style={{ fontSize: 18 }} />
              ) : (
                <MoonOutlined style={{ fontSize: 18 }} />
              )
            }
          />
          {/* Notifications */}
          <Suspense fallback={loader}>
            <NotificationDropdown />
          </Suspense>

          {/* User */}
          <Suspense fallback={loader}>
            <UserDropdown />
          </Suspense>
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
            setMobileSearchOpen(false);
          }}
          prefix={<SearchOutlined />}
        />
      </Drawer>
    </>
  );
};

export default memo(Topbar);