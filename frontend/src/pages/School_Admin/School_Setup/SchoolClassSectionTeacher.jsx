import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
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
  ApartmentOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../../features/authSlice";
import { assignClassTeacher, fetchSections } from "../../../features/sectionSlice.js";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice.js";

const { Title, Text } = Typography;

/* ─── semantic colours — match app theme ────────────────────── */
/* Ant Design ConfigProvider sets colorPrimary = #7c3aed         */
const C = {
  primary: "#7c3aed",
  success: "#10b981",
  warning: "#f59e0b",
  danger:  "#ef4444",
  info:    "#06b6d4",
};

/* ─── class colour palette (decorative, stays vivid) ────────── */
const CLASS_COLORS = [
  { bg: "rgba(124,58,237,0.08)",  text: "#6d28d9", border: "rgba(124,58,237,0.2)"  },
  { bg: "rgba(37,99,235,0.08)",   text: "#1d4ed8", border: "rgba(37,99,235,0.2)"   },
  { bg: "rgba(16,185,129,0.08)",  text: "#065f46", border: "rgba(16,185,129,0.2)"  },
  { bg: "rgba(245,158,11,0.08)",  text: "#92400e", border: "rgba(245,158,11,0.2)"  },
  { bg: "rgba(239,68,68,0.08)",   text: "#991b1b", border: "rgba(239,68,68,0.2)"   },
  { bg: "rgba(6,182,212,0.08)",   text: "#0e7490", border: "rgba(6,182,212,0.2)"   },
  { bg: "rgba(236,72,153,0.08)",  text: "#9d174d", border: "rgba(236,72,153,0.2)"  },
  { bg: "rgba(34,197,94,0.08)",   text: "#14532d", border: "rgba(34,197,94,0.2)"   },
];
const classColor = (idx) => CLASS_COLORS[idx % CLASS_COLORS.length];

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const SchoolClassSectionTeacher = ({ next }) => {
  const dispatch = useDispatch();
  const { sections = [], loading } = useSelector((s) => s.section || {});
  const { users = [], user }       = useSelector((s) => s.auth);
  /* ✅ activeYear — only classes of the ACTIVE academic year are shown */
  const { activeYear }             = useSelector((s) => s.academicYear);
  const { schoolClasses = [] }     = useSelector((s) => s.schoolClass || {});

  const schoolId       = user?.school?._id;
  const academicYearId = activeYear?._id;

  const [savingKey, setSavingKey] = useState(null);
  const [finishing, setFinishing] = useState(false);

  /* ─── fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSections({ schoolId, academicYearId }));
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    }
    dispatch(fetchAllUser({ roleName: ["Teacher"], isActive: true }));
  }, [dispatch, schoolId, academicYearId]);

  /* class id → name lookup */
  const classMap = useMemo(() => {
    const map = {};
    schoolClasses.forEach((c) => { map[c._id] = c.name; });
    return map;
  }, [schoolClasses]);

  /* ─── derived data ───────────────────────────────────────── */
  const tableData = useMemo(
    () =>
      sections.map((sec) => {
        const rawClassId =
          typeof sec.schoolClassId === "string"
            ? sec.schoolClassId
            : sec.schoolClassId?._id;
        const className =
          (typeof sec.schoolClassId === "object" && sec.schoolClassId?.name) ||
          classMap[rawClassId] ||
          "N/A";
        const teacherId =
          typeof sec.classTeacherId === "string"
            ? sec.classTeacherId || null
            : sec.classTeacherId?._id || null;

        return { key: sec._id, classId: rawClassId, className, sectionId: sec._id, sectionName: sec.name, teacherId };
      }).filter((row) => row.className !== "N/A" && row.classId),
    [sections, classMap]
  );

  const assigned    = tableData.filter((r) => r.teacherId).length;
  const total       = tableData.length;
  const allAssigned = total > 0 && assigned === total;

  const classGroups = useMemo(() => {
    const map = new Map();
    tableData.forEach((row) => {
      if (!map.has(row.classId)) map.set(row.classId, { className: row.className, sections: [] });
      map.get(row.classId).sections.push(row);
    });
    return Array.from(map.values());
  }, [tableData]);

  /* ─── save ───────────────────────────────────────────────── */
  const handleTeacherChange = async (value, record) => {
    setSavingKey(record.key);
    try {
      await dispatch(assignClassTeacher({ sectionId: record.sectionId, teacherId: value })).unwrap();
      message.success({ content: `✅ ${record.className} – ${record.sectionName} updated`, duration: 2 });
    } catch (err) {
      message.error(err?.message || err?.response?.data?.message || "Failed to assign teacher");
    } finally {
      setSavingKey(null);
    }
  };

  const handleFinish = () => {
    setFinishing(true);
    message.success({ content: "🎉 School setup completed successfully!", duration: 2 });
    setTimeout(() => { setFinishing(false); next?.(); }, 800);
  };

  /* ─── no active year guard ───────────────────────────────── */
  if (!academicYearId && !loading) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: "center", padding: "48px 24px" }}>
          <WarningOutlined style={{ fontSize: 52, color: C.warning, marginBottom: 16, display: "block" }} />
          <Title level={4} style={{ marginBottom: 8, color: "var(--text)" }}>No Active Academic Year</Title>
          <Text type="secondary">Please set an active academic year before assigning class teachers.</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ══════ CONTENT ══════ */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={S.card}>
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : tableData.length === 0 ? (
        <div style={S.card}>
          <Empty
            image={<TeamOutlined style={{ fontSize: 64, color: "var(--text-muted)" }} />}
            description={
              <Space direction="vertical" size={4} style={{ textAlign: "center" }}>
                <Text strong style={{ fontSize: 15 }}>No Sections Found</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  No sections exist for the active academic year. Add classes &amp; sections first.
                </Text>
              </Space>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {classGroups.map((group, gIdx) => {
            const cc        = classColor(gIdx);
            const groupDone = group.sections.every((s) => s.teacherId);
            const groupCount = `${group.sections.filter((s) => s.teacherId).length}/${group.sections.length}`;

            return (
              <div key={group.classId || group.className} style={S.card}>
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
                    const teacher  = users.find((u) => u._id === row.teacherId);
                    const isSaving = savingKey === row.key;

                    return (
                      <div
                        key={row.key}
                        style={{
                          ...S.sectionRow,
                          borderTop: sIdx > 0 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div style={S.sectionLeft}>
                          <div style={{ ...S.sectionDot, background: cc.text }} />
                          <div>
                            <Text strong style={{ fontSize: 13, color: "var(--text)" }}>
                              Section {row.sectionName}
                            </Text>
                            <div style={{ marginTop: 2 }}>
                              {row.teacherId && !isSaving ? (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  <CheckOutlined style={{ color: C.success, marginRight: 3 }} />
                                  {teacher?.name || "Assigned"}
                                </Text>
                              ) : !isSaving ? (
                                <Text style={{ fontSize: 11, color: C.warning }}>⚠ Not assigned</Text>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div style={S.sectionRight}>
                          {teacher && !isSaving && (
                            <Tooltip title={teacher.name}>
                              <Avatar size={28} style={{ background: cc.text, fontSize: 11, cursor: "default", marginRight: 6 }}>
                                {initials(teacher.name)}
                              </Avatar>
                            </Tooltip>
                          )}
                          <Select
                            placeholder="Select teacher"
                            value={row.teacherId || undefined}
                            onChange={(val) => handleTeacherChange(val, row)}
                            style={{ width: 200 }}
                            size="middle"
                            loading={isSaving}
                            disabled={isSaving}
                            showSearch
                            optionFilterProp="label"
                            status={!row.teacherId ? "warning" : ""}
                            options={users.map((u) => ({ value: u._id, label: u.name }))}
                            suffixIcon={row.teacherId ? <CheckCircleFilled style={{ color: C.success }} /> : undefined}
                          />
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
      <div style={S.footer}>
        {total > 0 && !allAssigned && (
          <Text type="secondary" style={{ fontSize: 12, marginRight: "auto" }}>
            <WarningOutlined style={{ color: C.warning, marginRight: 4 }} />
            {total - assigned} section{total - assigned !== 1 ? "s" : ""} still need a teacher
          </Text>
        )}
        {allAssigned && (
          <Text style={{ fontSize: 12, color: C.success, marginRight: "auto" }}>
            <CheckCircleFilled style={{ marginRight: 4 }} />
            All sections assigned — ready to finish!
          </Text>
        )}
        <Tooltip title={!allAssigned ? "Assign a teacher to every section first" : ""}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={handleFinish}
            loading={finishing}
            disabled={!allAssigned}
            className={allAssigned ? "class-gradient-btn" : ""}
            style={{ fontWeight: 600, paddingInline: 28 }}
          >
            Finish Setup
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

/* ─── Styles using CSS variables for dark-mode awareness ──────── */
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
    padding: "12px 4px",
  },
  sectionLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 140,
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
    gap: 6,
    flexShrink: 0,
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

export default SchoolClassSectionTeacher;
