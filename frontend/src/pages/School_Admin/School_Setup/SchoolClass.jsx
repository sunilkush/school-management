import React, { useEffect, useMemo, useState } from "react";
import { Select, Button, Input, message, Switch, Skeleton, Popconfirm, Typography } from "antd";
import {
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
// Title removed — no longer used after header removal
import { useDispatch, useSelector } from "react-redux";
import { getSchoolBoards } from "../../../features/boardSlice";
import { getBoardClass } from "../../../features/boardClassSlice";
import {
  createSchoolClass, fetchSchoolClasses,
} from "../../../features/schoolClassSlice";
import { createSection, deleteSection } from "../../../features/sectionSlice";

const { Text } = Typography;

const C = { primary: "#7c3aed", success: "#10b981", warning: "#f59e0b", danger: "#ef4444" };

/* ─── helpers ────────────────────────────────────────────────── */
const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.data?.boardClass)) return val.data.boardClass;
  if (Array.isArray(val?.data?.schoolBoards)) return val.data.schoolBoards;
  if (Array.isArray(val?.data?.schoolClasses)) return val.data.schoolClasses;
  return [];
};

const safeText = (val, fallback = "—") => {
  if (typeof val === "string" || typeof val === "number") return String(val);
  return fallback;
};

const safeMessage = (err, fallback = "Something went wrong") => {
  if (typeof err === "string") return err;
  if (typeof err?.message === "string") return err.message;
  if (typeof err?.payload?.message === "string") return err.payload.message;
  if (typeof err?.response?.data?.message === "string") return err.response.data.message;
  return fallback;
};

