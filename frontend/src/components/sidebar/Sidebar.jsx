import React, { lazy, memo, Suspense } from "react";
import { Layout, Typography, Spin, Avatar, Badge } from "antd";
import {
  LoadingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";

const SidebarMenu = lazy(() => import("./SidebarMenu"));

const { Sider } = Layout;
const { Text } = Typography;

/* ─────────────────────────────────────────
   Pastel role-color map — each role gets a
   signature pastel accent for its sidebar.
───────────────────────────────────────── */
const ROLE_COLORS = {
  "super admin":    { accent: "#2563EB", light: "#DBEAFE", bg: "rgba(219,234,254,0.12)", text: "#2E6A9A" },
  "school admin":   { accent: "#14B8A6", light: "rgba(20,184,166,0.15)", bg: "rgba(20,184,166,0.12)", text: "#6D28D9" },
  principal:        { accent: "#14B8A6", light: "rgba(20,184,166,0.15)", bg: "rgba(20,184,166,0.12)", text: "#6D28D9" },
  "vice principal": { accent: "#14B8A6", light: "rgba(20,184,166,0.15)", bg: "rgba(20,184,166,0.12)", text: "#6D28D9" },
  teacher:          { accent: "#22C55E", light: "#DCFCE7", bg: "rgba(220,252,231,0.12)", text: "#15803D" },
  student:          { accent: "#2563EB", light: "#DBEAFE", bg: "rgba(219,234,254,0.12)", text: "#2E6A9A" },
  parent:           { accent: "#F59E0B", light: "#FEF3C7", bg: "rgba(254,243,199,0.12)", text: "#B45309" },
  accountant:       { accent: "#2563EB", light: "#DBEAFE", bg: "rgba(219,234,254,0.12)", text: "#2E6A9A" },
  librarian:        { accent: "#14B8A6", light: "rgba(20,184,166,0.15)", bg: "rgba(20,184,166,0.12)", text: "#6D28D9" },
  "hostel warden":  { accent: "#22C55E", light: "#DCFCE7", bg: "rgba(220,252,231,0.12)", text: "#15803D" },
  "transport manager": { accent: "#F59E0B", light: "#FEF3C7", bg: "rgba(254,243,199,0.12)", text: "#B45309" },
  "exam coordinator":  { accent: "#EF4444", light: "#FEE2E2", bg: "rgba(254,226,226,0.12)", text: "#DC2626" },
  default:          { accent: "#2563EB", light: "#DBEAFE", bg: "rgba(219,234,254,0.12)", text: "#2E6A9A" },
};

const getRoleColor = (role) =>
  ROLE_COLORS[role?.toLowerCase()] ?? ROLE_COLORS.default;

/* ─────────────────────────────────────────
   Design tokens (light / dark)
───────────────────────────────────────── */
const tokens = (isDark, roleColor) => ({
  bg:           isDark ? "#1A2235" : "#ffffff",
  border:       isDark ? "#2A3550" : "#E2E8F0",
  headerBg:     isDark
    ? `linear-gradient(135deg, #1E2A3E, #232D44)`
    : `linear-gradient(135deg, ${roleColor.bg.replace("0.12)", "0.22)")}, rgba(255,255,255,0) 80%)`,
  iconBg:       isDark ? roleColor.bg.replace("0.12)", "0.2)") : roleColor.bg,
  iconColor:    roleColor.accent,
  accent:       roleColor.accent,
  accentLight:  roleColor.light,
  accentText:   roleColor.text,
  textPrimary:  isDark ? "#E8EDF7" : "#0F172A",
  textSecondary:isDark ? "#64748B" : "#94A3B8",
  scrollbarThumb: isDark ? "#2A3550" : "#DBEAFE",
  shimmer:      isDark ? "#1E2A3E" : "#F2F6FD",
  navActiveBg:  isDark
    ? `rgba(${roleColor.accent.replace("#","").match(/.{2}/g).map(h=>parseInt(h,16)).join(",")}, 0.15)`
    : roleColor.bg,
});

/* ─────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────── */
const MenuSkeleton = ({ isDark }) => {
  const shimmer = isDark ? "#1E2A3E" : "#F2F6FD";
  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 0.9, 0.95, 0.85, 0.9, 0.88].map((op, i) => (
        <div
          key={i}
          style={{
            height: 40,
            borderRadius: 10,
            background: shimmer,
            opacity: 1 - i * 0.1,
            animation: "sidebarPulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes sidebarPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────
   Auth-loading state
───────────────────────────────────────── */
const AuthLoadingState = ({ isDark }) => {
  const rc = getRoleColor("default");
  const t = tokens(isDark, rc);
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: t.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 22, color: t.accent }} spin />} />
        </div>
        <div style={{ textAlign: "center" }}>
          <Text style={{ display: "block", color: t.textPrimary, fontWeight: 600, fontSize: 13 }}>
            Loading…
          </Text>
          <Text style={{ display: "block", color: t.textSecondary, fontSize: 11, marginTop: 4 }}>
            Please wait a moment
          </Text>
        </div>
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

  const roleName = user?.role?.name;
  const roleColor = getRoleColor(roleName);
  const t = tokens(isDark, roleColor);

  const schoolName = user?.school?.name || "EduManage";
  const initials = schoolName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!accessToken) return <AuthLoadingState isDark={isDark} />;

  return (
    <>
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
        .sidebar-scroll::-webkit-scrollbar        { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track  { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb  {
          background: ${t.scrollbarThumb};
          border-radius: 4px;
        }
        .sidebar-toggle-btn:hover {
          background: ${t.iconBg} !important;
          color: ${t.accent} !important;
          transform: scale(1.08);
        }
        .sidebar-role-badge {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: capitalize;
          background: ${t.iconBg};
          color: ${t.accentText};
          border: 1px solid ${t.accentLight}66;
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
              ? "4px 0 32px rgba(0,0,0,0.45)"
              : `4px 0 32px rgba(37,99,235,0.10)`
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
          {/* Left: avatar + school name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Badge
              dot
              color="#22C55E"
              offset={[-2, 2]}
              style={{ boxShadow: `0 0 0 2px ${t.bg}` }}
            >
              <Avatar
                size={36}
                style={{
                  background: `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: `0 2px 10px ${t.accent}40`,
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
                {roleName && (
                  <span className="sidebar-role-badge" style={{ marginTop: 3 }}>
                    {roleName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Toggle button */}
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
                borderRadius: 7,
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

        {/* ── NAV SECTION LABEL ── */}
        {isOpen && (
          <div style={{ padding: "14px 20px 4px", flexShrink: 0 }}>
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
            <SidebarMenu role={roleName?.toLowerCase()} accentColor={t.accent} accentBg={t.iconBg} />
          </Suspense>
        </div>

        {/* ── FOOTER STATUS ── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${t.border}`,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isDark ? "transparent" : "rgba(247,248,252,0.6)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22C55E",
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(91,168,154,0.2)",
              animation: "onlinePulse 3s ease-in-out infinite",
            }}
          />
          {isOpen && (
            <Text style={{ fontSize: 11, color: t.textSecondary, fontWeight: 500 }}>
              System Online
            </Text>
          )}
          <style>{`
            @keyframes onlinePulse {
              0%, 100% { box-shadow: 0 0 0 3px rgba(91,168,154,0.2); }
              50%       { box-shadow: 0 0 0 5px rgba(91,168,154,0.08); }
            }
          `}</style>
        </div>
      </Sider>
    </>
  );
};

export default memo(Sidebar);
