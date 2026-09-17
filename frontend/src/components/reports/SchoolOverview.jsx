import React, { useMemo } from "react";
import { Empty, Tooltip } from "antd";

/**
 * One school's numbers for one academic year, as the server's overview report returns them:
 * headline counts, students class by class, and boys and girls.
 *
 * Staff and parent counts are the school's today — they are not kept per year — so they say so,
 * while the student numbers are the year's own.
 */

const formatCount = (n) => Number(n || 0).toLocaleString("en-IN");
const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

/** "CLASS 2" before "CLASS 10", which a plain string sort gets wrong. */
const classOrder = (name = "") => Number(String(name).match(/\d+/)?.[0]) || 99;

/* Categorical colours for the gender split — checked for colour-blind separation and contrast on
   both themes; the dark set is the same hues stepped for the dark surface. "Not recorded" is a
   neutral grey, not a fourth hue. */
const CSS = `
  .school-overview { --so-male: #2a78d6; --so-female: #eb6834; --so-other: #1baf7a; --so-unknown: #94a3b8; }
  [data-theme="dark"] .school-overview { --so-male: #3987e5; --so-female: #d95926; --so-other: #199e70; --so-unknown: #64748b; }
`;
const GENDERS = [
  { key: "Male", label: "Male", color: "var(--so-male)" },
  { key: "Female", label: "Female", color: "var(--so-female)" },
  { key: "Other", label: "Other", color: "var(--so-other)" },
  { key: null, label: "Not recorded", color: "var(--so-unknown)" },
];

export const StatTile = ({ label, value, note, lead }) => (
  <div style={{
    flex: lead ? "2 1 220px" : "1 1 150px",
    padding: "14px 16px", borderRadius: 14,
    border: "1px solid var(--border-muted)", background: "var(--surface)",
  }}>
    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</div>
    <div style={{ fontSize: lead ? 40 : 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15 }}>
      {formatCount(value)}
    </div>
    {note && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{note}</div>}
  </div>
);

/** A bar in a row of a table — the length of the bar is the row's share of the largest. */
export const InlineBar = ({ value, max }) => (
  <span style={{ display: "block", height: 14, borderRadius: 4, background: "var(--primary-light)" }}>
    <span style={{
      display: "block", height: "100%", width: `${max ? (value / max) * 100 : 0}%`, minWidth: value ? 4 : 0,
      background: "var(--primary)", borderRadius: "0 4px 4px 0",
    }}
    />
  </span>
);

const ClassTable = ({ rows }) => {
  const total = rows.reduce((n, r) => n + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No students in a class this year" />;
  return (
    <div role="table" aria-label="Students by class">
      {rows.map((r) => (
        <Tooltip key={r.name} title={`${r.name}: ${formatCount(r.count)} student${r.count === 1 ? "" : "s"} · ${percent(r.count, total)}% of the school`}>
          <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(80px, 110px) 1fr 56px 44px", alignItems: "center", gap: 10, padding: "5px 0" }}>
            <span role="cell" style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
            <span role="cell"><InlineBar value={r.count} max={max} /></span>
            <span role="cell" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCount(r.count)}</span>
            <span role="cell" style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{percent(r.count, total)}%</span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

const GenderSplit = ({ rows }) => {
  const total = rows.reduce((n, r) => n + r.count, 0);
  if (!total) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No students this year" />;
  return (
    <div>
      <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", gap: 2, background: "var(--surface)" }}>
        {rows.filter((r) => r.count).map((r) => (
          <Tooltip key={r.label} title={`${r.label}: ${formatCount(r.count)} · ${percent(r.count, total)}%`}>
            <span style={{ width: `${(r.count / total) * 100}%`, background: r.color }} />
          </Tooltip>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
        {rows.map((r) => (
          <span key={r.label} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
            {r.label}
            <strong style={{ color: "var(--text-primary)" }}>{formatCount(r.count)}</strong>
            <span style={{ color: "var(--text-muted)" }}>{percent(r.count, total)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const SchoolOverview = ({ data, yearName }) => {
  const summary = data?.summary || {};
  const classRows = useMemo(
    () => (data?.classWise || [])
      .map((c) => ({ name: c._id || "No class", count: c.count || 0 }))
      .sort((a, b) => classOrder(a.name) - classOrder(b.name)),
    [data],
  );
  const genderRows = useMemo(() => {
    const counts = new Map();
    (data?.genderStats || []).forEach((g) => {
      const key = GENDERS.some((x) => x.key === g._id) ? g._id : null;
      counts.set(key, (counts.get(key) || 0) + (g.count || 0));
    });
    // Male and Female always show, even at zero; Other and Not recorded only when there are some.
    return GENDERS.map((g) => ({ ...g, count: counts.get(g.key) || 0 }))
      .filter((g) => g.count || g.key === "Male" || g.key === "Female");
  }, [data]);

  return (
    <div className="school-overview">
      <style>{CSS}</style>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <StatTile lead label="Students" value={summary.studentCount} note={yearName ? `studied in ${yearName}` : undefined} />
        <StatTile label="Teachers" value={summary.teacherCount} note="on the school today" />
        <StatTile label="Parents" value={summary.parentCount} note="on the school today" />
        <StatTile label="School admins" value={summary.adminCount} note="on the school today" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Students by class</div>
          <ClassTable rows={classRows} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Boys and girls</div>
          <GenderSplit rows={genderRows} />
        </div>
      </div>
    </div>
  );
};

export default SchoolOverview;
