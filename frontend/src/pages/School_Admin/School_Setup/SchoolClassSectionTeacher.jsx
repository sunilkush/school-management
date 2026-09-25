import React, { useEffect, useMemo, useState } from "react";

import {
  Select,
  Button,
  Space,
  Input,
  Empty,
  message,
  Spin,
  Skeleton,
} from "antd";
import { TeamOutlined, SearchOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllUser } from "../../../features/authSlice";
import {
  assignClassTeacher,
  fetchSections,
} from "../../../features/sectionSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";

const { Option } = Select;

const tokens = () => ({
  innerBg: "var(--background)",
  border: "var(--border-muted)",
  textPri: "var(--text)",
  textSec: "var(--text-secondary)",
  accent: "var(--primary)",
  accentBg: "rgba(var(--primary-rgb), 0.08)",
});

// Class names are plain strings like "Class 10", "Nursery", "UKG" — a plain alphabetical sort
// would put "Class 10" before "Class 2". Pre-primary names get a fixed rank ahead of any numbered
// class (matching real school progression); numbered classes sort on the number they contain;
// anything unrecognized falls back to alphabetical, after the numbered classes.
const PRE_PRIMARY_RANK = { "pre-nursery": 0, "playgroup": 1, "nursery": 2, "lkg": 3, "kg": 3, "ukg": 4 };

const classSortKey = (name) => {
  const n = (name || "").trim().toLowerCase();
  if (n in PRE_PRIMARY_RANK) return PRE_PRIMARY_RANK[n];
  const match = n.match(/(\d+)/);
  if (match) return 100 + Number(match[1]);
  return 9999;
};

const compareClassNames = (a, b) => {
  const diff = classSortKey(a) - classSortKey(b);
  return diff !== 0 ? diff : (a || "").localeCompare(b || "");
};

