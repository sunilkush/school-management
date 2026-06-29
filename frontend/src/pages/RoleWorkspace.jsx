import React, { useMemo } from "react";
import { Empty, Spin } from "antd";
import { useSelector } from "react-redux";
import {
  ShieldCheck, Users, BookOpen, GraduationCap, Calendar,
  DollarSign, Bus, Settings, ClipboardList, BarChart3,
  Bell, MessageSquare, Lock, CheckSquare, FileText,
  Layers, Database, Package, Building2, Wrench,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, iconWell } from "../styles/pageStyles";

/* ── Module → icon + color ───────────────────────────────────────── */
const MODULE_KEYS = [
  { key: "user",         icon: Users,        color: "#2563EB" },
  { key: "employee",     icon: Users,        color: "#2563EB" },
  { key: "student",      icon: GraduationCap,color: "#8B5CF6" },
  { key: "exam",         icon: ClipboardList, color: "#EF4444" },
  { key: "assessment",   icon: ClipboardList, color: "#EF4444" },
  { key: "class",        icon: BookOpen,     color: "#14B8A6" },
  { key: "subject",      icon: BookOpen,     color: "#06B6D4" },
  { key: "payroll",      icon: DollarSign,   color: "#22C55E" },
  { key: "fee",          icon: DollarSign,   color: "#22C55E" },
  { key: "transport",    icon: Bus,          color: "#F59E0B" },
  { key: "library",      icon: Layers,       color: "#7C3AED" },
  { key: "report",       icon: BarChart3,    color: "#F97316" },
  { key: "notification", icon: Bell,         color: "#F59E0B" },
  { key: "message",      icon: MessageSquare,color: "#06B6D4" },
  { key: "calendar",     icon: Calendar,     color: "#14B8A6" },
  { key: "role",         icon: ShieldCheck,  color: "#8B5CF6" },
  { key: "permission",   icon: Lock,         color: "#64748B" },
  { key: "task",         icon: CheckSquare,  color: "#F97316" },
  { key: "document",     icon: FileText,     color: "#3B82F6" },
  { key: "inventory",    icon: Package,      color: "#10B981" },
  { key: "building",     icon: Building2,    color: "#6366F1" },
  { key: "setting",      icon: Wrench,       color: "#94A3B8" },
  { key: "database",     icon: Database,     color: "#64748B" },
];

const getModuleMeta = (name = "") => {
  const lower = name.toLowerCase();
  const match = MODULE_KEYS.find((m) => lower.includes(m.key));
  return match ?? { icon: Settings, color: "#64748B" };
};

/* ── Action → pill style ─────────────────────────────────────────── */
const ACTION_STYLES = {
  read:    { color: "#1D4ED8", bg: "#DBEAFE" },
  view:    { color: "#1D4ED8", bg: "#DBEAFE" },
  create:  { color: "#15803D", bg: "#DCFCE7" },
  add:     { color: "#15803D", bg: "#DCFCE7" },
  write:   { color: "#B45309", bg: "#FEF3C7" },
  update:  { color: "#B45309", bg: "#FEF3C7" },
  edit:    { color: "#B45309", bg: "#FEF3C7" },
  delete:  { color: "#DC2626", bg: "#FEE2E2" },
  remove:  { color: "#DC2626", bg: "#FEE2E2" },
  manage:  { color: "#6D28D9", bg: "#EDE9FE" },
  publish: { color: "#0D9488", bg: "#CCFBF1" },
  approve: { color: "#0D9488", bg: "#CCFBF1" },
  export:  { color: "#6D28D9", bg: "#EDE9FE" },
  import:  { color: "#1D4ED8", bg: "#DBEAFE" },
};

const getActionStyle = (action = "") => {
  const lower = action.toLowerCase();
  const key = Object.keys(ACTION_STYLES).find((k) => lower.includes(k));
  return key ? ACTION_STYLES[key] : { color: "#475569", bg: "#F1F5F9" };
};

