import React, { useState, memo, lazy, Suspense } from "react";
import { Input, Grid, Drawer, Spin, Badge, Tooltip, Dropdown } from "antd";
import {
  SearchOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
  LaptopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";

const UserDropdown         = lazy(() => import("./UserDropdown"));
const NotificationDropdown = lazy(() => import("./NotificationDropdown"));
const AcademicYearSwitcher = lazy(() => import("../layout/AcademicYearSwitcher"));

const { useBreakpoint } = Grid;

const loader = <Spin size="small" style={{ display: "flex", alignItems: "center" }} />;

/* ── Icon button ────────────────────────────────────────────────── */
const IconBtn = memo(({ icon, tooltip, onClick, badge, ariaLabel, isDark, active }) => {
  const [hov, setHov] = useState(false);

  const btn = (
    <button
      aria-label={ariaLabel ?? tooltip}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 10,
        border: `1px solid ${
          active
            ? isDark ? "#2563EB66" : "#2563EB22"
            : isDark ? "#1E2A3B" : "#E8EEF6"
        }`,
        background: active
          ? isDark ? "#1E3A6E" : "#EFF6FF"
          : hov
            ? isDark ? "#1A2438" : "#F0F4FF"
            : isDark ? "#111827" : "#F8FAFF",
        color: active ? "#2563EB" : isDark ? "#94A3B8" : "#64748B",
        transition: "all 0.18s ease",
        cursor: "pointer",
        transform: hov ? "scale(1.05)" : "scale(1)",
        fontSize: 16,
      }}
    >
      {badge !== undefined ? (
        <Badge count={badge} size="small" offset={[4, -4]}
          style={{ fontSize: 9, background: "#EF4444", boxShadow: "none", border: "none" }}>
          {icon}
        </Badge>
      ) : icon}
    </button>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="bottom">{btn}</Tooltip>
  ) : btn;
});

