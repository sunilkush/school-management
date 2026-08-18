import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, Flex, Input, Typography } from "antd";
import { AppstoreOutlined, SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { getRoleModules } from "../../utils/moduleRegistry";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell, pill } from "../../styles/pageStyles.js";
import { categoricalColorFor } from "../../utils/colorPalette.js";

const { Text } = Typography;

/* ── Module visual identity ──────────────────────────────────────────
   15 modules need to stay visually distinguishable at a glance, so each
   draws a stable color from the shared categorical palette instead of a
   one-off hex — see utils/colorPalette.js. */
const MODULE_META = {
  "school-management":    { color: categoricalColorFor("school-management"), emoji: "🏫", features: 5 },
  "academic-management":  { color: categoricalColorFor("academic-management"), emoji: "📚", features: 5 },
  "student-management":   { color: categoricalColorFor("student-management"), emoji: "🎓", features: 4 },
  "teacher-management":   { color: categoricalColorFor("teacher-management"), emoji: "👩‍🏫", features: 5 },
  "attendance-system":    { color: categoricalColorFor("attendance-system"), emoji: "✅", features: 5 },
  "exam-result":          { color: categoricalColorFor("exam-result"), emoji: "📝", features: 6 },
  "timetable-management": { color: categoricalColorFor("timetable-management"), emoji: "🗓️", features: 6 },
  "fees-management":      { color: categoricalColorFor("fees-management"), emoji: "💰", features: 5 },
  "transport-management": { color: categoricalColorFor("transport-management"), emoji: "🚌", features: 5 },
  "hostel-management":    { color: categoricalColorFor("hostel-management"), emoji: "🏠", features: 5 },
  "library-management":   { color: categoricalColorFor("library-management"), emoji: "📖", features: 5 },
  "inventory":            { color: categoricalColorFor("inventory"), emoji: "📦", features: 4 },
  "communication":        { color: categoricalColorFor("communication"), emoji: "💬", features: 5 },
  "learning-management":  { color: categoricalColorFor("learning-management"), emoji: "🧑‍💻", features: 5 },
  "reports-analytics":    { color: categoricalColorFor("reports-analytics"), emoji: "📊", features: 5 },
};

/* ── Category groups ─────────────────────────────────────────────── */
const GROUPS = [
  {
    key: "admin", label: "Administration", color: "var(--primary)",
    keys: ["school-management", "student-management", "teacher-management"],
  },
  {
    key: "academic", label: "Academic & Learning", color: "var(--purple)",
    keys: ["academic-management", "exam-result", "timetable-management", "learning-management", "attendance-system"],
  },
  {
    key: "finance", label: "Finance", color: "var(--success)",
    keys: ["fees-management"],
  },
  {
    key: "facilities", label: "Facilities & Resources", color: "var(--orange)",
    keys: ["transport-management", "hostel-management", "library-management", "inventory"],
  },
  {
    key: "comms", label: "Communication & Reports", color: "var(--pink)",
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
      e.currentTarget.style.borderColor = `color-mix(in srgb, ${meta.color} 33%, transparent)`;
      e.currentTarget.style.boxShadow = `0 4px 20px color-mix(in srgb, ${meta.color} 9%, transparent)`;
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
      background: `linear-gradient(180deg, ${meta.color} 0%, color-mix(in srgb, ${meta.color} 27%, transparent) 100%)`,
      flexShrink: 0,
    }} />

    {/* Emoji icon */}
    <div style={{
      width: 46, height: 46, borderRadius: 13, flexShrink: 0,
      background: `color-mix(in srgb, ${meta.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${meta.color} 16%, transparent)`,
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
          background: `color-mix(in srgb, ${meta.color} 8%, transparent)`, color: meta.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>
          →
        </div>
      </Flex>

      <Text style={{ fontSize: 12, color: "var(--text-muted)", display: "block", lineHeight: 1.5, marginBottom: 10 }}>
        {mod.description}
      </Text>

      <span style={pill(meta.color, `color-mix(in srgb, ${meta.color} 7%, transparent)`)}>
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
      background: `color-mix(in srgb, ${color} 8%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 16%, transparent)`,
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
      result.push({ key: "other", label: "Other", color: "var(--text-muted)", modules: others });
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
          borderLeft: "4px solid var(--primary)",
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
              You have access to <strong style={{ color: "var(--primary)" }}>{modules.length} modules</strong> with{" "}
              <strong style={{ color: "var(--purple)" }}>{totalFeatures}+ features</strong> as{" "}
              <strong style={{ color: "var(--success)" }}>{roleName || "your role"}</strong>.
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Modules", value: modules.length, color: "var(--primary)" },
              { label: "Categories", value: grouped.length, color: "var(--purple)" },
              { label: "Features", value: `${totalFeatures}+`, color: "var(--success)" },
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
                    const meta = MODULE_META[mod.key] || { color: "var(--primary)", emoji: "📋", features: 0 };
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
