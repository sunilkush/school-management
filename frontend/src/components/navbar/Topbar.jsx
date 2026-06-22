import React, { useState, memo, lazy, Suspense } from "react";
import { Layout, Input, Button, Space, Grid, Drawer, Spin, Badge, Tooltip, Dropdown, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";

const UserDropdown = lazy(() => import("./UserDropdown"));
const NotificationDropdown = lazy(() => import("./NotificationDropdown"));
const AcademicYearSwitcher = lazy(() => import("../layout/AcademicYearSwitcher"));

const { Header } = Layout;
const { useBreakpoint } = Grid;

/* ─── Small icon button ─────────────────────────────────────────────── */
const IconBtn = memo(({ icon, tooltip, onClick, badge, ariaLabel, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const btn = (
    <button
      aria-label={ariaLabel ?? tooltip}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "none",
        background: hovered
          ? isDark ? "#243047" : "rgba(219,234,254,0.15)"
          : isDark ? "#1E2A3E" : "#F2F6FD",
        color: isDark ? "#9BA8C0" : "#64748B",
        transition: "all 0.18s ease",
        cursor: "pointer",
        transform: hovered ? "scale(1.07)" : "scale(1)",
        fontSize: 16,
      }}
    >
      {badge !== undefined ? (
        <Badge
          count={badge}
          size="small"
          offset={[4, -4]}
          style={{
            fontSize: 9,
            background: "#EF4444",
            boxShadow: "none",
            border: "none",
          }}
        >
          {icon}
        </Badge>
      ) : (
        icon
      )}
    </button>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="bottom">
      {btn}
    </Tooltip>
  ) : btn;
});

