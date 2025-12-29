import React, { useMemo } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenu } from "../../utils/sidebar";

const { Sider } = Layout;

const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = sidebarMenu[role] || [];

  // 🔹 Convert your sidebar config to AntD Menu format
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

  // 🔹 Open parent submenu automatically
  const openKeys = menuItems
    .filter((item) =>
      item.subMenu?.some((sub) => sub.path === location.pathname)
    )
    .map((item) => item.title);

  return (
    <Sider
      width={260}
      theme="light"
      style={{
        borderRight: "1px solid #f0f0f0",
        height: "100vh",
        position: "fixed",
        left: 0,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={openKeys}
        items={antMenuItems}
        onClick={({ key }) => navigate(key)}
        style={{ height: "100%", borderRight: 0 }}
      />
    </Sider>
  );
};

export default SidebarMenu;