/* ── Component ───────────────────────────────────────────────────── */
const RoleWorkspace = () => {
  const { user }                       = useSelector((s) => s.auth);
  const { role, permissions, loading } = useSelector((s) => s.roleUi);

  const roleName = role?.name
    || (typeof user?.role === "string" ? user.role : user?.role?.name)
    || "User";

  const userName = user?.name || user?.email?.split("@")[0] || "User";

  const grouped = useMemo(() => {
    if (!Array.isArray(permissions)) return [];
    return permissions.map((item) => ({
      module:  item.module,
      actions: item.actions || [],
      meta:    getModuleMeta(item.module),
    }));
  }, [permissions]);

  const totalActions = useMemo(
    () => grouped.reduce((sum, g) => sum + g.actions.length, 0),
    [grouped],
  );

  /* Spinner */
  if (loading) {
    return (
      <div
        style={{
          ...pageWrapper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      {/* ── Standard page header ── */}
      <PageHeader
        title="Role Workspace"
        subtitle="Your access permissions and module assignments."
        icon={<ShieldCheck size={20} />}
      />

      <div style={{ padding: "20px 0 0" }}>

        {/* ── Welcome hero card ── */}
        <div
          style={{
            position:     "relative",
            background:   "linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)",
            borderRadius: 18,
            padding:      "28px 32px",
            marginBottom: 20,
            overflow:     "hidden",
            boxShadow:    "0 4px 24px rgba(37,99,235,0.3)",
          }}
        >
          {/* Decorative circles */}
          <div aria-hidden style={{
            position: "absolute", top: -40, right: -40,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} />
          <div aria-hidden style={{
            position: "absolute", bottom: -30, right: 80,
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Avatar initials */}
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0,
              backdropFilter: "blur(4px)",
            }}>
              {userName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                {userName}
              </div>
              <span style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          5,
                marginTop:    6,
                padding:      "3px 12px",
                background:   "rgba(255,255,255,0.18)",
                borderRadius: 99,
                fontSize:     12,
                fontWeight:   600,
                color:        "#fff",
                backdropFilter: "blur(4px)",
                border:       "1px solid rgba(255,255,255,0.25)",
              }}>
                <ShieldCheck size={12} />
                {roleName}
              </span>
            </div>

            {/* Summary chips */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Modules",     value: grouped.length },
                { label: "Permissions", value: totalActions   },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding:      "10px 18px",
                  background:   "rgba(255,255,255,0.14)",
                  border:       "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  backdropFilter: "blur(4px)",
                  textAlign:    "center",
                  minWidth:     72,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginTop: 3 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section label ── */}
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 3, height: 16, borderRadius: 2,
            background: "var(--primary)",
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text-muted)",
          }}>
            Module Access
          </span>
        </div>

        {/* ── Permission cards grid ── */}
        {grouped.length === 0 ? (
          <div style={{
            padding:      "64px 24px",
            textAlign:    "center",
            borderRadius: 18,
            border:       "1.5px dashed var(--border-color)",
            background:   "var(--surface)",
          }}>
            <Empty
              description={
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  No permissions assigned for this role yet.
                </span>
              }
            />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 14,
          }}>
            {grouped.map(({ module, actions, meta }) => {
              const Icon = meta.icon;
              return (
                <div
                  key={module}
                  style={{
                    background:   "var(--surface)",
                    border:       "1px solid var(--border-muted)",
                    borderRadius: 16,
                    padding:      "18px 20px",
                    boxShadow:    "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)",
                    transition:   "box-shadow 0.2s ease, transform 0.2s ease",
                    cursor:       "default",
                    borderTop:    `3px solid ${meta.color}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      ...iconWell(meta.color, 38),
                      borderRadius: 11,
                    }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize:   14,
                        fontWeight: 700,
                        color:      "var(--text-primary)",
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow:   "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {module}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {actions.length} permission{actions.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {/* Action count badge */}
                    <div style={{
                      width:        26,
                      height:       26,
                      borderRadius: 8,
                      background:   `${meta.color}18`,
                      color:        meta.color,
                      fontSize:     12,
                      fontWeight:   800,
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      flexShrink:   0,
                    }}>
                      {actions.length}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: 1, background: "var(--border-muted)", marginBottom: 12,
                  }} />

                  {/* Action pills */}
                  {actions.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No actions mapped</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {actions.map((action) => {
                        const { color, bg } = getActionStyle(action);
                        return (
                          <span
                            key={action}
                            style={{
                              display:      "inline-block",
                              padding:      "3px 10px",
                              background:   bg,
                              color,
                              borderRadius: 99,
                              fontSize:     11,
                              fontWeight:   600,
                              letterSpacing:"0.03em",
                              border:       `1px solid ${color}25`,
                            }}
                          >
                            {action.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleWorkspace;
