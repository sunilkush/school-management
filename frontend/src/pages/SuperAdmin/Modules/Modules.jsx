import React from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../../utils/sidebar";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

// ✅ ModuleCard now accepts `Icon` as a prop (actual Lucide component)
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
        {Icon && <Icon className="w-6 h-6" />} {/* ✅ render icon safely */}
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

const AllModules = () => {
  const user = useSelector((state) => state.auth?.user);

  // ✅ normalize role
  const role =
    (typeof user?.role === "string" && user?.role?.name) ||
    "school admin";
  const normalizedRole = role.toLowerCase();

  // ✅ permissions fallback
  const permissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : [];

  // ✅ menu fallback
  const menu = Array.isArray(sidebarMenu[normalizedRole])
    ? sidebarMenu[normalizedRole]
    : [];

  // ✅ flatten menu with fallback icons
  const flattenMenu = (items) =>
    items.flatMap((item) =>
      item.subMenu && Array.isArray(item.subMenu)
        ? item.subMenu.map((sub) => ({
            title: sub.title,
            path: sub.path,
            icon: sub.icon || LayoutDashboard,
            parent: item.title,
          }))
        : [
            {
              title: item.title,
              path: item.path,
              icon: item.icon || LayoutDashboard,
              parent: null,
            },
          ]
    );

  const flattenedModules = flattenMenu(menu);

  // ✅ Safe permission check
  const hasPermission = (moduleTitle) => {
    if (normalizedRole === "super admin") return true; // full access
    return permissions?.some(
      (perm) =>
        typeof perm?.module === "string" &&
        perm.module.toLowerCase() === moduleTitle.toLowerCase()
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        All Modules - <span className="capitalize">{normalizedRole}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {flattenedModules.map((mod, idx) => (
          <ModuleCard
            key={idx}
            title={mod.title}
            parent={mod.parent}
            Icon={mod.icon}   // ✅ pass actual icon
            path={mod.path}
            hasAccess={hasPermission(mod.title)}
          />
        ))}
      </div>

      {flattenedModules.length === 0 && (
        <p className="text-center text-gray-500 mt-6">No modules available.</p>
      )}
    </div>
  );
};

export default AllModules;
