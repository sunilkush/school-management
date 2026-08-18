import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Button,
  Empty,
  message,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { getAllSubjects } from "../../../features/subjectSlice";
import { addSubjectToSection } from "../../../features/sectionSlice";

const { Title, Text } = Typography;

/* ─── app theme colours ──────────────────────────────────────── */
const C = {
  primary: "var(--purple)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger:  "var(--danger)",
  info:    "var(--cyan)",
};

/* ─── class colour palette ───────────────────────────────────── */
const CLASS_COLORS = [
  { bg: "rgba(var(--purple-rgb),0.08)",  text: "var(--purple-hover)", border: "rgba(var(--purple-rgb),0.2)"  },
  { bg: "rgba(var(--primary-rgb),0.08)",   text: "var(--primary-hover)", border: "rgba(var(--primary-rgb),0.2)"   },
  { bg: "rgba(var(--success-rgb),0.08)",  text: "#065f46", border: "rgba(var(--success-rgb),0.2)"  },
  { bg: "rgba(var(--warning-rgb),0.08)",  text: "var(--warning-hover)", border: "rgba(var(--warning-rgb),0.2)"  },
  { bg: "rgba(var(--danger-rgb),0.08)",   text: "#991b1b", border: "rgba(var(--danger-rgb),0.2)"   },
  { bg: "rgba(6,182,212,0.08)",   text: "#0e7490", border: "rgba(6,182,212,0.2)"   },
  { bg: "rgba(236,72,153,0.08)",  text: "#9d174d", border: "rgba(236,72,153,0.2)"  },
  { bg: "rgba(var(--success-rgb),0.08)",   text: "#14532d", border: "rgba(var(--success-rgb),0.2)"   },
];
const classColor = (idx) => CLASS_COLORS[idx % CLASS_COLORS.length];

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const SchoolClassSubject = ({ next }) => {
  const dispatch = useDispatch();

  const { schoolClasses = [], loading } = useSelector((s) => s.schoolClass || {});
  const { subjects = [] }               = useSelector((s) => s.subject || {});
  const user                            = useSelector((s) => s.auth.user);
  /* ✅ activeYear — only active academic year's data */
  const { activeYear }                  = useSelector((s) => s.academicYear);

  const schoolId       = user?.school?._id;
  const academicYearId = activeYear?._id;

  const [mapping,       setMapping]       = useState({});
  const [saving,        setSaving]        = useState({});
  const [saved,         setSaved]         = useState({});
  const [selectedClass, setSelectedClass] = useState(null);

  /* ─── fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(getAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId, academicYearId]);

  /* initialise mapping from existing section.subjects */
  useEffect(() => {
    if (!schoolClasses.length) return;
    const init = {}, initSaved = {};
    schoolClasses.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        init[sec._id]      = sec.subjects?.map((s) => s._id || s) || [];
        if (sec.subjects?.length) initSaved[sec._id] = true;
      });
    });
    setMapping(init);
    setSaved(initSaved);
  }, [schoolClasses]);

  /* ─── derived ────────────────────────────────────────────── */
  const allSections = useMemo(
    () =>
      schoolClasses.flatMap((cls) =>
        (cls.sections || []).map((sec) => ({
          _id:           sec._id,
          schoolClassId: cls._id,
          className:     cls.name,
          sectionId:     sec._id,
          sectionName:   sec.name,
        }))
      ),
    [schoolClasses]
  );

  const configured  = allSections.filter((r) => (mapping[r._id]?.length || 0) > 0).length;
  const total       = allSections.length;
  const allDone     = total > 0 && configured === total;

  /* groups for card layout */
  const classGroups = useMemo(() => {
    const map = new Map();
    allSections.forEach((row) => {
      if (!map.has(row.schoolClassId))
        map.set(row.schoolClassId, { className: row.className, colorIdx: map.size, sections: [] });
      map.get(row.schoolClassId).sections.push(row);
    });
    /* apply filter */
    return Array.from(map.values()).filter(
      (g) => !selectedClass || allSections.find((r) => r.schoolClassId === selectedClass && r.className === g.className)
    );
  }, [allSections, selectedClass]);

  /* ─── handlers ───────────────────────────────────────────── */
  const handleChange = useCallback((rowId, values) => {
    setMapping((p) => ({ ...p, [rowId]: values }));
    setSaved((p)   => ({ ...p, [rowId]: false }));
  }, []);

  const handleSave = useCallback(
    async (record) => {
      setSaving((p) => ({ ...p, [record._id]: true }));
      try {
        await dispatch(
          addSubjectToSection({
            schoolClassId: record.schoolClassId,
            sectionId:     record.sectionId,
            subjectIds:    mapping[record._id] || [],
          })
        ).unwrap();
        message.success({ content: `✅ ${record.className} – ${record.sectionName} saved`, duration: 2 });
        setSaved((p) => ({ ...p, [record._id]: true }));
      } catch (err) {
        message.error(err?.message || err || "Failed to save");
      } finally {
        setSaving((p) => ({ ...p, [record._id]: false }));
      }
    },
    [dispatch, mapping]
  );

  /* ─── no active year guard ───────────────────────────────── */
  if (!academicYearId && !loading) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: "center", padding: "48px 24px" }}>
          <BookOutlined style={{ fontSize: 52, color: C.warning, marginBottom: 16, display: "block" }} />
          <Title level={4} style={{ marginBottom: 8, color: "var(--text)" }}>No Active Academic Year</Title>
          <Text type="secondary">Please set an active academic year first.</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ══════ TOOLBAR ══════ */}
      <div style={S.toolbar}>
        <Space>
          <FilterOutlined style={{ color: "var(--text-muted)" }} />
          <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>Filter by class:</Text>
        </Space>
        <Select
          placeholder="All classes"
          allowClear
          value={selectedClass}
          onChange={setSelectedClass}
          style={{ width: 200 }}
          options={schoolClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
        />
      </div>

      {/* ══════ CONTENT ══════ */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={S.card}>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : classGroups.length === 0 ? (
        <div style={{ ...S.card, padding: 40 }}>
          <Empty
            image={<BookOutlined style={{ fontSize: 64, color: "var(--text-muted)" }} />}
            description={
              <Space direction="vertical" size={4} style={{ textAlign: "center" }}>
                <Text strong style={{ fontSize: 15 }}>No Sections Found</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  No sections exist for the active academic year.
                </Text>
              </Space>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {classGroups.map((group) => {
            const cc         = classColor(group.colorIdx);
            const groupDone  = group.sections.every((s) => (mapping[s._id]?.length || 0) > 0);
            const groupCount = `${group.sections.filter((s) => (mapping[s._id]?.length || 0) > 0).length}/${group.sections.length}`;

            return (
              <div key={group.className} style={S.card}>
                {/* class header */}
                <div style={{ ...S.classHeader, background: cc.bg, borderBottom: `1px solid ${cc.border}` }}>
                  <Space>
                    <div style={{ ...S.classBadge, background: cc.text }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{group.className}</span>
                    </div>
                    <span style={{ color: cc.text, fontWeight: 600, fontSize: 13 }}>
                      {group.sections.length} Section{group.sections.length !== 1 ? "s" : ""}
                    </span>
                  </Space>
                  {groupDone
                    ? <CheckCircleFilled style={{ color: C.success, fontSize: 18 }} />
                    : <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>{groupCount}</Tag>
                  }
                </div>

                {/* section rows */}
                <div style={{ padding: "6px 16px 14px" }}>
                  {group.sections.map((row, sIdx) => {
                    const hasSubjects = (mapping[row._id]?.length || 0) > 0;
                    const isSaving    = saving[row._id];
                    const isSaved     = saved[row._id];

                    return (
                      <div
                        key={row._id}
                        style={{
                          ...S.sectionRow,
                          borderTop: sIdx > 0 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        {/* left — label */}
                        <div style={S.sectionLeft}>
                          <div style={{ ...S.sectionDot, background: cc.text }} />
                          <div style={{ minWidth: 0 }}>
                            <Text strong style={{ fontSize: 13, color: "var(--text)", display: "block" }}>
                              Section {row.sectionName}
                            </Text>
                            <Text style={{ fontSize: 11, color: hasSubjects ? C.success : C.warning }}>
                              {hasSubjects
                                ? <><CheckOutlined style={{ marginRight: 3 }} />{mapping[row._id].length} subject{mapping[row._id].length !== 1 ? "s" : ""} assigned</>
                                : "⚠ No subjects assigned"
                              }
                            </Text>
                          </div>
                        </div>

                        {/* right — select + save */}
                        <div style={S.sectionRight}>
                          <Select
                            mode="multiple"
                            placeholder="Select subjects"
                            value={mapping[row._id] || []}
                            onChange={(val) => handleChange(row._id, val)}
                            style={{ width: 260, maxWidth: "min(260px, calc(100vw - 220px))" }}
                            maxTagCount="responsive"
                            options={subjects.map((s) => ({ label: s.name, value: s._id }))}
                            status={!hasSubjects ? "warning" : ""}
                          />
                          <Tooltip title={isSaved && !saving[row._id] ? "Saved" : "Save subjects"}>
                            <Button
                              type={isSaved ? "default" : "primary"}
                              icon={isSaved ? <CheckOutlined /> : <SaveOutlined />}
                              loading={isSaving}
                              onClick={() => handleSave(row)}
                              style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                ...(isSaved ? { borderColor: C.success, color: C.success } : {}),
                              }}
                            >
                              {isSaved ? "Saved" : "Save"}
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ FOOTER ══════ */}
      {next && (
        <div style={S.footer}>
          {total > 0 && !allDone && (
            <Text type="secondary" style={{ fontSize: 12, marginRight: "auto" }}>
              <ClockCircleOutlined style={{ color: C.warning, marginRight: 4 }} />
              {total - configured} section{total - configured !== 1 ? "s" : ""} still need subjects
            </Text>
          )}
          {allDone && (
            <Text style={{ fontSize: 12, color: C.success, marginRight: "auto" }}>
              <CheckCircleFilled style={{ marginRight: 4 }} />
              All sections configured — ready to proceed!
            </Text>
          )}
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={next}
            disabled={!schoolClasses.length}
            className="class-gradient-btn"
            style={{ fontWeight: 600, paddingInline: 28 }}
          >
            Next Step
          </Button>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxWidth: "100%",
    margin: "0 auto",
    padding: "4px 0 40px",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
    overflow: "hidden",
    padding: 20,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "var(--shadow-soft)",
    flexWrap: "wrap",
  },
  classHeader: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "-20px -20px 0",
  },
  classBadge: {
    padding: "3px 10px",
    borderRadius: 6,
    lineHeight: 1.5,
  },
  sectionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    padding: "14px 4px",
  },
  sectionLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    flex: "1 1 160px",
    minWidth: 0,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  sectionRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    flexWrap: "wrap",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
    padding: "16px 20px",
    background: "var(--surface)",
    borderRadius: 16,
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-soft)",
    flexWrap: "wrap",
  },
};

export default SchoolClassSubject;
