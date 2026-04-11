import React, { lazy, memo, Suspense } from "react";
import { Layout, Typography, Spin, Avatar, Badge, Divider } from "antd";
import {
  HomeOutlined,
  LoadingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";

const SidebarMenu = lazy(() => import("./SidebarMenu"));

const { Sider } = Layout;
const { Text, Title } = Typography;

/* ─────────────────────────────────────────
   Token helpers — centralised so nothing
   is hardcoded twice.
───────────────────────────────────────── */
const tokens = (isDark) => ({
  bg: isDark ? "#0d0d0d" : "#ffffff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  headerBg: isDark
    ? "linear-gradient(135deg, #141414 0%, #1a1a1a 100%)"
    : "linear-gradient(135deg, #f0f7ff 0%, #e8f3ff 100%)",
  iconBg: isDark ? "#1d2b3a" : "#ddeeff",
  iconColor: isDark ? "#4da3ff" : "#1677ff",
  accent: isDark ? "#4da3ff" : "#1677ff",
  textPrimary: isDark ? "#e8e8e8" : "#1a1a2e",
  textSecondary: isDark ? "#6b7280" : "#9ca3af",
  scrollbarThumb: isDark ? "#2a2a2a" : "#e5e7eb",
  shimmer: isDark ? "#1a1a1a" : "#f9fafb",
});

/* ─────────────────────────────────────────
   Skeleton loader shown while SidebarMenu
   is lazy-loading.
───────────────────────────────────────── */
const MenuSkeleton = ({ isDark }) => {
  const t = tokens(isDark);
  const items = [1, 2, 3, 4, 5];
  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((i) => (
        <div
          key={i}
          style={{
            height: 40,
            borderRadius: 8,
            background: t.shimmer,
            opacity: 1 - i * 0.12,
            animation: "pulse 1.6s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────
   Auth-loading state shown when there's
   no access token yet.
───────────────────────────────────────── */
const AuthLoadingState = ({ isDark }) => {
  const t = tokens(isDark);
  return (
    <Sider
      width={260}
      theme={isDark ? "dark" : "light"}
      style={{
        height: "100vh",
        background: t.bg,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: 24,
        }}
      >
        {/* Animated ring */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: t.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 8px ${isDark ? "rgba(77,163,255,0.06)" : "rgba(22,119,255,0.08)"}`,
            animation: "ringPulse 2s ease-in-out infinite",
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 22, color: t.accent }} spin />} />
        </div>
        <div style={{ textAlign: "center" }}>
          <Text style={{ display: "block", color: t.textPrimary, fontWeight: 600, fontSize: 13 }}>
            Authenticating
          </Text>
          <Text style={{ display: "block", color: t.textSecondary, fontSize: 11, marginTop: 4 }}>
            Please wait a moment…
          </Text>
        </div>
        <style>{`
          @keyframes ringPulse {
            0%, 100% { box-shadow: 0 0 0 8px ${isDark ? "rgba(77,163,255,0.06)" : "rgba(22,119,255,0.08)"}; }
            50%       { box-shadow: 0 0 0 14px transparent; }
          }
        `}</style>
      </div>
    </Sider>
  );
};

/* ─────────────────────────────────────────
   Main Sidebar
───────────────────────────────────────── */
const Sidebar = ({ isOpen, onToggle }) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const role = user?.role?.name?.toLowerCase();
  const schoolName = user?.school?.name || "Super Admin";
  const initials = schoolName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!accessToken) return <AuthLoadingState isDark={isDark} />;

  return (
    <>
      {/* ── Global sidebar styles ── */}
      <style>{`
        .sidebar-root {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s ease !important;
        }
        .sidebar-root .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        /* Custom thin scrollbar */
        .sidebar-scroll::-webkit-scrollbar        { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track  { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb  {
          background: ${t.scrollbarThumb};
          border-radius: 4px;
        }
        /* Toggle button hover */
        .sidebar-toggle-btn:hover {
          background: ${isDark ? "#1f1f1f" : "#f0f7ff"} !important;
          color: ${t.accent} !important;
          transform: scale(1.08);
        }
        /* Role badge */
        .role-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: ${isDark ? "rgba(77,163,255,0.12)" : "rgba(22,119,255,0.08)"};
          color: ${t.accent};
          border: 1px solid ${isDark ? "rgba(77,163,255,0.2)" : "rgba(22,119,255,0.15)"};
        }
      `}</style>

      <Sider
        width={260}
        theme={isDark ? "dark" : "light"}
        trigger={null}
        className="sidebar-root"
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000,
          background: t.bg,
          borderRight: `1px solid ${t.border}`,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: isOpen
            ? isDark
              ? "4px 0 24px rgba(0,0,0,0.5)"
              : "4px 0 24px rgba(0,0,0,0.08)"
            : "none",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            padding: "0 16px",
            minHeight: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: t.headerBg,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
          }}
        >
          {/* Left: icon + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Badge
              dot
              color={isDark ? "#22c55e" : "#16a34a"}
              offset={[-2, 2]}
              style={{ boxShadow: `0 0 0 2px ${t.bg}` }}
            >
              <Avatar
                size={36}
                style={{
                  background: `linear-gradient(135deg, ${t.accent}, ${isDark ? "#1a56d4" : "#2563eb"})`,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${isDark ? "rgba(77,163,255,0.3)" : "rgba(22,119,255,0.25)"}`,
                }}
              >
                {initials}
              </Avatar>
            </Badge>

            {isOpen && (
              <div style={{ minWidth: 0 }}>
                <Text
                  ellipsis
                  strong
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: t.textPrimary,
                    lineHeight: 1.3,
                    maxWidth: 148,
                  }}
                >
                  {schoolName}
                </Text>
                {role && (
                  <span className="role-badge" style={{ marginTop: 3 }}>
                    {role}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Collapse / expand toggle */}
          {onToggle && (
            <button
              className="sidebar-toggle-btn"
              onClick={onToggle}
              title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.textSecondary,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              {isOpen ? (
                <MenuFoldOutlined style={{ fontSize: 14 }} />
              ) : (
                <MenuUnfoldOutlined style={{ fontSize: 14 }} />
              )}
            </button>
          )}
        </div>

        {/* ── NAV LABEL ── */}
        {isOpen && (
          <div
            style={{
              padding: "14px 20px 6px",
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: t.textSecondary,
              }}
            >
              Navigation
            </Text>
          </div>
        )}

        {/* ── MENU ── */}
        <div
          className="sidebar-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: isOpen ? "4px 0 16px" : "8px 0",
          }}
        >
          <Suspense fallback={<MenuSkeleton isDark={isDark} />}>
            <SidebarMenu role={role} />
          </Suspense>
        </div>

        {/* ── FOOTER ── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${t.border}`,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(34,197,94,0.15)",
            }}
          />
          {isOpen && (
            <Text
              style={{
                fontSize: 11,
                color: t.textSecondary,
                fontWeight: 500,
              }}
            >
              System Online
            </Text>
          )}
        </div>
      </Sider>
    </>
  );
};

export default memo(Sidebar);