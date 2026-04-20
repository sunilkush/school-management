import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Menu, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { InboxOutlined } from "@ant-design/icons";

const { Text } = Typography;

/* ─────────────────────────────────────────
   Design tokens — mirrors Sidebar.jsx
───────────────────────────────────────── */
const tokens = (isDark) => ({
  bg: "transparent",
  accent: "var(--color-primary)",
  accentBg: isDark ? "rgba(13,110,253,0.24)" : "rgba(13,110,253,0.14)",
  accentBgHover: isDark ? "rgba(13,110,253,0.2)" : "rgba(13,110,253,0.1)",
  textPrimary: "var(--color-sidebar-text)",
  textSecondary: "var(--color-sidebar-muted)",
  subItemIndent: "rgba(13, 110, 253, 0.45)",
  skeletonBase: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)",
});

/* ─────────────────────────────────────────
   Skeleton loader — shown while the config
   module is being lazy-loaded.
───────────────────────────────────────── */
const MenuSkeleton = ({ isDark }) => {
  const t = tokens(isDark);
  const rows = [1, 0.9, 0.95, 0.85, 0.9, 0.8];
  return (
    <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((opacity, i) => (
        <div
          key={i}
          style={{
            height: 36,
            borderRadius: 8,
            background: t.skeletonBase,
            opacity,
            animation: "menuPulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes menuPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────
   Empty state — no menu items for this role
───────────────────────────────────────── */
const EmptyMenuState = ({ isDark }) => {
  const t = tokens(isDark);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: t.accentBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <InboxOutlined style={{ fontSize: 20, color: t.accent }} />
      </div>
      <div>
        <Text
          style={{
            display: "block",
            fontWeight: 600,
            fontSize: 13,
            color: t.textPrimary,
          }}
        >
          No menu items
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 12,
            color: t.textSecondary,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          No navigation is configured
          <br />
          for this role yet.
        </Text>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Main SidebarMenu
───────────────────────────────────────── */
const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark: isDarkMode } = useTheme();
  const t = tokens(isDarkMode);

  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);

  /* Lazy-load sidebar config */
  useEffect(() => {
    let cancelled = false;
    const loadMenu = async () => {
      const module = await import("../../utils/sidebar");
      if (!cancelled) setSidebarConfig(module.sidebarMenu);
    };
    loadMenu();
    return () => { cancelled = true; };
  }, []);

  /* Derive flat menu items for this role */
  const menuItems = useMemo(() => {
    if (!sidebarConfig) return [];
    return Array.isArray(sidebarConfig?.[role]) ? sidebarConfig[role] : [];
  }, [role, sidebarConfig]);

  /* Auto-open parent when a child route is active */
  useEffect(() => {
    const currentPath = location.pathname.replace("/dashboard/", "");
    const activeParents = menuItems
      .filter((item) => item.subMenu?.some((sub) => currentPath.endsWith(sub.path)))
      .map((item) => item.title);
    setOpenKeys(activeParents);
  }, [menuItems, location.pathname]);

  /* Accordion: only one submenu open at a time */
  const onOpenChange = useCallback(
    (keys) => {
      const latestOpenKey = keys.find((k) => !openKeys.includes(k));
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    },
    [openKeys]
  );

  /* Build Ant Design menu item tree */
  const antMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      const icon = item.icon ? (
        <item.icon size={15} strokeWidth={1.8} />
      ) : null;

      if (!item?.subMenu?.length) {
        return { key: item.path, icon, label: item.title };
      }

      return {
        key: item.title,
        icon,
        label: item.title,
        children: item.subMenu.map((sub) => ({
          key: sub.path,
          icon: sub.icon ? <sub.icon size={13} strokeWidth={1.8} /> : null,
          label: sub.title,
        })),
      };
    });
  }, [menuItems]);

  const selectedKey = location.pathname.replace("/dashboard/", "");

  /* ── Render ── */
  if (!sidebarConfig) return <MenuSkeleton isDark={isDarkMode} />;
  if (antMenuItems.length === 0) return <EmptyMenuState isDark={isDarkMode} />;

  return (
    <>
      <style>{`
        /* ── Item base ── */
        .sidebar-nav .ant-menu-item,
        .sidebar-nav .ant-menu-submenu-title {
          border-radius: 8px !important;
          margin: 1px 8px !important;
          width: calc(100% - 16px) !important;
          height: 38px !important;
          line-height: 38px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: background 0.18s ease, color 0.18s ease !important;
        }

        /* ── Sub-item ── */
        .sidebar-nav .ant-menu-sub .ant-menu-item {
          height: 34px !important;
          line-height: 34px !important;
          font-size: 12.5px !important;
          font-weight: 400 !important;
          border-radius: 6px !important;
          margin: 1px 8px 1px 20px !important;
          width: calc(100% - 28px) !important;
          padding-left: 14px !important;
          position: relative;
        }

        /* Sub-item left accent bar */
        .sidebar-nav .ant-menu-sub .ant-menu-item::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 16px;
          border-radius: 2px;
          background: ${t.subItemIndent};
          transition: background 0.18s ease;
        }

        .sidebar-nav .ant-menu-sub .ant-menu-item-selected::before,
        .sidebar-nav .ant-menu-sub .ant-menu-item:hover::before {
          background: ${t.accent};
        }

        /* ── Selected item ── */
        .sidebar-nav.ant-menu-light .ant-menu-item-selected,
        .sidebar-nav.ant-menu-dark .ant-menu-item-selected {
          background: ${t.accentBg} !important;
          color: ${t.accent} !important;
          font-weight: 600 !important;
        }

        /* ── Hover ── */
        .sidebar-nav .ant-menu-item:hover,
        .sidebar-nav .ant-menu-submenu-title:hover {
          background: ${t.accentBgHover} !important;
          color: ${t.accent} !important;
        }

        /* ── Submenu parent open state ── */
        .sidebar-nav .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: ${t.accent} !important;
          font-weight: 600 !important;
        }

        /* ── Remove default left border indicator ── */
        .sidebar-nav.ant-menu-inline .ant-menu-item-selected::after,
        .sidebar-nav.ant-menu-inline .ant-menu-item::after {
          display: none !important;
        }

        /* ── Icon alignment ── */
        .sidebar-nav .ant-menu-item .ant-menu-item-icon,
        .sidebar-nav .ant-menu-submenu-title .ant-menu-item-icon {
          display: flex !important;
          align-items: center !important;
        }

        /* ── Inline submenu background ── */
        .sidebar-nav .ant-menu-sub.ant-menu-inline {
          background: transparent !important;
          padding: 2px 0 4px !important;
        }

        /* ── Remove default submenu arrow padding weirdness ── */
        .sidebar-nav .ant-menu-submenu-arrow {
          right: 12px !important;
          opacity: 0.5;
          transition: opacity 0.18s ease !important;
        }
        .sidebar-nav .ant-menu-submenu-open .ant-menu-submenu-arrow {
          opacity: 1;
        }

        /* ── Overall menu container ── */
        .sidebar-nav.ant-menu {
          border-inline-end: none !important;
          padding: 0 !important;
        }
      `}</style>

      <Menu
        className="sidebar-nav"
        mode="inline"
        items={antMenuItems}
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onClick={({ key }) => key && navigate(`/dashboard/${key}`)}
        theme={isDarkMode ? "dark" : "light"}
        style={{
          background: "transparent",
          borderRight: 0,
          fontSize: 13,
        }}
      />
    </>
  );
};

export default SidebarMenu;