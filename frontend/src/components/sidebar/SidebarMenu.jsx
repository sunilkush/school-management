import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Menu, Tooltip, Typography, message as antdMessage } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { InboxOutlined, LockOutlined } from "@ant-design/icons";
import { canUpgrade, lockMessage, lockedModuleFor, UPGRADE_PATH } from "../../utils/planAccess";

const { Text } = Typography;

/* ─────────────────────────────────────────
   Design tokens — mirrors Sidebar.jsx
───────────────────────────────────────── */
const tokens = () => ({
  bg: "transparent",
  accent: "var(--purple)",
  accentBg: "rgba(var(--purple-rgb), 0.08)",
  accentBgHover: "rgba(var(--purple-rgb), 0.04)",
  textPrimary: "var(--text)",
  textSecondary: "var(--text-muted)",
  subItemIndent: "rgba(var(--purple-rgb), 0.15)",
  skeletonBase: "var(--surface-soft)",
});

/* ─────────────────────────────────────────
   Skeleton loader — shown while the config
   module is being lazy-loaded.
───────────────────────────────────────── */
const MenuSkeleton = () => {
  const t = tokens();
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
const EmptyMenuState = () => {
  const t = tokens();
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
const SidebarMenu = ({ role, additionalRoles = [], collapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark: isDarkMode } = useTheme();
  const t = tokens();
  // What the school's plan includes. null (Super Admin, no subscription, unreadable plan) = no locks.
  const planModules = useSelector((s) => s.auth?.user?.planModules ?? null);

  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);

  const [additionalMenus, setAdditionalMenus] = useState(null);

  /* Lazy-load sidebar config */
  useEffect(() => {
    let cancelled = false;
    const loadMenu = async () => {
      const module = await import("../../utils/sidebar");
      if (!cancelled) {
        setSidebarConfig(module.sidebarMenu);
        setAdditionalMenus(module.additionalRoleMenus || {});
      }
    };
    loadMenu();
    return () => { cancelled = true; };
  }, []);

  /* Derive flat menu items: primary role + additional roles (unique extras only) */
  const menuItems = useMemo(() => {
    if (!sidebarConfig || !additionalMenus) return [];
    const primary = Array.isArray(sidebarConfig?.[role]) ? sidebarConfig[role] : [];

    // Collect ALL existing paths from primary (deep, including subMenu) to avoid duplicates
    const seenPaths = new Set();
    const scan = (items) => {
      for (const item of items) {
        if (item.path) seenPaths.add(item.path);
        if (Array.isArray(item.subMenu)) scan(item.subMenu);
      }
    };
    scan(primary);

    // For additional roles, ONLY use the explicit "extra" config (not the full sidebar).
    // This prevents common items (Payroll, Profile, Module Hub…) from being duplicated.
    const extra = additionalRoles.flatMap((r) => {
      const key = typeof r === "string" ? r.toLowerCase() : "";
      const extras = additionalMenus[key];
      return Array.isArray(extras) ? extras.filter((i) => !seenPaths.has(i.path)) : [];
    });

    return [...primary, ...extra];
  }, [role, additionalRoles, sidebarConfig, additionalMenus]);

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

  /* Pages the school's plan does not include. They stay in the menu wearing a lock — clicking one
     explains what it needs instead of opening it. planModules === null means no limits. */
  const lockedByKey = useMemo(() => {
    const map = new Map();
    const walk = (items) => {
      for (const item of items) {
        const locked = lockedModuleFor(item, planModules);
        if (locked) map.set(item.path, locked);
        if (Array.isArray(item.subMenu)) walk(item.subMenu);
      }
    };
    walk(menuItems);
    return map;
  }, [menuItems, planModules]);

  /* Build Ant Design menu item tree */
  const antMenuItems = useMemo(() => {
    const lockedLabel = (title, moduleName) => (
      <Tooltip title={lockMessage(moduleName, role)} placement="right">
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
          <LockOutlined style={{ fontSize: 11, opacity: 0.75, flexShrink: 0 }} />
        </span>
      </Tooltip>
    );

    return menuItems.map((item) => {
      const icon = item.icon ? (
        <item.icon size={15} strokeWidth={1.8} />
      ) : null;

      if (!item?.subMenu?.length) {
        const locked = lockedByKey.get(item.path);
        return {
          key: item.path,
          icon,
          label: locked ? lockedLabel(item.title, locked) : item.title,
          className: locked ? "menu-locked" : undefined,
        };
      }

      const children = item.subMenu.map((sub) => {
        const locked = lockedByKey.get(sub.path);
        return {
          key: sub.path,
          icon: sub.icon ? <sub.icon size={13} strokeWidth={1.8} /> : null,
          label: locked ? lockedLabel(sub.title, locked) : sub.title,
          className: locked ? "menu-locked" : undefined,
        };
      });

      // A section whose every page is locked wears the lock itself, so it reads as locked while shut.
      const sectionModule = item.subMenu.every((sub) => lockedByKey.get(sub.path))
        ? lockedByKey.get(item.subMenu[0].path)
        : null;

      return {
        key: item.title,
        icon,
        label: sectionModule ? lockedLabel(item.title, sectionModule) : item.title,
        className: sectionModule ? "menu-locked" : undefined,
        children,
      };
    });
  }, [menuItems, lockedByKey, role]);

  const handleClick = useCallback(({ key }) => {
    if (!key) return;
    const locked = lockedByKey.get(key);
    if (!locked) {
      navigate(`/dashboard/${key}`);
      return;
    }
    antdMessage.info(lockMessage(locked, role));
    if (canUpgrade(role)) navigate(UPGRADE_PATH);
  }, [lockedByKey, navigate, role]);

  const selectedKey = location.pathname.replace("/dashboard/", "");

  /* ── Render ── */
  if (!sidebarConfig) return <MenuSkeleton />;
  if (antMenuItems.length === 0) return <EmptyMenuState />;

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

        /* ── Not in the school's plan ── */
        .sidebar-nav .ant-menu-item.menu-locked,
        .sidebar-nav .ant-menu-submenu.menu-locked > .ant-menu-submenu-title {
          opacity: 0.55;
        }
        .sidebar-nav .ant-menu-item.menu-locked:hover,
        .sidebar-nav .ant-menu-submenu.menu-locked > .ant-menu-submenu-title:hover {
          opacity: 0.8;
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
        inlineCollapsed={collapsed}
        items={antMenuItems}
        selectedKeys={[selectedKey]}
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={collapsed ? undefined : onOpenChange}
        onClick={handleClick}
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