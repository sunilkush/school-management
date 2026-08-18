import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { sidebarMenu } from "../../../utils/sidebar";
import { Link } from "react-router-dom";
import { LayoutDashboard, Lock, Search, ShieldCheck } from "lucide-react";
import { Row, Col, Empty, Tooltip, Input } from "antd";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, pill } from "../../../styles/pageStyles";

const PALETTES = [
  { bg: "rgba(219,234,254,0.2)", text: "var(--primary)" },
  { bg: "rgba(220,252,231,0.2)", text: "var(--success)" },
  { bg: "rgba(20,184,166,0.2)", text: "var(--accent)" },
  { bg: "rgba(219,234,254,0.15)", text: "var(--primary)" },
  { bg: "rgba(254,243,199,0.25)", text: "var(--warning)" },
  { bg: "rgba(254,226,226,0.2)", text: "var(--danger)" },
];

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

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
    <div
      style={{
        ...sectionPanel,
        height: "100%",
        marginBottom: 0,
        cursor: hasAccess ? "pointer" : "default",
        opacity: hasAccess ? 1 : 0.6,
        transition: "0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={iconWell(palette.text, 46)}>
          {Icon ? <Icon size={22} /> : <LayoutDashboard size={22} />}
        </div>

        {hasAccess ? (
          <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Access</span>
        ) : (
          <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}><Lock size={11} /> Locked</span>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          {title}
        </div>

        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {parent || "Dashboard Module"}
          </span>
        </div>
      </div>
    </div>
  );

  return hasAccess ? (
    <Link style={{ textDecoration: "none" }} to={`/dashboard/${path}`}>
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
    <div style={pageWrapper}>
      <PageHeader
        title="All Modules"
        subtitle={`Role based module launcher for ${normalizedRole}`}
        icon={<LayoutDashboard size={18} />}
        extra={
          <Input
            allowClear
            prefix={<Search size={15} style={{ color: "var(--text-muted)" }} />}
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
        }
      />

      <div style={{ ...statGrid(170), marginTop: 20 }}>
        <StatCard icon={<LayoutDashboard size={20} />} label="Total Modules" value={enhancedModules.length} color="var(--primary)" />
        <StatCard icon={<ShieldCheck size={20} />} label="Access Granted" value={accessCount} color="var(--success)" />
        <StatCard icon={<Lock size={20} />} label="Locked Modules" value={lockedCount} color="var(--danger)" />
      </div>

      {filteredModules.length === 0 ? (
        <div style={sectionPanel}>
          <Empty description="No modules available" />
        </div>
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
  );
};

export default AllModules;