/* ── Topbar ─────────────────────────────────────────────────────── */
const Topbar = ({ toggleSidebar, sidebarCollapsed, isMobile }) => {
  const { user }                                 = useSelector((s) => s.auth);
  const screens                                  = useBreakpoint();
  const { isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const [mobileSearch, setMobileSearch]          = useState(false);
  const [searchVal, setSearchVal]                = useState("");
  const mobile = !screens.md;

  const topbarBg     = isDark
    ? "rgba(17,24,39,0.96)"
    : "rgba(255,255,255,0.95)";
  const topbarBorder = isDark ? "#1E2A3B" : "#E8EEF6";
  const topbarShadow = isDark
    ? "0 1px 0 #1E2A3B, 0 2px 16px rgba(0,0,0,0.25)"
    : "0 1px 0 #E8EEF6, 0 2px 16px rgba(37,99,235,0.06)";

  return (
    <>
      <style>{`
        .tb-search.ant-input-affix-wrapper {
          background: ${isDark ? "#1A2438" : "#F4F7FF"} !important;
          border-color: ${isDark ? "#1E2A3B" : "#E2E9F8"} !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .tb-search.ant-input-affix-wrapper:hover,
        .tb-search.ant-input-affix-wrapper-focused {
          border-color: ${isDark ? "#3B82F6" : "#93C5FD"} !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
        }
        .tb-search .ant-input {
          background: transparent !important;
          color: ${isDark ? "#E8EDF7" : "#0F172A"} !important;
          font-size: 13px !important;
        }
        .tb-search .ant-input::placeholder {
          color: ${isDark ? "#4B5875" : "#A0AABA"} !important;
        }
      `}</style>

      {/* Topbar */}
      <div style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: mobile ? "0 12px" : "0 20px",
        background: topbarBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${topbarBorder}`,
        boxShadow: topbarShadow,
        transition: "background 0.3s",
        position: "relative",
        zIndex: 99,
        gap: mobile ? 8 : 12,
      }}>

        {/* ── LEFT ── */}
        <div style={{ display: "flex", alignItems: "center", gap: mobile ? 8 : 14, flex: mobile ? 1 : "unset" }}>

          {/* Sidebar toggle — on mobile this opens drawer from BottomNav,
              but we still show it in topbar for quick access */}
          <Tooltip title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} placement="bottom">
            <button
              onClick={toggleSidebar}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40, borderRadius: 12,
                border: `1px solid ${isDark ? "#1E2A3B" : "#E8EEF6"}`,
                background: isDark ? "#111827" : "#F8FAFF",
                color: isDark ? "#94A3B8" : "#64748B",
                cursor: "pointer", transition: "all 0.18s ease",
                flexShrink: 0,
                /* Minimum touch target 44px visual area */
                minWidth: 40,
              }}
            >
              {(isMobile || sidebarCollapsed)
                ? <MenuUnfoldOutlined style={{ fontSize: 17 }} />
                : <MenuFoldOutlined   style={{ fontSize: 17 }} />
              }
            </button>
          </Tooltip>

          {/* Mobile: show school name centered */}
          {mobile && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: isDark ? "#E2E8F0" : "#0F172A",
                letterSpacing: "-0.01em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "block",
              }}>
                {user?.school?.name || "EduManage"}
              </span>
            </div>
          )}

          {/* Search — desktop only */}
          {!mobile && (
            <Input
              className="tb-search"
              placeholder="Search…"
              allowClear
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              prefix={<SearchOutlined style={{ color: isDark ? "#4B5875" : "#A0AABA", fontSize: 14 }} />}
              suffix={
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
                  color: isDark ? "#4B5875" : "#CBD5E1",
                  background: isDark ? "#1E2A3B" : "#EDF0F7",
                  padding: "1px 5px", borderRadius: 5,
                }}>
                  ⌘K
                </span>
              }
              style={{ width: 240 }}
            />
          )}
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", alignItems: "center", gap: mobile ? 4 : 8, flexShrink: 0 }}>

          {/* Mobile search icon */}
          {mobile && (
            <IconBtn
              isDark={isDark}
              icon={<SearchOutlined style={{ fontSize: 17 }} />}
              tooltip="Search"
              onClick={() => setMobileSearch(true)}
            />
          )}

          {/* Academic Year — desktop only */}
          {!mobile && user?.role?.name !== "Super Admin" && (
            <Suspense fallback={loader}>
              <AcademicYearSwitcher />
            </Suspense>
          )}

          {/* Divider */}
          {!mobile && (
            <span style={{ width: 1, height: 20, background: isDark ? "#1E2A3B" : "#E2E8F0" }} />
          )}

          {/* Theme toggle */}
          <Dropdown
            trigger={["click"]}
            menu={{
              selectedKeys: [themeMode],
              onClick: ({ key }) => setThemeMode(key),
              items: [
                { key: "light",  label: "Light"  },
                { key: "dark",   label: "Dark"   },
                { key: "system", label: "System" },
              ],
              style: { borderRadius: 12, padding: "4px", minWidth: 110 },
            }}
          >
            <span>
              <IconBtn
                isDark={isDark}
                tooltip={`Theme: ${themeMode}`}
                ariaLabel="Switch theme"
                icon={
                  themeMode === "system"
                    ? <LaptopOutlined style={{ fontSize: 17 }} />
                    : isDark
                      ? <SunOutlined  style={{ fontSize: 17 }} />
                      : <MoonOutlined style={{ fontSize: 17 }} />
                }
              />
            </span>
          </Dropdown>

          {/* Notifications */}
          <Suspense fallback={loader}>
            <NotificationDropdown />
          </Suspense>

          {/* Divider */}
          {!mobile && (
            <span style={{ width: 1, height: 20, background: isDark ? "#1E2A3B" : "#E2E8F0" }} />
          )}

          {/* User */}
          <Suspense fallback={loader}>
            <UserDropdown />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile Search Drawer ── */}
      <Drawer
        placement="top"
        height={72}
        onClose={() => setMobileSearch(false)}
        open={mobileSearch}
        closable={false}
        styles={{
          body: {
            padding: "16px",
            background: isDark ? "#111827" : "#fff",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 10,
          },
        }}
      >
        <Input
          autoFocus
          placeholder="Search anything…"
          allowClear
          className="tb-search"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onPressEnter={() => setMobileSearch(false)}
          prefix={<SearchOutlined style={{ color: isDark ? "#4B5875" : "#A0AABA", fontSize: 14 }} />}
          style={{ borderRadius: 10, flex: 1 }}
        />
        <button
          onClick={() => { setSearchVal(""); setMobileSearch(false); }}
          style={{
            flexShrink: 0,
            width: 36, height: 36,
            borderRadius: 10,
            border: `1px solid ${topbarBorder}`,
            background: isDark ? "#1A2438" : "#F4F7FF",
            color: isDark ? "#94A3B8" : "#64748B",
            cursor: "pointer",
            fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      </Drawer>
    </>
  );
};

export default memo(Topbar);