const SchoolClassSectionTeacher = ({ next }) => {
  const dispatch = useDispatch();
  const t = tokens();

  const { sections = [], loading } = useSelector((s) => s.section || {});
  const { users = [], user } = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [savingKey, setSavingKey] = useState(null);
  const [classFilter, setClassFilter] = useState(null);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [search, setSearch] = useState("");

  // selectedAcademicYear is normally populated as a side effect of <AcademicYearSwitcher> mounting
  // in the Topbar — but this is Step 5 of the setup wizard, right after Step 1 creates the academic
  // year, and the switcher may not have refreshed yet. Without this, academicYearId stays null and
  // the gated fetch below never fires, so this step showed "No Data Found" forever. The reducer
  // (academicYearSlice.js) is idempotent about this — repeating the fetch is harmless.
  useEffect(() => {
    if (schoolId && !activeYear) dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId, activeYear]);

  /* ───────── FETCH ───────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSections({ schoolId, academicYearId }));
    }

    dispatch(
      fetchAllUser({
        roleName: ["Teacher"],
        isActive: true,
      })
    );
  }, [dispatch, schoolId, academicYearId]);

  /* ───────── DATA ───────── */
  // sections arrives in raw DB order — sort by class (Nursery → Class 12), then by section within
  // a class, so this step reads in the same order a school admin thinks in.
  const allRows = useMemo(() => {
    return sections
      // A section with no schoolClassId (or a class ref that failed to populate — e.g. the class
      // was deleted) has nothing meaningful to assign a teacher to; skip it instead of showing an
      // "N/A" row.
      .filter((sec) => sec.schoolClassId?._id && sec.schoolClassId?.name)
      .map((sec) => ({
        key: sec._id,
        classId: sec.schoolClassId._id,
        className: sec.schoolClassId.name,
        sectionId: sec._id,
        sectionName: sec.name,
        teacherId: sec.classTeacherId?._id || null,
      }))
      .sort((a, b) => {
        const classDiff = compareClassNames(a.className, b.className);
        return classDiff !== 0 ? classDiff : (a.sectionName || "").localeCompare(b.sectionName || "");
      });
  }, [sections]);

  // How many sections each teacher is already class teacher of. Small schools reuse teachers on
  // purpose, so this is never a warning — it is shown inside the dropdown, next to the name, so the
  // load is visible at the moment of choosing and nowhere else.
  const sectionsPerTeacher = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => {
      if (r.teacherId) map.set(r.teacherId, (map.get(r.teacherId) || 0) + 1);
    });
    return map;
  }, [allRows]);

  // Progress is always counted over every section, never over what the filters left on screen —
  // otherwise "Without a teacher" would report 0 of 3 assigned for a class that is nearly done.
  const perClass = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => {
      const stat = map.get(r.classId) || { total: 0, assigned: 0 };
      stat.total += 1;
      if (r.teacherId) stat.assigned += 1;
      map.set(r.classId, stat);
    });
    return map;
  }, [allRows]);

  const classOptions = useMemo(() => {
    const seen = new Map();
    allRows.forEach((r) => { if (r.classId && !seen.has(r.classId)) seen.set(r.classId, r.className); });
    return [...seen.entries()]
      .sort((a, b) => compareClassNames(a[1], b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [allRows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (classFilter && r.classId !== classFilter) return false;
      if (onlyUnassigned && r.teacherId) return false;
      if (!q) return true;
      const teacher = users.find((u) => u._id === r.teacherId)?.name || "";
      return `${r.className} ${r.sectionName} ${teacher}`.toLowerCase().includes(q);
    });
  }, [allRows, classFilter, onlyUnassigned, search, users]);

  // One card per class. visibleRows is already in class-then-section order, so a single grouping
  // pass keeps that order.
  const classCards = useMemo(() => {
    const cards = [];
    const byId = new Map();
    visibleRows.forEach((row) => {
      let card = byId.get(row.classId);
      if (!card) {
        card = { classId: row.classId, className: row.className, rows: [] };
        byId.set(row.classId, card);
        cards.push(card);
      }
      card.rows.push(row);
    });
    return cards;
  }, [visibleRows]);

  const assignedCount = allRows.filter((r) => r.teacherId).length;
  const isAllAssigned = allRows.length > 0 && assignedCount === allRows.length;
  const isFiltered = Boolean(classFilter || onlyUnassigned || search.trim());

  /* ───────── SAVE ───────── */
  const UNASSIGN = "__unassign__";

  const handleTeacherChange = async (value, record) => {
    const teacherId = value === UNASSIGN ? null : value;
    try {
      setSavingKey(record.key);

      await dispatch(
        assignClassTeacher({
          sectionId: record.sectionId,
          teacherId,
        })
      ).unwrap();

      message.success(
        teacherId
          ? `${record.className} - ${record.sectionName} updated`
          : `${record.className} - ${record.sectionName} teacher removed`
      );
    } catch (err) {
      const errorMessage =
        err?.message || err?.response?.data?.message || "Failed to assign teacher";
      message.error(errorMessage);
    } finally {
      setSavingKey(null);
    }
  };

  const SectionRow = ({ record }) => {
    return (
      <div className={record.teacherId ? "ct-row" : "ct-row is-empty"}>
        <div className="ct-sec" title={`Section ${record.sectionName}`}>
          {record.sectionName}
        </div>
        <div className="ct-pick">
          <Select
            placeholder="Select teacher…"
            value={record.teacherId || undefined}
            onChange={(val) => handleTeacherChange(val, record)}
            className="u-full"
            size="small"
            loading={savingKey === record.key}
            disabled={savingKey === record.key}
            showSearch
            // The dropdown shows "name + how many sections they already hold", but the closed
            // picker must stay just the name — optionLabelProp keeps the load out of the card.
            optionLabelProp="label"
            optionFilterProp="label"
          >
            <Option value={UNASSIGN} label="Not Selected">
              <span style={{ color: t.textSec }}>Not Selected</span>
            </Option>
            {users.map((u) => {
              const load = sectionsPerTeacher.get(u._id) || 0;
              return (
                <Option key={u._id} value={u._id} label={u.name}>
                  {u.name}
                  {load > 0 && (
                    <span className="ct-opt-load">
                      {load === 1 ? "1 section" : `${load} sections`}
                    </span>
                  )}
                </Option>
              );
            })}
          </Select>
        </div>
        {savingKey === record.key && <Spin size="small" />}
      </div>
    );
  };

  const handleFinish = () => {
    message.success("🎉 School setup completed successfully!");
    setTimeout(() => {
      next && next();
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Info bar — mirrors the "X of Y assigned" summary used in the Classes step */}
      <div
        style={{
          background: t.innerBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div className="u-row">
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: t.accentBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TeamOutlined style={{ fontSize: 13, color: t.accent }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri }}>
              Class Teacher Assignment
            </div>
            <div style={{ fontSize: 11.5, color: t.textSec }}>
              {assignedCount} of {allRows.length} sections assigned
            </div>
          </div>
        </div>

        <Space size={8} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: t.textSec }} />}
            placeholder="Search class, section or teacher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          {allRows.length > assignedCount && (
            <Button
              type={onlyUnassigned ? "primary" : "default"}
              onClick={() => setOnlyUnassigned((v) => !v)}
            >
              {onlyUnassigned ? "Showing unassigned" : `Without a teacher (${allRows.length - assignedCount})`}
            </Button>
          )}
          <Select
            allowClear
            placeholder="Filter by class"
            style={{ width: 180 }}
            value={classFilter}
            onChange={setClassFilter}
            options={classOptions}
          />
        </Space>
      </div>

      {loading && !allRows.length ? (
        <div className="ct-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ct-card" style={{ padding: 14 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : classCards.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            allRows.length === 0
              ? "No sections yet — add classes and sections in the previous step"
              : isFiltered
                ? "No sections match this filter"
                : "No sections found"
          }
          style={{ padding: "48px 0" }}
        >
          {allRows.length > 0 && isFiltered && (
            <Button
              onClick={() => { setClassFilter(null); setOnlyUnassigned(false); setSearch(""); }}
            >
              Clear filters
            </Button>
          )}
        </Empty>
      ) : (
        <div className="ct-grid">
          {classCards.map((card) => {
            const stat = perClass.get(card.classId) || { total: 0, assigned: 0 };
            const done = stat.total > 0 && stat.assigned === stat.total;
            return (
              <div key={card.classId} className={done ? "ct-card is-complete" : "ct-card"}>
                <div className="ct-card-head">
                  <span className="ct-card-name">{card.className}</span>
                  <span className={done ? "ct-card-count is-complete" : "ct-card-count"}>
                    {stat.assigned}/{stat.total}
                  </span>
                </div>
                {card.rows.map((row) => (
                  <SectionRow key={row.key} record={row} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={handleFinish}
          disabled={!isAllAssigned}
          style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
        >
          Finish Setup →
        </Button>
      </div>
    </div>
  );
};

export default SchoolClassSectionTeacher;
