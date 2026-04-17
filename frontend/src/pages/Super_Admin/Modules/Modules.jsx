import React from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../../utils/sidebar";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Empty,
  Tooltip,
} from "antd";

const { Title, Text } = Typography;

// 🎨 Controlled random colors
const COLORS = [
  "blue",
  "green",
  "purple",
  "cyan",
  "geekblue",
  "magenta",
  "volcano",
];

// ⭐ Safe icon resolver
const getLucideIcon = (icon) => {
  if (!icon) return LayoutDashboard;
  if (typeof icon === "function") return icon;
  return LayoutDashboard;
};

const normalizeLabel = (value = "") =>
  value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const detectModuleLabel = (title = "", parent = "") => {
  const fullLabel = normalizeLabel(`${parent} ${title}`);

  if (fullLabel.includes("timetable")) return "Timetable";
  if (fullLabel.includes("attendance")) return "Attendance";
  if (fullLabel.includes("exam")) return "Exam";
  if (fullLabel.includes("library") || fullLabel.includes("book")) return "Library";
  if (fullLabel.includes("transport") || fullLabel.includes("route") || fullLabel.includes("vehicle")) {
    return "Transport";
  }
  if (fullLabel.includes("hostel") || fullLabel.includes("room")) return "Hostel";
  if (fullLabel.includes("fee")) return "Fees";
  if (fullLabel.includes("payroll")) return "Payroll";
  if (fullLabel.includes("inventory")) return "Inventory";

  return null;
};

// ⭐ Module Card
const ModuleCard = ({ title, parent, path, Icon, hasAccess, color }) => {
  const content = (
    <Card
      hoverable={hasAccess}
      className={`h-full rounded-xl transition-all ${
        hasAccess
          ? "border border-gray-200 hover:shadow-lg"
          : "border border-dashed opacity-70"
      }`}
      bodyStyle={{ padding: 16 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-50 text-${color}-600`}
        >
          {Icon && <Icon size={20} />}
        </div>

        <div>
          <Text strong className="block">
            {title}
          </Text>
          {parent && (
            <Text type="secondary" className="text-xs">
              {parent}
            </Text>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <Tag color={hasAccess ? "green" : "red"}>
          {hasAccess ? "Access Granted" : "No Access"}
        </Tag>
      </div>
    </Card>
  );

  return hasAccess ? (
    <Link to={`/dashboard/${path}`}>{content}</Link>
  ) : (
    <Tooltip title="You do not have permission">{content}</Tooltip>
  );
};

// ⭐ Main Component
const AllModules = () => {
  const user = useSelector((state) => state.auth?.user);

  const normalizedRole =
    (user?.role?.name || user?.role || "school admin").toLowerCase();

  const permissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : [];

  const menu = Array.isArray(sidebarMenu[normalizedRole])
    ? sidebarMenu[normalizedRole]
    : [];

  const flattenMenu = (items) =>
    items.flatMap((item) =>
      item.subMenu
        ? item.subMenu.map((sub) => ({
            title: sub.title,
            path: sub.path,
            parent: item.title,
            icon: getLucideIcon(sub.icon),
            permissionModule: detectModuleLabel(sub.title, item.title),
          }))
        : [
            {
              title: item.title,
              path: item.path,
              parent: null,
              icon: getLucideIcon(item.icon),
              permissionModule: detectModuleLabel(item.title),
            },
          ]
    );

  const modules = flattenMenu(menu);

  const hasPermission = (title, permissionModule) => {
    if (normalizedRole === "super admin") return true;
    const normalizedTitle = normalizeLabel(title);
    const normalizedPermissionModule = normalizeLabel(permissionModule || "");

    return permissions.some((perm) => {
      const moduleName = normalizeLabel(perm?.module || "");
      if (!moduleName) return false;

      return (
        moduleName === normalizedTitle ||
        (normalizedPermissionModule && moduleName === normalizedPermissionModule)
      );
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="!mb-1">
          All Modules
        </Title>
        <Text type="secondary">
          Role: <span className="capitalize">{normalizedRole}</span>
        </Text>
      </div>

      {/* Grid */}
      {modules.length === 0 ? (
        <Empty description="No modules available" />
      ) : (
        <Row gutter={[16, 16]}>
          {modules.map((mod, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <ModuleCard
                title={mod.title}
                parent={mod.parent}
                path={mod.path}
                Icon={mod.icon}
                hasAccess={hasPermission(mod.title, mod.permissionModule)}
                color={COLORS[index % COLORS.length]}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default AllModules;