/* ════════════════════════════════════════════════════════════════
   SchoolClass
════════════════════════════════════════════════════════════════ */
const SchoolClass = ({ next }) => {
  const dispatch = useDispatch();

  const boardClassState    = useSelector((s) => s.boardClass || {});
  const boardState         = useSelector((s) => s.boards || {});
  const schoolClassState   = useSelector((s) => s.schoolClass || {});
  const academicYearState  = useSelector((s) => s.academicYear || {});
  const user               = useSelector((s) => s.auth?.user || {});

  const boardClass    = useMemo(() => safeArray(boardClassState.boardClass),     [boardClassState.boardClass]);
  const schoolBoards  = useMemo(() => safeArray(boardState.schoolBoards),        [boardState.schoolBoards]);
  const schoolClasses = useMemo(() => safeArray(schoolClassState.schoolClasses), [schoolClassState.schoolClasses]);

  const loading = Boolean(boardClassState.loading || boardState.loading || schoolClassState.loading);

  const activeYear     = academicYearState.activeYear;
  const schoolId       = user?.school?._id || user?.schoolId || null;
  const academicYearId = activeYear?._id || null;

  const [selectedBoard,  setSelectedBoard]  = useState(null);
  const [sectionInputs,  setSectionInputs]  = useState({});
  const [saving,         setSaving]         = useState({});
  const [deleting,       setDeleting]       = useState({});
  const [hovered,        setHovered]        = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    dispatch(getSchoolBoards(schoolId));
    if (academicYearId) dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!selectedBoard) return;
    dispatch(getBoardClass({ boardId: selectedBoard }));
  }, [selectedBoard, dispatch]);

  useEffect(() => {
    if (schoolBoards.length && !selectedBoard) {
      setSelectedBoard(schoolBoards[0]?.boardId?._id || null);
    }
  }, [schoolBoards, selectedBoard]);

  /* ── helpers ───────────────────────────────────────────────── */
  const isAssigned = (record) =>
    schoolClasses.some((c) => c?.name === record?.classId?.name);

  const getClass = (record) =>
    schoolClasses.find((c) => c?.name === record?.classId?.name);

  const getSections = (record) => {
    const cls = getClass(record);
    return Array.isArray(cls?.sections) ? cls.sections : [];
  };

  /* ── handlers ──────────────────────────────────────────────── */
  const handleToggle = async (record) => {
    if (isAssigned(record)) return message.warning("Already assigned");
    setSaving((p) => ({ ...p, [record._id]: true }));
    try {
      await dispatch(createSchoolClass({
        schoolId, academicYearId,
        classId: record?.classId?._id, name: record?.classId?.name, boardClassId: record?._id,
      })).unwrap();
      message.success("Class assigned");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to assign class"));
    } finally { setSaving((p) => ({ ...p, [record._id]: false })); }
  };

  const handleAddSection = async (record) => {
    const boardClassId = record?._id;
    const input = sectionInputs[boardClassId];
    if (!input?.trim()) return message.warning("Enter section name");
    const cls = getClass(record);
    if (!cls?._id) return message.warning("Assign class first");

    setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: true }));
    try {
      const sectionNames = input.split(",").map((s) => s.trim()).filter(Boolean);
      for (const name of sectionNames) {
        await dispatch(createSection({
          schoolId, schoolClassId: cls._id, name, capacity: 100, academicYearId,
        })).unwrap();
      }
      message.success("Sections created");
      setSectionInputs((p) => ({ ...p, [boardClassId]: "" }));
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to create sections"));
    } finally { setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: false })); }
  };

  const handleDeleteSection = async (sectionId) => {
    setDeleting((p) => ({ ...p, [sectionId]: true }));
    try {
      await dispatch(deleteSection(sectionId)).unwrap();
      message.success("Section deleted");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to delete section"));
    } finally { setDeleting((p) => ({ ...p, [sectionId]: false })); }
  };

  /* ── derived counts ────────────────────────────────────────── */
  const assignedCount  = boardClass.filter((bc) => isAssigned(bc)).length;
  const totalSections  = schoolClasses.reduce((sum, cls) =>
    sum + (Array.isArray(cls?.sections) ? cls.sections.length : 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block" }}>
            Class &amp; Section Setup
          </Text>
          <Text type="secondary" style={{ fontSize: 11.5 }}>
            {assignedCount} of {boardClass.length} classes assigned
          </Text>
        </div>

        <Select
          style={{ width: 220 }}
          value={selectedBoard}
          placeholder="Board"
        >
          {schoolBoards.length > 0 && schoolBoards.map((item) => (
            <Select.Option key={item?._id} value={item?.boardId?._id}>
              {safeText(item?.boardId?.name, "Unnamed Board")}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* ── Main table card ─────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {/* Desktop table */}
        <div className="class-dt">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--border)" }}>
                  {["Class", "Assign", "Sections"].map((h, i) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: i === 1 ? "center" : "left",
                      fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      width: i === 1 ? 90 : "auto",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && !boardClass.length ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={3} style={{ padding: 16 }}>
                        <Skeleton active paragraph={{ rows: 1 }} />
                      </td>
                    </tr>
                  ))
                ) : boardClass.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 48, textAlign: "center" }}>
                      <AppstoreOutlined style={{ fontSize: 28, color: "var(--text-muted)", display: "block", margin: "0 auto 10px" }} />
                      <Text type="secondary">No classes available for the selected board.</Text>
                    </td>
                  </tr>
                ) : (
                  boardClass.map((record, i) => {
                    const assigned = isAssigned(record);
                    const sections = getSections(record);

                    return (
                      <tr
                        key={record?._id || i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          background: hovered === i ? "rgba(124,58,237,0.03)" : "transparent",
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Class name */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {assigned && (
                              <CheckCircleFilled style={{ fontSize: 13, color: C.success, flexShrink: 0 }} />
                            )}
                            <Text style={{ fontWeight: 600, color: "var(--text)" }}>
                              {safeText(record?.classId?.name)}
                            </Text>
                          </div>
                        </td>

                        {/* Toggle */}
                        <td style={{ textAlign: "center", padding: "14px 16px" }}>
                          <Switch
                            checked={assigned}
                            loading={saving[record._id]}
                            onChange={() => handleToggle(record)}
                            size="small"
                          />
                        </td>

                        {/* Sections */}
                        <td style={{ padding: "14px 16px" }}>
                          {!assigned ? (
                            <span style={{
                              fontSize: 11, color: "var(--text-muted)",
                              background: "var(--surface-soft)",
                              padding: "3px 10px", borderRadius: 99,
                            }}>
                              Assign class first
                            </span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {/* Section chips */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {sections.length ? (
                                  sections.map((sec) => (
                                    <span
                                      key={sec?._id}
                                      style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        fontSize: 11, color: "#6d28d9",
                                        background: "rgba(124,58,237,0.08)",
                                        border: "1px solid rgba(124,58,237,0.18)",
                                        padding: "2px 6px 2px 9px", borderRadius: 99,
                                      }}
                                    >
                                      {safeText(sec?.name)}
                                      <Popconfirm
                                        title={`Delete section "${safeText(sec?.name)}"?`}
                                        onConfirm={() => handleDeleteSection(sec._id)}
                                        okText="Delete"
                                        okButtonProps={{ danger: true }}
                                        cancelText="Cancel"
                                      >
                                        <DeleteOutlined style={{
                                          fontSize: 10, marginLeft: 2, cursor: "pointer",
                                          color: deleting[sec._id] ? "var(--text-muted)" : C.danger,
                                        }} />
                                      </Popconfirm>
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No sections yet</span>
                                )}
                              </div>

                              {/* Add section input */}
                              <div style={{ display: "flex", gap: 6, maxWidth: 260 }}>
                                <Input
                                  size="small"
                                  placeholder="A, B, C"
                                  value={sectionInputs[record._id] || ""}
                                  onChange={(e) =>
                                    setSectionInputs((p) => ({ ...p, [record._id]: e.target.value }))
                                  }
                                  onPressEnter={() => handleAddSection(record)}
                                  style={{ borderRadius: 6 }}
                                />
                                <Button
                                  size="small" type="primary" icon={<PlusOutlined />}
                                  loading={saving[`sec_${record._id}`]}
                                  onClick={() => handleAddSection(record)}
                                  style={{ borderRadius: 6 }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="class-mb">
          {loading && !boardClass.length ? (
            [1, 2].map((i) => (
              <div key={i} style={{ padding: 14 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : boardClass.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center" }}>
              <Text type="secondary">No classes available.</Text>
            </div>
          ) : (
            boardClass.map((record) => {
              const assigned = isAssigned(record);
              const sections = getSections(record);

              return (
                <div key={record?._id} style={{
                  padding: 14, borderBottom: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {assigned && <CheckCircleFilled style={{ fontSize: 13, color: C.success }} />}
                      <Text style={{ fontWeight: 600, color: "var(--text)" }}>
                        {safeText(record?.classId?.name)}
                      </Text>
                    </div>
                    <Switch
                      checked={assigned}
                      loading={saving[record._id]}
                      size="small"
                      onChange={() => handleToggle(record)}
                    />
                  </div>

                  {!assigned ? (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Assign class first</span>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {sections.length ? (
                          sections.map((sec) => (
                            <span key={sec?._id} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 11, color: "#6d28d9",
                              background: "rgba(124,58,237,0.08)",
                              border: "1px solid rgba(124,58,237,0.18)",
                              padding: "2px 6px 2px 9px", borderRadius: 99,
                            }}>
                              {safeText(sec?.name)}
                              <Popconfirm
                                title={`Delete section "${safeText(sec?.name)}"?`}
                                onConfirm={() => handleDeleteSection(sec._id)}
                                okText="Delete" okButtonProps={{ danger: true }}
                                cancelText="Cancel"
                              >
                                <DeleteOutlined style={{
                                  fontSize: 10, marginLeft: 2, cursor: "pointer",
                                  color: deleting[sec._id] ? "var(--text-muted)" : C.danger,
                                }} />
                              </Popconfirm>
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No sections yet</span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <Input
                          size="small"
                          placeholder="Add section (A, B, C)"
                          value={sectionInputs[record._id] || ""}
                          onChange={(e) =>
                            setSectionInputs((p) => ({ ...p, [record._id]: e.target.value }))
                          }
                          onPressEnter={() => handleAddSection(record)}
                          style={{ borderRadius: 6 }}
                        />
                        <Button
                          size="small" type="primary" icon={<PlusOutlined />}
                          loading={saving[`sec_${record._id}`]}
                          onClick={() => handleAddSection(record)}
                          style={{ borderRadius: 6 }}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Next step button ────────────────────────────────────── */}
      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="class-gradient-btn"
            onClick={next}
            disabled={!schoolClasses.length}
            style={{ opacity: !schoolClasses.length ? 0.45 : 1 }}
          >
            Next: Subjects →
          </button>
        </div>
      )}

      <style>{`
        .class-mb { display: none; }
        .class-dt { display: block; }
        @media (max-width: 768px) {
          .class-dt { display: none; }
          .class-mb { display: block; }
        }
      `}</style>
    </div>
  );
};

export default SchoolClass;
