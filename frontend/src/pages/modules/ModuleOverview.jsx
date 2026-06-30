import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, Flex, Input, Typography } from "antd";
import { AppstoreOutlined, SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { getRoleModules } from "../../utils/moduleRegistry";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell, pill } from "../../styles/pageStyles.js";

const { Text } = Typography;

/* ── Module visual identity ──────────────────────────────────────── */
const MODULE_META = {
  "school-management":    { color: "#2563EB", emoji: "🏫", features: 5 },
  "academic-management":  { color: "#7C3AED", emoji: "📚", features: 5 },
  "student-management":   { color: "#10B981", emoji: "🎓", features: 4 },
  "teacher-management":   { color: "#F59E0B", emoji: "👩‍🏫", features: 5 },
  "attendance-system":    { color: "#EF4444", emoji: "✅", features: 5 },
  "exam-result":          { color: "#14B8A6", emoji: "📝", features: 6 },
  "timetable-management": { color: "#6366F1", emoji: "🗓️", features: 6 },
  "fees-management":      { color: "#22C55E", emoji: "💰", features: 5 },
  "transport-management": { color: "#F97316", emoji: "🚌", features: 5 },
  "hostel-management":    { color: "#8B5CF6", emoji: "🏠", features: 5 },
  "library-management":   { color: "#0EA5E9", emoji: "📖", features: 5 },
  "inventory":            { color: "#64748B", emoji: "📦", features: 4 },
  "communication":        { color: "#EC4899", emoji: "💬", features: 5 },
  "learning-management":  { color: "#84CC16", emoji: "🧑‍💻", features: 5 },
  "reports-analytics":    { color: "#A855F7", emoji: "📊", features: 5 },
};

/* ── Category groups ─────────────────────────────────────────────── */
const GROUPS = [
  {
    key: "admin", label: "Administration", color: "#2563EB",
    keys: ["school-management", "student-management", "teacher-management"],
  },
  {
    key: "academic", label: "Academic & Learning", color: "#7C3AED",
    keys: ["academic-management", "exam-result", "timetable-management", "learning-management", "attendance-system"],
  },
  {
    key: "finance", label: "Finance", color: "#22C55E",
    keys: ["fees-management"],
  },
  {
    key: "facilities", label: "Facilities & Resources", color: "#F97316",
    keys: ["transport-management", "hostel-management", "library-management", "inventory"],
  },
  {
    key: "comms", label: "Communication & Reports", color: "#EC4899",
    keys: ["communication", "reports-analytics"],
  },
];

/* ── Module card ─────────────────────────────────────────────────── */
const ModuleCard = ({ mod, meta, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--surface)",
      borderRadius: 14,
      border: "1px solid var(--border-muted)",
      padding: "16px 18px",
      cursor: "pointer",
      transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      height: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = `${meta.color}55`;
      e.currentTarget.style.boxShadow = `0 4px 20px ${meta.color}18`;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-muted)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {/* Colored left strip */}
    <div style={{
      width: 3, borderRadius: 3, alignSelf: "stretch",
      background: `linear-gradient(180deg, ${meta.color} 0%, ${meta.color}44 100%)`,
      flexShrink: 0,
    }} />

    {/* Emoji icon */}
    <div style={{
      width: 46, height: 46, borderRadius: 13, flexShrink: 0,
      background: `${meta.color}14`, border: `1px solid ${meta.color}28`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
    }}>
      {meta.emoji}
    </div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <Flex align="center" justify="space-between" gap={6} style={{ marginBottom: 5 }}>
        <Text strong style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {mod.title}
        </Text>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `${meta.color}14`, color: meta.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>
          →
        </div>
      </Flex>

      <Text style={{ fontSize: 12, color: "var(--text-muted)", display: "block", lineHeight: 1.5, marginBottom: 10 }}>
        {mod.description}
      </Text>

      <span style={pill(meta.color, `${meta.color}12`)}>
        {meta.features} features
      </span>
    </div>
  </div>
);

