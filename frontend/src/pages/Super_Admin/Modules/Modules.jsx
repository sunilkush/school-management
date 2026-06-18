import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../../utils/sidebar";
import { Link } from "react-router-dom";
import { LayoutDashboard, Lock, Search, ShieldCheck } from "lucide-react";
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Empty,
  Tooltip,
  Input,
  Space,
  Statistic,
} from "antd";

const { Title, Text } = Typography;

const PALETTES = [
  { bg: "rgba(167,199,231,0.2)", text: "#5B9EC9", ring: "rgba(167,199,231,0.5)" },
  { bg: "rgba(184,224,210,0.2)", text: "#5BA89A", ring: "rgba(184,224,210,0.5)" },
  { bg: "rgba(205,180,219,0.2)", text: "#9B87B8", ring: "rgba(205,180,219,0.5)" },
  { bg: "rgba(167,199,231,0.15)", text: "#5B9EC9", ring: "rgba(167,199,231,0.4)" },
  { bg: "rgba(253,226,167,0.25)", text: "#D4922A", ring: "rgba(253,226,167,0.5)" },
  { bg: "rgba(255,202,212,0.2)", text: "#D96B7A", ring: "rgba(255,202,212,0.5)" },
];

const css = `
.modules-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #fdf2f8 100%);
}

.modules-hero {
  background: #ffffffcc;
  backdrop-filter: blur(14px);
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  padding: 24px;
  margin-bottom: 18px;
  box-shadow: 0 12px 36px rgba(15,23,42,0.07);
}

.modules-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modules-stat {
  border-radius: 22px !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.06);
}

.module-card {
  height: 100%;
  border-radius: 22px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 26px rgba(15,23,42,0.05);
  transition: 0.2s ease;
  overflow: hidden;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 34px rgba(15,23,42,0.1);
}

.module-card.locked {
  opacity: 0.62;
  filter: grayscale(0.2);
}

.module-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-link {
  text-decoration: none;
}

@media (max-width: 768px) {
  .modules-page {
    padding: 14px;
  }
}
`;

const getLucideIcon = (icon) => {
  if (!icon) return LayoutDashboard;
  if (typeof icon === "function") return icon;
  return LayoutDashboard;
};

const normalizeLabel = (value = "") =>
  value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const detectModuleLabel = (title = "", parent = "") => {
  const fullLabel = normalizeLabel(`${parent} ${title}`);

  if (fullLabel.includes("timetable")) return "Timetable";
  if (fullLabel.includes("attendance")) return "Attendance";
  if (fullLabel.includes("exam")) return "Exam";
  if (fullLabel.includes("library") || fullLabel.includes("book")) return "Library";
  if (
    fullLabel.includes("transport") ||
    fullLabel.includes("route") ||
    fullLabel.includes("vehicle")
  ) {
    return "Transport";
  }
  if (fullLabel.includes("hostel") || fullLabel.includes("room")) return "Hostel";
  if (fullLabel.includes("fee")) return "Fees";
  if (fullLabel.includes("payroll")) return "Payroll";
  if (fullLabel.includes("inventory")) return "Inventory";

  return null;
};

const ModuleCard = ({ title, parent, path, Icon, hasAccess, palette }) => {
  const content = (
    <Card
      hoverable={hasAccess}
      bordered={false}
      className={`module-card ${!hasAccess ? "locked" : ""}`}
      bodyStyle={{ padding: 18 }}
    >
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div
          className="module-icon"
          style={{
            background: palette.bg,
            color: palette.text,
            boxShadow: `0 0 0 6px ${palette.ring}55`,
          }}
        >
          {Icon ? <Icon size={22} /> : <LayoutDashboard size={22} />}
        </div>

        {hasAccess ? (
          <Tag color="success" style={{ borderRadius: 999 }}>
            Access
          </Tag>
        ) : (
          <Tag color="error" icon={<Lock size={12} />} style={{ borderRadius: 999 }}>
            Locked
          </Tag>
        )}
      </Space>

      <div style={{ marginTop: 18 }}>
        <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
          {title}
        </Text>

        <div style={{ marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: "#64748b" }}>
            {parent || "Dashboard Module"}
          </Text>
        </div>
      </div>
    </Card>
  );

  return hasAccess ? (
    <Link className="module-link" to={`/dashboard/${path}`}>
      {content}
    </Link>
  ) : (
    <Tooltip title="You do not have permission">{content}</Tooltip>
  );
};

const AllModules = () => {
  const user = useSelector((state) => state.auth?.user);
  const [search, setSearch] = useState("");

  const normalizedRole =
    (user?.role?.name || user?.role || "school admin").toLowerCase();

  const permissions = Array.isArray(user?.role?.permissions)
    ? user.role.permissions
    : [];

  const menu = Array.isArray(sidebarMenu[normalizedRole])
    ? sidebarMenu[normalizedRole]
    : [];

  const modules = useMemo(() => {
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

    return flattenMenu(menu);
  }, [menu]);

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

  const enhancedModules = useMemo(
    () =>
      modules.map((mod) => ({
        ...mod,
        hasAccess: hasPermission(mod.title, mod.permissionModule),
      })),
    [modules, permissions, normalizedRole]
  );

  const filteredModules = useMemo(() => {
    const keyword = search.toLowerCase();

    return enhancedModules.filter((mod) => {
      return (
        !keyword ||
        mod.title?.toLowerCase().includes(keyword) ||
        mod.parent?.toLowerCase().includes(keyword)
      );
    });
  }, [enhancedModules, search]);

  const accessCount = enhancedModules.filter((m) => m.hasAccess).length;
  const lockedCount = enhancedModules.length - accessCount;

  return (
    <>
      <style>{css}</style>

      <div className="modules-page">
        <div className="modules-hero">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={12}>
              <Space align="center">
                <div className="modules-icon">
                  <LayoutDashboard size={26} />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    All Modules
                  </Title>
                  <Text style={{ color: "#64748b" }}>
                    Role based module launcher for{" "}
                    <b style={{ textTransform: "capitalize" }}>{normalizedRole}</b>
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Input
                allowClear
                size="large"
                prefix={<Search size={17} color="#94a3b8" />}
                placeholder="Search modules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderRadius: 14 }}
              />
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} className="modules-stat">
              <Statistic title="Total Modules" value={enhancedModules.length} />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card bordered={false} className="modules-stat">
              <Statistic
                title="Access Granted"
                value={accessCount}
                prefix={<ShieldCheck size={18} color="#5BA89A" />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card bordered={false} className="modules-stat">
              <Statistic
                title="Locked Modules"
                value={lockedCount}
                prefix={<Lock size={18} color="#D96B7A" />}
              />
            </Card>
          </Col>
        </Row>

        {filteredModules.length === 0 ? (
          <Card bordered={false} style={{ borderRadius: 24 }}>
            <Empty description="No modules available" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredModules.map((mod, index) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`${mod.title}-${index}`}>
                <ModuleCard
                  title={mod.title}
                  parent={mod.parent}
                  path={mod.path}
                  Icon={mod.icon}
                  hasAccess={mod.hasAccess}
                  palette={PALETTES[index % PALETTES.length]}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </>
  );
};

export default AllModules;