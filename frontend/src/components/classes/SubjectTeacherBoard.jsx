import React, { useMemo, useState } from "react";
import { Empty, Input, Segmented, Select, Switch, Table, Tag } from "antd";
import { SearchOutlined, StarFilled, UserAddOutlined } from "@ant-design/icons";

// "Class 2" before "Class 10": compare the number in the name, then the name.
const classNumber = (name) => { const m = /\d+/.exec(name || ""); return m ? Number(m[0]) : null; };
const classOrder = (a, b) => (classNumber(a.name) ?? 999) - (classNumber(b.name) ?? 999) || String(a.name).localeCompare(String(b.name));

const BANDS = [
  { value: "all", label: "All classes", test: () => true },
  { value: "1-5", label: "1–5", test: (n) => n != null && n >= 1 && n <= 5 },
  { value: "6-8", label: "6–8", test: (n) => n != null && n >= 6 && n <= 8 },
  { value: "9-10", label: "9–10", test: (n) => n != null && n >= 9 && n <= 10 },
  { value: "11-12", label: "11–12", test: (n) => n != null && n >= 11 && n <= 12 },
];

/**
 * Who teaches what, for the whole school on one screen.
 *
 *  - By class: one table per class, a row per subject and a column per section; each cell is the
 *    teacher (click to change) or a red "Assign" where nobody is set.
 *  - By teacher: every teacher with the subjects and class-sections they take.
 *
 * Before this the only way to see it was to open each section on each class card, one at a time.
 *
 * @param classes   getClassData(): [{ _id, name, sections: [{ _id, name, classTeacherName, subjects: [{ _id, name, teacherId, teacherName }] }] }]
 * @param teachers  the school's teachers (for "By teacher", so someone with nothing assigned still shows)
 * @param onAssign  (cls, section, subject) => void — opens the assign dialog for that cell
 */
