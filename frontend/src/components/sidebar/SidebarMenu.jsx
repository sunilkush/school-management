import React, { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../utils/sidebar";

const { Sider } = Layout;
const { Text } = Typography;

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

const withModuleCenterMenu = (menuItems = []) => {
  const alreadyExists = menuItems.some((item) => item.path === "modules");
  if (alreadyExists) return menuItems;

  return [
    ...menuItems,
    {
      title: "ERP Modules",
      path: "modules",
    },
  ];
};

const SidebarMenu = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = useSelector((state) => state.roleUi.permissions);

  const menuItems = useMemo(() => {
    const roleMenu = Array.isArray(sidebarMenu?.[role]) ? sidebarMenu[role] : [];
    if (roleMenu.length) return withModuleCenterMenu(roleMenu);
    return withModuleCenterMenu(buildFallbackMenuFromPermissions(permissions));
  }, [role, permissions]);

  const initialOpenKeys = useMemo(() => {
    return menuItems
      .filter((item) =>
        item.subMenu?.some((sub) => location.pathname.endsWith(sub.path))
      )
      .map((item) => item.title);
  }, [menuItems, location.pathname]);

  const [openKeys, setOpenKeys] = useState(initialOpenKeys);

  useEffect(() => {
    setOpenKeys(initialOpenKeys);
  }, [initialOpenKeys]);

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
  };

  const antMenuItems = useMemo(() => {
    if (!Array.isArray(menuItems)) return [];

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
      theme="light"
      style={{
        borderRight: "1px solid #f0f0f0",
        height: "100vh",
        position: "fixed",
        left: 0,
        overflow: "auto",
      }}
    >
      {antMenuItems.length === 0 ? (
        <div className="p-4">
          <Text type="secondary">No menu configured for this role yet.</Text>
        </div>
      ) : (
        <Menu
          mode="inline"
          items={antMenuItems}
          selectedKeys={[location.pathname.replace("/dashboard/", "")]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={({ key }) => key && navigate(`/dashboard/${key}`)}
          style={{ height: "100%", borderRight: 0 }}
        />
      )}
    </Sider>
  );
};

export default SidebarMenu;
