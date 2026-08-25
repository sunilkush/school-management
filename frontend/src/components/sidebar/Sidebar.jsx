import React, { lazy, memo, Suspense } from "react";
import { Typography, Spin, Avatar, Tooltip } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, LogOut, User,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/authSlice";

const SidebarMenu = lazy(() => import("./SidebarMenu"));
const { Text } = Typography;

/* ── Role accent colors ─────────────────────────────────────────── */
const ROLE_COLORS = {
  "super admin":       "var(--primary)",
  "school admin":      "var(--accent)",
  principal:           "var(--accent)",
  "vice principal":    "var(--cyan)",
  teacher:             "var(--success)",
  student:             "var(--purple)",
  parent:              "var(--warning)",
  accountant:          "var(--primary)",
  librarian:           "var(--accent)",
  "hostel warden":     "var(--success)",
  "transport manager": "var(--warning)",
  "exam coordinator":  "var(--danger)",
  receptionist:        "var(--pink)",
  counselor:           "var(--purple)",
  security:            "var(--text-secondary)",
  staff:               "var(--text-secondary)",
};
const getRoleAccent = (role) =>
  ROLE_COLORS[role?.toLowerCase()] ?? "var(--primary)";

/* ── Tokens ─────────────────────────────────────────────────────── */
const tk = (accent) => ({
  bg:          "var(--surface)",
  border:      "var(--border)",
  headerBg:    "var(--surface-soft)",
  accent,
  accentBg:    `color-mix(in srgb, ${accent} 9%, transparent)`,
  accentBorder:`color-mix(in srgb, ${accent} 19%, transparent)`,
  textPrimary: "var(--text)",
  textMuted:   "var(--text-muted)",
  hover:       "var(--surface-soft-hover)",
  scrollbar:   "var(--border)",
  userBg:      "var(--surface-soft)",
});