const SubjectTeacherBoard = ({ classes = [], teachers = [], onAssign }) => {
  const [mode, setMode] = useState("class");
  const [band, setBand] = useState("all");
  const [teacher, setTeacher] = useState(undefined);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => [...classes].sort(classOrder).map((c) => ({
    ...c,
    sections: [...(c.sections || [])].sort((a, b) => String(a.name).localeCompare(String(b.name))),
  })), [classes]);

  const inBand = useMemo(() => {
    const test = BANDS.find((b) => b.value === band)?.test || (() => true);
    return sorted.filter((c) => test(classNumber(c.name)));
  }, [sorted, band]);

  const totals = useMemo(() => {
    let slots = 0; let missing = 0;
    inBand.forEach((c) => c.sections.forEach((s) => (s.subjects || []).forEach((sub) => { slots += 1; if (!sub.teacherId) missing += 1; })));
    return { slots, missing };
  }, [inBand]);

  const teacherOptions = useMemo(() => {
    const m = new Map(teachers.map((t) => [String(t._id), t.name]));
    sorted.forEach((c) => c.sections.forEach((s) => (s.subjects || []).forEach((sub) => { if (sub.teacherId) m.set(String(sub.teacherId), sub.teacherName); })));
    return [...m.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [teachers, sorted]);

  const kw = search.trim().toLowerCase();

  /* ── By class ── */
  const classTables = useMemo(() => inBand.map((cls) => {
    const subjects = new Map();
    cls.sections.forEach((s) => (s.subjects || []).forEach((sub) => { if (sub._id && !subjects.has(String(sub._id))) subjects.set(String(sub._id), sub.name); }));
    const rows = [...subjects.entries()]
      .map(([subjectId, name]) => {
        const cells = cls.sections.map((s) => (s.subjects || []).find((x) => String(x._id) === subjectId) || null);
        return { key: subjectId, subjectId, name, cells };
      })
      .filter((r) => !kw || String(r.name).toLowerCase().includes(kw) || r.cells.some((c) => String(c?.teacherName || "").toLowerCase().includes(kw)))
      .filter((r) => !teacher || r.cells.some((c) => String(c?.teacherId || "") === teacher))
      .filter((r) => !onlyMissing || r.cells.some((c) => c && !c.teacherId))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { cls, rows };
  }).filter((t) => t.rows.length > 0), [inBand, kw, teacher, onlyMissing]);

  /* ── By teacher ── */
  const teacherRows = useMemo(() => {
    const m = new Map(teacherOptions.map((t) => [t.value, { key: t.value, name: t.label, load: new Map(), classTeacherOf: [] }]));
    inBand.forEach((cls) => cls.sections.forEach((s) => {
      const where = `${cls.name}-${s.name}`;
      if (s.classTeacherId && m.has(String(s.classTeacherId))) m.get(String(s.classTeacherId)).classTeacherOf.push(where);
      (s.subjects || []).forEach((sub) => {
        const row = sub.teacherId && m.get(String(sub.teacherId));
        if (!row) return;
        if (!row.load.has(sub.name)) row.load.set(sub.name, []);
        row.load.get(sub.name).push(where);
      });
    }));
    return [...m.values()]
      .map((r) => ({ ...r, sections: [...r.load.values()].reduce((n, l) => n + l.length, 0), subjects: [...r.load.entries()] }))
      .filter((r) => !teacher || r.key === teacher)
      .filter((r) => !kw || String(r.name).toLowerCase().includes(kw) || r.subjects.some(([n, l]) => String(n).toLowerCase().includes(kw) || l.join(" ").toLowerCase().includes(kw)))
      .sort((a, b) => b.sections - a.sections || String(a.name).localeCompare(String(b.name)));
  }, [inBand, teacherOptions, teacher, kw]);

  return (
    <div>
      {/* Toolbar */}
      <div className="section-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Segmented value={mode} onChange={setMode} options={[{ value: "class", label: "By class" }, { value: "teacher", label: "By teacher" }]} />
          <Segmented value={band} onChange={setBand} options={BANDS.map((b) => ({ value: b.value, label: b.label }))} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Input allowClear placeholder="Search subject or teacher" prefix={<SearchOutlined className="u-muted" />}
            value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 230 }} />
          <Select allowClear showSearch optionFilterProp="label" placeholder="All teachers" style={{ width: 200 }}
            value={teacher} onChange={setTeacher} options={teacherOptions} />
          {mode === "class" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <Switch checked={onlyMissing} onChange={setOnlyMissing} />
              Only unassigned
            </label>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "4px 0 16px", fontSize: 13 }}>
        <Tag color="blue" style={{ fontSize: 13, padding: "3px 10px" }}>{totals.slots} subject slots</Tag>
        <Tag color="green" style={{ fontSize: 13, padding: "3px 10px" }}>{totals.slots - totals.missing} have a teacher</Tag>
        {totals.missing > 0
          ? <Tag color="red" style={{ fontSize: 13, padding: "3px 10px" }}>{totals.missing} without a teacher</Tag>
          : totals.slots > 0 && <Tag color="green" style={{ fontSize: 13, padding: "3px 10px" }}>Every subject has a teacher</Tag>}
      </div>

      {mode === "class" ? (
        classTables.length === 0 ? (
          <div className="empty-state"><Empty description={onlyMissing ? "Nothing unassigned here" : "No subjects match"} /></div>
        ) : classTables.map(({ cls, rows }) => (
          <div key={cls._id} className="section-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div className="u-title">{cls.name}</div>
              <div className="u-meta">{cls.sections.length} section{cls.sections.length === 1 ? "" : "s"} · {rows.length} subject{rows.length === 1 ? "" : "s"}</div>
            </div>
            <Table
              rowKey="key" dataSource={rows} pagination={false} scroll={{ x: "max-content" }}
              columns={[
                { title: "Subject", dataIndex: "name", fixed: "left", width: 190, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                ...cls.sections.map((sec, i) => ({
                  title: (
                    <div>
                      <div>Section {sec.name}</div>
                      <div style={{ fontWeight: 400, fontSize: 11, color: "var(--text-muted)" }}>
                        <StarFilled style={{ fontSize: 9, marginRight: 3, color: "var(--purple)" }} />
                        {sec.classTeacherName || "No class teacher"}
                      </div>
                    </div>
                  ),
                  key: String(sec._id), width: 200,
                  render: (_, row) => {
                    const cell = row.cells[i];
                    if (!cell) return <span className="u-muted">Not taught</span>;
                    const sub = { _id: row.subjectId, name: row.name, teacherId: cell.teacherId };
                    return cell.teacherId ? (
                      <button type="button" onClick={() => onAssign(cls, sec, sub)} title="Change teacher"
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-primary)", fontWeight: teacher && String(cell.teacherId) === teacher ? 700 : 500, textAlign: "left" }}>
                        {cell.teacherName}
                      </button>
                    ) : (
                      <button type="button" onClick={() => onAssign(cls, sec, sub)}
                        style={{ background: "var(--danger-light)", border: "1px dashed var(--danger)", color: "var(--danger)", borderRadius: 8, padding: "3px 10px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                        <UserAddOutlined /> Assign
                      </button>
                    );
                  },
                })),
              ]}
            />
          </div>
        ))
      ) : (
        <div className="section-panel">
          <Table
            rowKey="key" dataSource={teacherRows} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: "max-content" }}
            locale={{ emptyText: <Empty description="No teachers match" /> }}
            columns={[
              { title: "Teacher", dataIndex: "name", width: 220, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
              {
                title: "Teaches",
                render: (_, r) => (r.subjects.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {r.subjects.map(([name, where]) => (
                      <div key={name} style={{ fontSize: 13 }}>
                        <Tag color="blue" style={{ marginRight: 8 }}>{name}</Tag>
                        <span style={{ color: "var(--text-secondary)" }}>{where.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                ) : <span className="u-muted">No subject assigned</span>),
              },
              { title: "Class teacher of", width: 190, render: (_, r) => (r.classTeacherOf.length ? r.classTeacherOf.join(", ") : <span className="u-muted">—</span>) },
              { title: "Sections", dataIndex: "sections", width: 100, sorter: (a, b) => a.sections - b.sections },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default SubjectTeacherBoard;
