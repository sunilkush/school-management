import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Menu, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { AuditOutlined, BankOutlined, BarChartOutlined, CalculatorOutlined, CalendarOutlined, DollarOutlined, FileTextOutlined, InboxOutlined, ProfileOutlined, SafetyCertificateOutlined, SettingOutlined, WalletOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

import { hasPermission } from "../../features/payroll/components/PayrollPermissionGuard";

const { Text } = Typography;
const antIconMap = { AuditOutlined, BankOutlined, BarChartOutlined, CalculatorOutlined, CalendarOutlined, DollarOutlined, FileTextOutlined, ProfileOutlined, SafetyCertificateOutlined, SettingOutlined, WalletOutlined };
const renderIcon = (icon, size = 15) => {
  if (!icon) return null;
  if (typeof icon === "string") {
    const Icon = antIconMap[icon] || DollarOutlined;
    return <Icon />;
  }
  const Icon = icon;
  return <Icon size={size} strokeWidth={1.8} />;
};

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const menuGroups = [
  {
    title: "Overview",
    matches: ["dashboard", "home"],
  },
  {
    title: "School Setup",
    matches: [
      "school",
      "academic year",
      "board",
      "class",
      "section",
      "subject",
      "chapter",
      "topic",
      "module",
      "master",
    ],
  },
  {
    title: "People",
    matches: [
      "user",
      "student",
      "teacher",
      "parent",
      "staff",
      "employee",
      "librarian",
      "accountant",
      "admin",
      "role",
      "designation",
      "children",
    ],
  },
  {
    title: "Academics",
    matches: [
      "academic",
      "classroom",
      "homework",
      "assignment",
      "attendance",
      "exam",
      "question",
      "grade",
      "timetable",
      "time table",
      "library",
      "admit",
      "seat",
    ],
  },
  {
    title: "Finance",
    matches: ["fee", "fees", "payroll", "salary", "payment", "revenue", "subscription", "plan", "tax", "loan", "payslip"],
  },
  {
    title: "Operations",
    matches: ["transport", "vehicle", "route", "hostel", "inventory", "asset", "supply", "room"],
  },
  {
    title: "Communication",
    matches: ["communication", "message", "notification"],
  },
  {
    title: "Reports & Support",
    matches: ["report", "analytics", "log", "audit", "ticket", "support", "faq", "documentation"],
  },
  {
    title: "Settings",
    matches: ["setting", "config", "backup", "permission", "profile"],
  },
];

const getMenuGroup = (item) => {
  const haystack = normalizeText([
    item?.group,
    item?.title,
    item?.path,
    ...(item?.subMenu || []).flatMap((sub) => [sub?.title, sub?.path, sub?.group]),
  ].filter(Boolean).join(" "));

  return menuGroups.find((group) => group.matches.some((match) => haystack.includes(match)))?.title || "Other";
};

const buildMenuItem = (item) => {
  const icon = item.icon ? renderIcon(item.icon, 15) : null;

  if (!item?.subMenu?.length) {
    return { key: item.path, icon, label: item.title };
  }

  return {
    key: item.title,
    icon,
    label: item.title,
    children: item.subMenu.map((sub) => ({
      key: sub.path,
      icon: renderIcon(sub.icon, 13),
      label: sub.title,
    })),
  };
};

/* ─────────────────────────────────────────
   Design tokens — mirrors Sidebar.jsx
───────────────────────────────────────── */
const tokens = (isDark) => ({
  bg: "transparent",
  accent: isDark ? "#4da3ff" : "#1677ff",
  accentBg: isDark ? "rgba(77,163,255,0.08)" : "rgba(22,119,255,0.07)",
  accentBgHover: isDark ? "rgba(77,163,255,0.05)" : "rgba(22,119,255,0.04)",
  textPrimary: isDark ? "#e8e8e8" : "#1a1a2e",
  textSecondary: isDark ? "#6b7280" : "#9ca3af",
  subItemIndent: isDark ? "rgba(77,163,255,0.15)" : "rgba(22,119,255,0.12)",
  skeletonBase: isDark ? "#1a1a1a" : "#f4f6f8",
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

  const user = useSelector((state) => state.auth.user);
  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [openKeys, setOpenKeys] = useState([]);

  /* Lazy-load sidebar config */
  useEffect(() => {
    let cancelled = false;
    const loadMenu = async () => {
      const module = await import("../../utils/sidebar");
      if (!cancelled) setSidebarConfig(module);
    };
    loadMenu();
    return () => { cancelled = true; };
  }, []);

  /* Derive flat menu items for this role */
  const menuItems = useMemo(() => {
    if (!sidebarConfig) return [];
    const baseItems = typeof sidebarConfig.getSidebarMenuByRole === "function"
      ? sidebarConfig.getSidebarMenuByRole(role)
      : [];

    return baseItems
      .map((item) => {
        if (!item?.subMenu?.length) return hasPermission(user, item.permission) ? item : null;
        const subMenu = item.subMenu.filter((sub) => hasPermission(user, sub.permission));
        return subMenu.length ? { ...item, subMenu } : null;
      })
      .filter(Boolean);
  }, [role, sidebarConfig, user]);

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

  /* Build a grouped Ant Design menu item tree */
  const antMenuItems = useMemo(() => {
    const groupedItems = menuItems.reduce((groups, item) => {
      const groupTitle = getMenuGroup(item);
      if (!groups.has(groupTitle)) groups.set(groupTitle, []);
      groups.get(groupTitle).push(buildMenuItem(item));
      return groups;
    }, new Map());

    return Array.from(groupedItems.entries()).map(([groupTitle, children]) => ({
      key: `group-${groupTitle}`,
      type: "group",
      label: groupTitle,
      children,
    }));
  }, [menuItems]);

  const selectedKey = location.pathname.replace("/dashboard/", "");

  /* ── Render ── */
  if (!sidebarConfig) return <MenuSkeleton isDark={isDarkMode} />;
  if (antMenuItems.length === 0) return <EmptyMenuState isDark={isDarkMode} />;

  return (
    <>
      <style>{`
        /* ── Group label ── */
        .sidebar-nav .ant-menu-item-group-title {
          color: ${t.textSecondary} !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          line-height: 18px !important;
          margin: 12px 16px 4px !important;
          padding: 0 !important;
          text-transform: uppercase !important;
        }

        .sidebar-nav .ant-menu-item-group:first-child .ant-menu-item-group-title {
          margin-top: 4px !important;
        }

        .sidebar-nav .ant-menu-item-group-list {
          margin: 0 !important;
        }

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