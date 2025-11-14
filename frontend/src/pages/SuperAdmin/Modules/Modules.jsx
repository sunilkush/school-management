import React from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../../utils/sidebar";
import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";

// ⭐ Convert string → Lucide react icon safely
const getLucideIcon = (icon) => {
  if (!icon) return LucideIcons.LayoutDashboard;

  // If icon already a React component (function)
  if (typeof icon === "function") return icon;

  // If icon is a string inside LucideIcons map
  if (typeof icon === "string" && LucideIcons[icon]) {
    return LucideIcons[icon];
  }

  return LucideIcons.LayoutDashboard; // fallback icon
};

// ⭐ Module Card
const ModuleCard = ({ title, parent, hasAccess, path, Icon }) => {
  const content = (
    <div
      className={`border rounded-lg p-4 shadow-sm transition ${
        hasAccess ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-3 ${
          hasAccess ? "text-blue-600" : "text-gray-400"
        }`}
      >
        {Icon && <Icon className="w-6 h-6" />}
        <h2 className="font-semibold text-base">{title}</h2>
      </div>

      {parent && (
        <p className="text-xs text-gray-500 mt-1">
          Module Group: <span className="font-medium">{parent}</span>
        </p>
      )}

      <p className="text-sm text-gray-500 mt-2">
        {hasAccess ? "Access granted" : "No access"}
      </p>
    </div>
  );

  return hasAccess ? (
    <Link to={`/dashboard/${path}`}>{content}</Link>
  ) : (
    <div className="cursor-not-allowed opacity-70">{content}</div>
  );
};

// ⭐ Main Component
const AllModules = () => {
  const user = useSelector((state) => state.auth?.user);

  // normalize role
  const normalizedRole =
    (user?.role?.name || user?.role || "school admin").toLowerCase();

  // permissions array
  const permissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : [];

  // menu
  const menu = Array.isArray(sidebarMenu[normalizedRole])
    ? sidebarMenu[normalizedRole]
    : [];

  // ⭐ Flatten menu & ensure icon safety
  const flattenMenu = (items) =>
    items.flatMap((item) =>
      item.subMenu && Array.isArray(item.subMenu)
        ? item.subMenu.map((sub) => ({
            title: sub.title,
            path: sub.path,
            parent: item.title,
            icon: getLucideIcon(sub.icon),
          }))
        : [
            {
              title: item.title,
              path: item.path,
              parent: null,
              icon: getLucideIcon(item.icon),
            },
          ]
    );

  const modules = flattenMenu(menu);

  // ⭐ Check permission
  const hasPermission = (title) => {
    if (normalizedRole === "super admin") return true;

    return permissions?.some(
      (perm) =>
        typeof perm?.module === "string" &&
        perm.module.toLowerCase() === title.toLowerCase()
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        All Modules - <span className="capitalize">{normalizedRole}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((mod, idx) => (
          <ModuleCard
            key={idx}
            title={mod.title}
            parent={mod.parent}
            path={mod.path}
            Icon={mod.icon}
            hasAccess={hasPermission(mod.title)}
          />
        ))}
      </div>

      {modules.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No modules available.</p>
      )}
    </div>
  );
};

export default AllModules;