/* ── Menu skeleton ──────────────────────────────────────────────── */
const MenuSkeleton = ({ collapsed }) => (
  <div style={{ padding: collapsed ? "8px 10px" : "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
    {[1, 0.9, 0.95, 0.85, 0.9, 0.88, 0.82].map((op, i) => (
      <div key={i} style={{
        height: 36,
        borderRadius: 9,
        background: "var(--surface-soft)",
        opacity: op,
        width: collapsed ? 44 : "100%",
        margin: collapsed ? "0 auto" : undefined,
        animation: "sbPulse 1.5s ease-in-out infinite",
        animationDelay: `${i * 0.07}s`,
      }} />
    ))}
    <style>{`
      @keyframes sbPulse {
        0%,100% { opacity:0.45; }
        50%      { opacity:1; }
      }
    `}</style>
  </div>
);

/* ── Sidebar ────────────────────────────────────────────────────── */
const Sidebar = ({ collapsed, onToggle }) => {
  const { user }  = useSelector((s) => s.auth);
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  const roleName   = user?.role?.name ?? "";
  const accent     = getRoleAccent(roleName);
  const additionalRoleNames = (user?.additionalRoles || [])
    .map((r) => (typeof r === "string" ? r : r?.name))
    .filter(Boolean)
    .map((n) => n.toLowerCase());
  const t          = tk(accent);

  const rolePathMap = {
    "super admin": "superadmin", "school admin": "schooladmin",
    "vice principal": "viceprincipal", "exam coordinator": "examcoordinator",
    "subject coordinator": "subjectcoordinator", "hostel warden": "hostelwarden",
    "transport manager": "transportmanager", "it support": "itsupport",
    "support staff": "staff",
    "sports teacher": "sportsteacher",
    "lab technician": "labtechnician",
    "medical officer": "medicalofficer",
    "class teacher": "classteacher",
  };
  const rolePath = rolePathMap[roleName?.toLowerCase()] ?? roleName?.toLowerCase()?.replace(/\s+/g, "");

  const schoolName = user?.school?.name || "EduManage";
  const initials   = schoolName
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const userName   = user?.name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <>
      <style>{`
        /* Sidebar container */
        .sb-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background: ${t.bg};
          border-right: 1px solid ${t.border};
          position: sticky;
          top: 0;
          overflow: hidden;
        }

        /* Scroll area */
        .sb-scroll::-webkit-scrollbar        { width: 3px; }
        .sb-scroll::-webkit-scrollbar-track  { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb  {
          background: ${t.scrollbar};
          border-radius: 3px;
        }

        /* Toggle button */
        .sb-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid ${t.border};
          background: ${t.bg};
          color: ${t.textMuted};
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .sb-toggle:hover {
          background: ${t.accentBg};
          border-color: ${t.accentBorder};
          color: ${t.accent};
          transform: scale(1.06);
        }

        /* User button */
        .sb-user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: ${collapsed ? "8px 0" : "8px 10px"};
          border-radius: 10px;
          transition: background 0.18s ease;
          justify-content: ${collapsed ? "center" : "flex-start"};
        }
        .sb-user-btn:hover { background: ${t.hover}; }

        /* Logout button */
        .sb-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: ${t.textMuted};
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .sb-logout:hover {
          background: rgba(var(--danger-rgb), 0.1);
          color: var(--danger);
        }

        /* Online pulse */
        @keyframes onlineDot {
          0%,100% { box-shadow: 0 0 0 2px rgba(var(--success-rgb), 0.15); }
          50%      { box-shadow: 0 0 0 4px rgba(var(--success-rgb), 0.06); }
        }
      `}</style>

      <div className="sb-root">

        {/* ── BRAND HEADER ─────────────────────────────────── */}
        <div style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0 12px" : "0 14px 0 16px",
          background: t.headerBg,
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
          gap: 10,
        }}>
          {/* Logo / initials */}
          <Tooltip title={collapsed ? schoolName : ""} placement="right">
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1, cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, transparent))`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
                boxShadow: `0 3px 10px color-mix(in srgb, ${accent} 25%, transparent)`,
              }}>
                {initials}
              </div>

              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <Text ellipsis style={{
                    display: "block", fontSize: 13, fontWeight: 700,
                    color: t.textPrimary, lineHeight: 1.3,
                  }}>
                    {schoolName}
                  </Text>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                    textTransform: "capitalize",
                    color: accent,
                    background: `color-mix(in srgb, ${accent} 8%, transparent)`,
                    padding: "1px 7px", borderRadius: 99,
                    marginTop: 2, display: "inline-block",
                  }}>
                    {roleName}
                  </span>
                </div>
              )}
            </div>
          </Tooltip>

          {/* Collapse toggle — only on desktop (no onToggle means mobile drawer) */}
          {!collapsed && onToggle && (
            <button className="sb-toggle" onClick={onToggle} title="Collapse sidebar">
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* ── NAV LABEL ────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: "14px 20px 2px", flexShrink: 0 }}>
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: t.textMuted,
            }}>
              Main Menu
            </span>
          </div>
        )}

        {/* ── MENU ─────────────────────────────────────────── */}
        <div className="sb-scroll" style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "8px 0" : "4px 0 12px",
        }}>
          <Suspense fallback={<MenuSkeleton collapsed={collapsed} />}>
            <SidebarMenu
              role={roleName?.toLowerCase()}
              additionalRoles={additionalRoleNames}
              collapsed={collapsed}
              accentColor={accent}
              accentBg={t.accentBg}
            />
          </Suspense>
        </div>

        {/* ── DIVIDER ──────────────────────────────────────── */}
        <div style={{ height: 1, background: t.border, flexShrink: 0 }} />

        {/* ── USER FOOTER ──────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: collapsed ? "10px 12px" : "10px 12px",
          background: t.userBg,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
        }}>
          <Tooltip title={collapsed ? `${userName} · ${roleName}` : ""} placement="right">
            <button className="sb-user-btn" onClick={() => navigate(`/dashboard/${rolePath}/profile`)}>
              <Avatar
                size={32}
                style={{
                  flexShrink: 0,
                  background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 80%, transparent), color-mix(in srgb, ${accent} 40%, transparent))`,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>

              {!collapsed && (
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <Text ellipsis style={{
                    display: "block", fontSize: 12, fontWeight: 600,
                    color: t.textPrimary, lineHeight: 1.3,
                  }}>
                    {userName}
                  </Text>
                  <Text ellipsis style={{
                    display: "block", fontSize: 11,
                    color: t.textMuted, lineHeight: 1.3,
                  }}>
                    {roleName}
                  </Text>
                </div>
              )}
            </button>
          </Tooltip>

          {/* Logout */}
          {!collapsed && (
            <Tooltip title="Logout" placement="top">
              <button className="sb-logout" onClick={handleLogout}>
                <LogOut size={15} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* ── EXPAND BUTTON (collapsed mode) ───────────────── */}
        {collapsed && onToggle && (
          <div style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            padding: "8px 12px",
            borderTop: `1px solid ${t.border}`,
          }}>
            <button className="sb-toggle" onClick={onToggle} title="Expand sidebar">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(Sidebar);