/* ── Group section header ────────────────────────────────────────── */
const GroupHeader = ({ label, color, count }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12, marginBottom: 14, marginTop: 8,
  }}>
    <div style={{
      width: 4, height: 20, borderRadius: 3,
      background: color, flexShrink: 0,
    }} />
    <Text strong style={{ fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </Text>
    <div style={{
      fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20,
      background: `${color}14`, color, border: `1px solid ${color}28`,
    }}>
      {count}
    </div>
    <div style={{ flex: 1, height: 1, background: "var(--border-muted)" }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const ModuleOverview = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.roleUi.permissions || []);
  const [search, setSearch] = useState("");

  const roleName = typeof user?.role === "string" ? user?.role : user?.role?.name || "";

  const modules = useMemo(() => {
    const permissionModules = permissions.map((p) => p.module);
    return getRoleModules(roleName, permissionModules);
  }, [roleName, permissions]);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules;
    const q = search.toLowerCase();
    return modules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q),
    );
  }, [modules, search]);

  /* Build grouped structure */
  const grouped = useMemo(() => {
    const moduleMap = Object.fromEntries(filteredModules.map((m) => [m.key, m]));
    const result = [];
    const placed = new Set();

    for (const grp of GROUPS) {
      const grpMods = grp.keys.map((k) => moduleMap[k]).filter(Boolean);
      if (grpMods.length > 0) {
        result.push({ ...grp, modules: grpMods });
        grpMods.forEach((m) => placed.add(m.key));
      }
    }

    /* Remaining modules not in any group */
    const others = filteredModules.filter((m) => !placed.has(m.key));
    if (others.length > 0) {
      result.push({ key: "other", label: "Other", color: "#64748B", modules: others });
    }

    return result;
  }, [filteredModules]);

  const totalFeatures = useMemo(
    () => modules.reduce((s, m) => s + (MODULE_META[m.key]?.features || 0), 0),
    [modules],
  );

  return (
    <>
      <PageHeader
        title="ERP Module Center"
        subtitle={`All modules available for ${roleName || "your role"}`}
        icon={<AppstoreOutlined />}
      />

      <div style={pageWrapper}>
        {/* ── Welcome strip ── */}
        <div style={{
          ...sectionPanel,
          marginBottom: 20,
          padding: "20px 24px",
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-soft) 100%)",
          borderLeft: "4px solid #2563EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
              Welcome to the Module Center
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              You have access to <strong style={{ color: "#2563EB" }}>{modules.length} modules</strong> with{" "}
              <strong style={{ color: "#7C3AED" }}>{totalFeatures}+ features</strong> as{" "}
              <strong style={{ color: "#10B981" }}>{roleName || "your role"}</strong>.
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Modules", value: modules.length, color: "#2563EB" },
              { label: "Categories", value: grouped.length, color: "#7C3AED" },
              { label: "Features", value: `${totalFeatures}+`, color: "#10B981" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{ marginBottom: 24 }}>
          <Input
            size="large"
            placeholder="Search modules by name or description…"
            prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 15 }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 12, maxWidth: 480 }}
          />
        </div>

        {/* ── Empty state ── */}
        {!modules.length ? (
          <div style={{ ...sectionPanel, textAlign: "center", padding: "64px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              No Module Access
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No module access has been configured for <strong>{roleName || "this role"}</strong>.
              Contact your administrator.
            </div>
          </div>
        ) : filteredModules.length === 0 ? (
          <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  No modules match "<strong>{search}</strong>"
                </span>
              }
            />
          </div>
        ) : (
          /* ── Grouped module grid ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {grouped.map((grp) => (
              <div key={grp.key}>
                <GroupHeader label={grp.label} color={grp.color} count={grp.modules.length} />
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 12,
                }}>
                  {grp.modules.map((mod) => {
                    const meta = MODULE_META[mod.key] || { color: "#2563EB", emoji: "📋", features: 0 };
                    return (
                      <ModuleCard
                        key={mod.key}
                        mod={mod}
                        meta={meta}
                        onClick={() => navigate(`/dashboard/modules/${mod.key}`)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ModuleOverview;
