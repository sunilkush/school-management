import React, { useState, memo, lazy, Suspense } from "react";
import { Layout, Input, Button, Space, Grid, Drawer, Spin, Badge, Tooltip, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  MessageOutlined,
  MoonOutlined,
  SunOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";

const UserDropdown = lazy(() => import("./UserDropdown"));
const NotificationDropdown = lazy(() => import("./NotificationDropdown"));
const AcademicYearSwitcher = lazy(() => import("../layout/AcademicYearSwitcher"));

const { Header } = Layout;
const { useBreakpoint } = Grid;

/* ─── Inline styles (no extra CSS file needed) ─────────────────────── */
const styles = {
  header: (isDark) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 64,
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: isDark
      ? "rgba(17, 19, 28, 0.85)"
      : "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: isDark
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.07)",
    boxShadow: isDark
      ? "0 1px 12px rgba(0,0,0,0.4)"
      : "0 1px 10px rgba(0,0,0,0.06)",
    transition: "background 0.3s, border-color 0.3s",
  }),

  iconBtn: (isDark) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
    transition: "background 0.2s, color 0.2s, transform 0.15s",
    cursor: "pointer",
  }),

  searchInput: (isDark) => ({
    width: 260,
    borderRadius: 10,
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.09)",
    boxShadow: "none",
  }),

  divider: (isDark) => ({
    width: 1,
    height: 22,
    background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    margin: "0 4px",
    borderRadius: 1,
  }),

  badge: {
    fontSize: 10,
  },
};

/* ─── Small reusable icon button ───────────────────────────────────── */
const IconBtn = memo(({ icon, tooltip, onClick, badge, isDark, ariaLabel }) => {
  const [hovered, setHovered] = useState(false);

  const btn = (
    <button
      aria-label={ariaLabel ?? tooltip}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.iconBtn(isDark),
        background: hovered
          ? isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
          : styles.iconBtn(isDark).background,
        transform: hovered ? "scale(1.08)" : "scale(1)",
        fontSize: 16,
      }}
    >
      {badge !== undefined ? (
        <Badge count={badge} size="small" offset={[4, -4]} style={styles.badge}>
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
  const { isDark, toggleTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const loader = (
    <Spin size="small" style={{ display: "flex", alignItems: "center" }} />
  );

  const handleSearch = (value) => {
    console.log("Search:", value);
  };

  return (
    <>
      <Header style={styles.header(isDark)}>

        {/* ── LEFT ── */}
        <Space align="center" size={12}>
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
                color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              }}
            />
          </Tooltip>

          {/* Desktop search */}
          {screens.md && (
            <Input
              placeholder="Search anything…"
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => handleSearch(searchValue)}
              prefix={
                <SearchOutlined
                  style={{
                    color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
                    fontSize: 14,
                  }}
                />
              }
              style={styles.searchInput(isDark)}
              styles={{
                input: {
                  background: "transparent",
                  color: isDark ? "rgba(255,255,255,0.85)" : "inherit",
                },
              }}
            />
          )}
        </Space>

        {/* ── RIGHT ── */}
        <Space size={6} align="center">

          {/* Mobile search */}
          {!screens.md && (
            <IconBtn
              icon={<SearchOutlined style={{ fontSize: 16 }} />}
              tooltip="Search"
              isDark={isDark}
              onClick={() => setMobileSearchOpen(true)}
            />
          )}

          {/* Academic Year Switcher */}
          {screens.sm && user?.role?.name !== "Super Admin" && (
            <Suspense fallback={loader}>
              <AcademicYearSwitcher />
            </Suspense>
          )}

          {/* Vertical divider */}
          {screens.sm && <span style={styles.divider(isDark)} />}

          {/* Messages */}
          <IconBtn
            icon={<MessageOutlined style={{ fontSize: 16 }} />}
            tooltip="Messages"
            badge={3}
            isDark={isDark}
            ariaLabel="Messages"
          />

          {/* Theme toggle */}
          <IconBtn
            icon={
              isDark
                ? <SunOutlined style={{ fontSize: 16, color: "#facc15" }} />
                : <MoonOutlined style={{ fontSize: 16 }} />
            }
            tooltip={`Switch to ${isDark ? "light" : "dark"} mode`}
            onClick={toggleTheme}
            isDark={isDark}
            ariaLabel={`Switch to ${isDark ? "light" : "dark"} theme`}
          />

          {/* Notifications */}
          <Suspense fallback={loader}>
            <NotificationDropdown />
          </Suspense>

          {/* Vertical divider */}
          <span style={styles.divider(isDark)} />

          {/* User */}
          <Suspense fallback={loader}>
            <UserDropdown />
          </Suspense>
        </Space>
      </Header>

      {/* ── Mobile Search Drawer ── */}
      <Drawer
        title={
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: isDark ? "rgba(255,255,255,0.85)" : "inherit",
            }}
          >
            Search
          </span>
        }
        placement="top"
        height={88}
        onClose={() => setMobileSearchOpen(false)}
        open={mobileSearchOpen}
        closable
        closeIcon={
          <span style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : undefined }}>
            ✕
          </span>
        }
        styles={{
          header: {
            padding: "10px 16px",
            background: isDark ? "#11131c" : "#fff",
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid #f0f0f0",
          },
          body: {
            padding: "10px 16px",
            background: isDark ? "#11131c" : "#fff",
          },
        }}
      >
        <Input
          autoFocus
          placeholder="Search anything…"
          allowClear
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onPressEnter={(e) => {
            handleSearch(e.target.value);
            setMobileSearchOpen(false);
          }}
          prefix={<SearchOutlined style={{ color: "rgba(0,0,0,0.3)", fontSize: 14 }} />}
          style={{
            borderRadius: 10,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.09)",
          }}
        />
      </Drawer>
    </>
  );
};

export default memo(Topbar);