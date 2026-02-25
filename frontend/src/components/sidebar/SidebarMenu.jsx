import React, { useMemo, useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenu } from "../../utils/sidebar";

const { Sider } = Layout;

const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

const menuItems = useMemo(() => sidebarMenu[role] || [], [role]);

  // 🔹 Find active parent menu (on page refresh)
  const initialOpenKeys = menuItems
    .filter((item) =>
      item.subMenu?.some((sub) => sub.path === location.pathname)
    )
    .map((item) => item.title);

  const [openKeys, setOpenKeys] = useState(initialOpenKeys);

  // 🔹 Auto update open menu on route change
  useEffect(() => {
    setOpenKeys(initialOpenKeys);
 }, [initialOpenKeys]);

  // 🔹 Allow only ONE submenu open
  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  };

  // 🔹 Convert sidebar config to AntD format
  const antMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      if (!item.subMenu) {
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
        openKeys={openKeys}              // ✅ controlled
        onOpenChange={onOpenChange}      // ✅ one open at a time
        onClick={({ key }) => navigate(key)}
        style={{ height: "100%", borderRight: 0 }}
      />
    </Sider>
  );
};

export default SidebarMenu;
