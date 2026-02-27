import React, { useMemo, useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenu } from "../../utils/sidebar";

const { Sider } = Layout;

const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Always array safe
  const menuItems = useMemo(() => {
    return Array.isArray(sidebarMenu?.[role]) ? sidebarMenu[role] : [];
  }, [role]);

  // ✅ memoized initial open keys
  const initialOpenKeys = useMemo(() => {
    return menuItems
      .filter((item) =>
        item.subMenu?.some((sub) => sub.path === location.pathname)
      )
      .map((item) => item.title);
  }, [menuItems, location.pathname]);

  const [openKeys, setOpenKeys] = useState(initialOpenKeys);

  // ✅ sync when route changes
  useEffect(() => {
    setOpenKeys(initialOpenKeys);
  }, [initialOpenKeys]);

  // ✅ single submenu open (fixed stale state bug)
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  };

  // ✅ AntD items safe mapping
  const antMenuItems = useMemo(() => {
    if (!Array.isArray(menuItems)) return [];

    return menuItems.map((item) => {
      // 🔹 no submenu
      if (!item?.subMenu?.length) {
        return {
          key: item.path,
          icon: item.icon ? <item.icon size={16} /> : null,
          label: item.title,
        };
      }

      // 🔹 with submenu
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
      theme="light"
      style={{
        borderRight: "1px solid #f0f0f0",
        height: "100vh",
        position: "fixed",
        left: 0,
        overflow: "auto",
      }}
    >
      <Menu
        mode="inline"
        items={antMenuItems}
        selectedKeys={[location.pathname]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onClick={({ key }) => key && navigate(key)}
        style={{ height: "100%", borderRight: 0 }}
      />
    </Sider>
  );
};

export default SidebarMenu;