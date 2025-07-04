import React from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../utils/sidebar";
import { LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

const ModuleCard = ({ title, parent, Icon, hasAccess, path }) => {
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
        <Icon className="w-6 h-6" />
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

  const role =
    (typeof user?.role === "string"
      ? user?.role
      : user?.role?.name || "school admin"
    ).toLowerCase();

  const permissions = user?.role?.permissions || [];

  const menu = sidebarMenu[role] || [];

  const flattenMenu = (items) =>
    items.flatMap((item) =>
      item.subMenu
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

  const hasPermission = (moduleTitle) => {
    if (role === "super admin") return true; // ✅ Grant all access
    return permissions?.some(
      (perm) => perm?.module?.toLowerCase() === moduleTitle.toLowerCase()
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        All Modules - <span className="capitalize">{role}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {flattenedModules.map((mod, idx) => (
          <ModuleCard
            key={idx}
            title={mod.title}
            parent={mod.parent}
            Icon={mod.icon}
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