/* ─── Main Topbar ───────────────────────────────────────────────────── */
const Topbar = ({ toggleSidebar, isOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const screens = useBreakpoint();
  const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const isMobile = !screens.md;

  const loader = <Spin size="small" style={{ display: "flex", alignItems: "center" }} />;

  return (
    <>
      {/* ── Top bar styles ── */}
      <style>{`
        .topbar-search-input .ant-input {
          background: transparent !important;
          color: ${isDark ? "#E8EDF7" : "#0F172A"} !important;
          font-size: 13px;
        }
        .topbar-search-input .ant-input::placeholder {
          color: ${isDark ? "#64748B" : "#A0AABA"} !important;
        }
        .topbar-search-input.ant-input-affix-wrapper {
          border-color: ${isDark ? "#2A3550" : "#E2E8F0"} !important;
          background: ${isDark ? "#1E2A3E" : "#F2F6FD"} !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .topbar-search-input.ant-input-affix-wrapper:hover,
        .topbar-search-input.ant-input-affix-wrapper-focused {
          border-color: ${isDark ? "#2563EB" : "#DBEAFE"} !important;
          box-shadow: 0 0 0 3px rgba(219,234,254,0.18) !important;
        }
        .topbar-year-switcher { max-width: 180px; }
      `}</style>

      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 64,
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: isDark ? "#1A2235" : "#ffffff",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${isDark ? "#2A3550" : "#F1F5F9"}`,
          boxShadow: isDark
            ? "0 1px 0 #222E44"
            : "0 1px 0 #F1F5F9, 0 2px 12px rgba(37,99,235,0.05)",
          transition: "background 0.3s",
        }}
      >
        {/* ── LEFT ── */}
        <Space align="center" size={isMobile ? 8 : 12}>
          {/* Sidebar toggle */}
          <Tooltip title={isOpen ? "Collapse sidebar" : "Expand sidebar"} placement="bottom">
            <Button
              type="text"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
              icon={
                isOpen
                  ? <MenuFoldOutlined style={{ fontSize: 18 }} />
                  : <MenuUnfoldOutlined style={{ fontSize: 18 }} />
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                color: isDark ? "#9BA8C0" : "#64748B",
                background: isDark ? "#1E2A3E" : "#F2F6FD",
                border: "none",
              }}
            />
          </Tooltip>

          {/* Desktop search */}
          {screens.md && (
            <Input
              className="topbar-search-input"
              placeholder="Search anything…"
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              prefix={
                <SearchOutlined style={{ color: isDark ? "#64748B" : "#A0AABA", fontSize: 14 }} />
              }
              style={{ width: 260 }}
            />
          )}
        </Space>

        {/* ── RIGHT ── */}
        <Space size={isMobile ? 4 : 6} align="center">

          {/* Mobile search toggle */}
          {isMobile && (
            <IconBtn
              icon={<SearchOutlined style={{ fontSize: 16 }} />}
              tooltip="Search"
              isDark={isDark}
              onClick={() => setMobileSearchOpen(true)}
            />
          )}

          {/* Academic Year Switcher */}
          {!isMobile && screens.sm && user?.role?.name !== "Super Admin" && (
            <div className="topbar-year-switcher mr-8">
              <Suspense fallback={loader}>
                <AcademicYearSwitcher />
              </Suspense>
            </div>
          )}

          {/* Divider */}
          {!isMobile && (
            <span style={{
              width: 1, height: 22,
              background: isDark ? "#2A3550" : "#E2E8F0",
              borderRadius: 1,
            }} />
          )}

          {/* Theme toggle */}
          <Dropdown
            trigger={["click"]}
            menu={{
              selectedKeys: [themeMode],
              onClick: ({ key }) => setThemeMode(key),
              items: [
                { key: "light", label: "Light" },
                { key: "dark",  label: "Dark" },
                { key: "system",label: "System" },
              ],
              style: { borderRadius: 12, padding: "4px" },
            }}
            overlayStyle={{ borderRadius: 12 }}
          >
            <span>
              <IconBtn
                isDark={isDark}
                tooltip={`Theme: ${themeMode}`}
                onClick={toggleTheme}
                ariaLabel="Theme controls"
                icon={
                  themeMode === "system"
                    ? <LaptopOutlined style={{ fontSize: 16 }} />
                    : isDark
                      ? <SunOutlined style={{ fontSize: 16, color: "#FEF3C7" }} />
                      : <MoonOutlined style={{ fontSize: 16, color: "#14B8A6" }} />
                }
              />
            </span>
          </Dropdown>

          {/* Notifications */}
          <Suspense fallback={loader}>
            <NotificationDropdown />
          </Suspense>

          {/* Divider */}
          {!isMobile && (
            <span style={{
              width: 1, height: 22,
              background: isDark ? "#2A3550" : "#E2E8F0",
              borderRadius: 1,
            }} />
          )}

          {/* User dropdown */}
          <Suspense fallback={loader}>
            <UserDropdown />
          </Suspense>
        </Space>
      </Header>

      {/* ── Mobile Search Drawer ── */}
      <Drawer
        title={
          <span style={{ fontWeight: 600, fontSize: 15, color: isDark ? "#E8EDF7" : "#0F172A" }}>
            Search
          </span>
        }
        placement="top"
        height={88}
        onClose={() => setMobileSearchOpen(false)}
        open={mobileSearchOpen}
        closable
        closeIcon={<span style={{ fontSize: 13, color: isDark ? "#9BA8C0" : "#94A3B8" }}>✕</span>}
        styles={{
          header: {
            padding: "10px 16px",
            background: isDark ? "#1A2235" : "#fff",
            borderBottom: `1px solid ${isDark ? "#2A3550" : "#F1F5F9"}`,
          },
          body: {
            padding: "10px 16px",
            background: isDark ? "#1A2235" : "#fff",
          },
        }}
      >
        <Input
          autoFocus
          placeholder="Search anything…"
          allowClear
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          prefix={<SearchOutlined style={{ color: isDark ? "#64748B" : "#A0AABA", fontSize: 14 }} />}
          style={{
            borderRadius: 10,
            background: isDark ? "rgba(255,255,255,0.06)" : "#F2F6FD",
            border: `1px solid ${isDark ? "#2A3550" : "#E2E8F0"}`,
          }}
        />
      </Drawer>
    </>
  );
};

export default memo(Topbar);
