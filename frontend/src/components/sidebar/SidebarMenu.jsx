import React, { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Typography, Spin } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";


const { Sider } = Layout;
const { Text } = Typography;

const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = useSelector((state) => state.roleUi.permissions);

  const [sidebarConfig, setSidebarConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
 
  // 🔥 Lazy load config
  useEffect(() => {
    const loadMenu = async () => {
      const module = await import("../../utils/sidebar");
      setSidebarConfig(module.sidebarMenu);
    };

    loadMenu();
  }, []);
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
  const buildFallbackMenuFromPermissions = (permissions = []) => {
    if (!Array.isArray(permissions) || permissions.length === 0) return [];

    return permissions.map((permission) => {
      const moduleKey = permission?.module
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      return {
        title: permission.module,
        path: `workspace/module/${moduleKey || "general"}`,
        subMenu: (permission.actions || []).map((action) => ({
          title: `${action[0]?.toUpperCase() || ""}${action.slice(1)} ${permission.module}`,
          path: `workspace/module/${moduleKey || "general"}/${action}`,
        })),
      };
    });
  };

  const menuItems = useMemo(() => {
    if (!sidebarConfig) return [];

    const roleMenu = Array.isArray(sidebarConfig?.[role])
      ? sidebarConfig[role]
      : [];

    if (roleMenu.length) return roleMenu;

    return buildFallbackMenuFromPermissions(permissions);
  }, [role, permissions, sidebarConfig]);

  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    const keys = menuItems
      .filter((item) =>
        item.subMenu?.some((sub) => location.pathname.endsWith(sub.path))
      )
      .map((item) => item.title);

    setOpenKeys(keys);
  }, [menuItems, location.pathname]);

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  };

  const antMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      if (!item?.subMenu?.length) {
        return {
          key: item.path,
          icon: item.icon ? <item.icon size={16} /> : null,
          label: item.title,
        };
      }

      return {
        key: item.title,
        icon: item.icon ? <item.icon size={16} /> : null,
        label: item.title,
        children: item.subMenu.map((sub) => ({
          key: sub.path,
          icon: sub.icon ? <sub.icon size={14} /> : null,
          label: sub.title,
        })),
      };
    });
  }, [menuItems]);

  return (
    <Sider
      width={260}
       theme={isDarkMode ? "dark" : "light"}
      style={{
        borderRight: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
        background: isDarkMode ? "#141414" : "#ffffff",
        height: "100vh",
        position: "fixed",
        left: 0,
        overflow: "auto",
      }}
    >
      {!sidebarConfig ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Spin />
        </div>
      ) : antMenuItems.length === 0 ? (
        <div className="p-4">
           <Text type="secondary" style={{ color: isDarkMode ? "#d9d9d9" : undefined }}>
            No menu configured for this role yet.
          </Text>
        </div>
      ) : (
        <Menu
          mode="inline"
          items={antMenuItems}
          selectedKeys={[location.pathname.replace("/dashboard/", "")]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={({ key }) => key && navigate(`/dashboard/${key}`)}
           style={{
            height: "100%",
            borderRight: 0,
            background: isDarkMode ? "#141414" : "#ffffff",
            color: isDarkMode ? "#ffffff" : undefined,
          }}
           theme={isDarkMode ? "dark" : "light"}
        />
      )}
    </Sider>
  );
};

export default SidebarMenu;