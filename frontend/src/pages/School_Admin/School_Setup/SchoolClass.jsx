import React, { useEffect, useMemo, useState } from "react";
import { Select, Button, Input, message, Switch, Skeleton, Popconfirm, Tooltip } from "antd";
import {
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getSchoolBoards } from "../../../features/boardSlice";
import { getBoardClass } from "../../../features/boardClassSlice";
import {
  createSchoolClass,
  deleteSchoolClass,
  fetchSchoolClasses,
} from "../../../features/schoolClassSlice";
import { createSection, deleteSection, fetchSections } from "../../../features/sectionSlice";
import { useTheme } from "../../../context/ThemeContext";

const tokens = (isDark) => ({
  cardBg: isDark ? "#141414" : "#ffffff",
  innerBg: isDark ? "#0f0f0f" : "#f8faff",
  rowBg: isDark ? "#141414" : "#ffffff",
  rowAlt: isDark ? "#111111" : "#fafafa",
  rowHover: isDark ? "#1a1a1a" : "#f0f7ff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  textPri: isDark ? "#e8e8e8" : "#111827",
  textSec: isDark ? "#6b7280" : "#9ca3af",
  accent: "#1677ff",
  accentBg: isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success: "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  thBg: isDark ? "#0f0f0f" : "#f9fafb",
  thBorder: isDark ? "#1f1f1f" : "#f0f0f0",
});

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
  if (typeof err?.response?.data?.message === "string") {
    return err.response.data.message;
  }
  return fallback;
};

const SchoolClass = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const boardClassState = useSelector((s) => s.boardClass || {});
  const boardState = useSelector((s) => s.boards || {});
  const schoolClassState = useSelector((s) => s.schoolClass || {});
  const academicYearState = useSelector((s) => s.academicYear || {});
  const sectionState = useSelector((s) => s.sections || {});
  const user = useSelector((s) => s.auth?.user || {});

  const boardClass = useMemo(
    () => safeArray(boardClassState.boardClass),
    [boardClassState.boardClass]
  );
  const schoolBoards = useMemo(
    () => safeArray(boardState.schoolBoards),
    [boardState.schoolBoards]
  );
  const schoolClasses = useMemo(
    () => safeArray(schoolClassState.schoolClasses),
    [schoolClassState.schoolClasses]
  );
  // Full section docs (student enrollments included) — the class list response only carries a
  // trimmed { _id, name, teacher, subjects } shape per section, not enough to know if it's safe
  // to delete, so this is fetched separately just for that check.
  const fullSections = useMemo(
    () => safeArray(sectionState.sections),
    [sectionState.sections]
  );
  const sectionStudentCount = (sectionId) => {
    const full = fullSections.find((s) => s?._id === sectionId);
    return full?.studentEnrollmentIds?.length || full?.StudentEnrollmentId?.length || 0;
  };

  const loading = Boolean(
    boardClassState.loading ||
      boardState.loading ||
      schoolClassState.loading
  );

  const selectedAcademicYear = academicYearState.selectedAcademicYear;
  const schoolId = user?.school?._id || user?.schoolId || null;
  const academicYearId = selectedAcademicYear?._id || null;

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [sectionInputs, setSectionInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!schoolId) return;

    dispatch(getSchoolBoards(schoolId));

    if (academicYearId) {
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
      dispatch(fetchSections({ schoolId, academicYearId }));
    }
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

  const isAssigned = (record) =>
    schoolClasses.some((c) => c?.name === record?.classId?.name);

  const getClass = (record) =>
    schoolClasses.find((c) => c?.name === record?.classId?.name);

  const getSections = (record) => {
    const cls = getClass(record);
    return Array.isArray(cls?.sections) ? cls.sections : [];
  };

  const handleToggle = async (record) => {
    if (isAssigned(record)) {
      return message.warning("Already assigned");
    }

    setSaving((p) => ({ ...p, [record._id]: true }));

    try {
      await dispatch(
        createSchoolClass({
          schoolId,
          academicYearId,
          classId: record?.classId?._id,
          name: record?.classId?.name,
          boardClassId: record?._id,
        })
      ).unwrap();

      message.success("Class assigned");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to assign class"));
    } finally {
      setSaving((p) => ({ ...p, [record._id]: false }));
    }
  };

  const handleAddSection = async (record) => {
    const boardClassId = record?._id;
    const input = sectionInputs[boardClassId];

    if (!input?.trim()) {
      return message.warning("Enter section name");
    }

    const cls = getClass(record);

    if (!cls?._id) {
      return message.warning("Assign class first");
    }

    setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: true }));

    try {
      const sectionNames = input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const name of sectionNames) {
        await dispatch(
          createSection({
            schoolId,
            schoolClassId: cls._id,
            name,
            capacity: 100,
            academicYearId,
          })
        ).unwrap();
      }

      message.success("Sections created");
      setSectionInputs((p) => ({ ...p, [boardClassId]: "" }));
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to create sections"));
    } finally {
      setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: false }));
    }
  };

  // The backend hard-deletes with no guard of its own: deleting a class that still has sections
  // would orphan those Section docs (nothing left cleans up their schoolClassId reference), and
  // deleting a section that still has enrolled students would orphan those enrollments. Both are
  // blocked here since nothing downstream checks for either case.
  const handleDeleteClass = async (record) => {
    const cls = getClass(record);
    if (!cls?._id) return;

    const sections = getSections(record);
    if (sections.length > 0) {
      return message.warning("Remove all sections from this class first");
    }

    setSaving((p) => ({ ...p, [record._id]: true }));
    try {
      await dispatch(deleteSchoolClass(cls._id)).unwrap();
      message.success("Class removed");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to remove class"));
    } finally {
      setSaving((p) => ({ ...p, [record._id]: false }));
    }
  };

  const handleDeleteSection = async (section) => {
    const studentCount = sectionStudentCount(section._id);
    if (studentCount > 0) {
      return message.warning(
        `This section has ${studentCount} student${studentCount > 1 ? "s" : ""} enrolled — move or remove them first`
      );
    }

    setSaving((p) => ({ ...p, [`del_sec_${section._id}`]: true }));
    try {
      await dispatch(deleteSection(section._id)).unwrap();
      message.success("Section removed");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
      dispatch(fetchSections({ schoolId, academicYearId }));
    } catch (err) {
      message.error(safeMessage(err, "Failed to remove section"));
    } finally {
      setSaving((p) => ({ ...p, [`del_sec_${section._id}`]: false }));
    }
  };

  const assignedCount = boardClass.filter((bc) => isAssigned(bc)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <AppstoreOutlined style={{ fontSize: 13, color: t.accent }} />
          </div>

          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: t.textPri,
                display: "block",
              }}
            >
              Class & Section Setup
            </div>
            <div style={{ fontSize: 11.5, color: t.textSec }}>
              {assignedCount} of {boardClass.length} classes assigned
            </div>
          </div>
        </div>

        <Select
          style={{ width: 220 }}
          value={selectedBoard}
          placeholder="Board"
        >
          {schoolBoards.length > 0 &&
            schoolBoards.map((item) => (
              <Select.Option key={item?._id} value={item?.boardId?._id}>
                {safeText(item?.boardId?.name, "Unnamed Board")}
              </Select.Option>
            ))}
        </Select>
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div className="class-table-desktop">
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
            >
              <thead>
                <tr
                  style={{
                    background: t.thBg,
                    borderBottom: `1px solid ${t.thBorder}`,
                  }}
                >
                  {["Class", "Assign", "Sections"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: i === 1 ? "center" : "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textSec,
                        textTransform: "uppercase",
                        width: i === 1 ? 90 : "auto",
                      }}
                    >
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
                    <td colSpan={3} style={{ padding: 40, textAlign: "center" }}>
                      <span>No classes available</span>
                    </td>
                  </tr>
                ) : (
                  boardClass.map((record, i) => {
                    const assigned = isAssigned(record);
                    const sections = getSections(record);
                    const isHov = hovered === i;

                    return (
                      <tr
                        key={record?._id || i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          background: isHov ? t.rowHover : "transparent",
                          borderBottom: `1px solid ${t.thBorder}`,
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 600 }}>
                            {safeText(record?.classId?.name)}
                          </span>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <Switch
                              checked={assigned}
                              loading={saving[record._id]}
                              onChange={() => handleToggle(record)}
                              size="small"
                            />
                            {assigned && (
                              <Tooltip title={sections.length ? "Remove all sections first" : "Remove this class"}>
                                <Popconfirm
                                  title="Remove this class?"
                                  disabled={sections.length > 0}
                                  okText="Yes, Remove"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleDeleteClass(record)}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    disabled={sections.length > 0}
                                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                    style={{ height: 20, padding: "0 4px" }}
                                  />
                                </Popconfirm>
                              </Tooltip>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          {!assigned ? (
                            <span
                              style={{
                                fontSize: 11,
                                color: t.textSec,
                                background: "#f3f4f6",
                                padding: "3px 8px",
                                borderRadius: 99,
                              }}
                            >
                              Assign class first
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 5,
                                }}
                              >
                                {sections.length ? (
                                  sections.map((sec) => {
                                    const studentCount = sectionStudentCount(sec._id);
                                    return (
                                      <span
                                        key={sec?._id}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          fontSize: 11,
                                          color: t.accent,
                                          background: t.accentBg,
                                          padding: "2px 4px 2px 8px",
                                          borderRadius: 99,
                                        }}
                                      >
                                        {safeText(sec?.name)}
                                        <Tooltip title={studentCount ? `${studentCount} student(s) enrolled — move them first` : "Remove section"}>
                                          <Popconfirm
                                            title="Remove this section?"
                                            disabled={studentCount > 0}
                                            okText="Yes, Remove"
                                            cancelText="Cancel"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => handleDeleteSection(sec)}
                                          >
                                            <CloseOutlined
                                              style={{
                                                fontSize: 9,
                                                cursor: studentCount ? "not-allowed" : "pointer",
                                                opacity: studentCount ? 0.4 : 0.75,
                                              }}
                                            />
                                          </Popconfirm>
                                        </Tooltip>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span
                                    style={{ fontSize: 11, color: t.textSec }}
                                  >
                                    No sections
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  maxWidth: 260,
                                }}
                              >
                                <Input
                                  size="small"
                                  placeholder="A, B, C"
                                  value={sectionInputs[record._id] || ""}
                                  onChange={(e) =>
                                    setSectionInputs((p) => ({
                                      ...p,
                                      [record._id]: e.target.value,
                                    }))
                                  }
                                  onPressEnter={() => handleAddSection(record)}
                                />
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  loading={saving[`sec_${record._id}`]}
                                  onClick={() => handleAddSection(record)}
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

        <div className="class-table-mobile">
          {loading && !boardClass.length ? (
            [1, 2].map((i) => (
              <div key={i} style={{ padding: 14 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : boardClass.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center" }}>
              <span>No classes available</span>
            </div>
          ) : (
            boardClass.map((record) => {
              const assigned = isAssigned(record);
              const sections = getSections(record);

              return (
                <div
                  key={record?._id}
                  style={{
                    padding: 14,
                    borderBottom: `1px solid ${t.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {safeText(record?.classId?.name)}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {assigned && (
                        <Popconfirm
                          title="Remove this class?"
                          disabled={sections.length > 0}
                          okText="Yes, Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => handleDeleteClass(record)}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            disabled={sections.length > 0}
                            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                          />
                        </Popconfirm>
                      )}
                      <Switch
                        checked={assigned}
                        loading={saving[record._id]}
                        size="small"
                        onChange={() => handleToggle(record)}
                      />
                    </div>
                  </div>

                  {!assigned ? (
                    <span style={{ fontSize: 11, color: t.textSec }}>
                      Assign class first
                    </span>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {sections.length ? (
                          sections.map((sec) => {
                            const studentCount = sectionStudentCount(sec._id);
                            return (
                              <span
                                key={sec?._id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  background: t.accentBg,
                                  color: t.accent,
                                  padding: "2px 4px 2px 8px",
                                  borderRadius: 99,
                                }}
                              >
                                {safeText(sec?.name)}
                                <Popconfirm
                                  title="Remove this section?"
                                  disabled={studentCount > 0}
                                  okText="Yes, Remove"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleDeleteSection(sec)}
                                >
                                  <CloseOutlined
                                    style={{
                                      fontSize: 9,
                                      cursor: studentCount ? "not-allowed" : "pointer",
                                      opacity: studentCount ? 0.4 : 0.75,
                                    }}
                                  />
                                </Popconfirm>
                              </span>
                            );
                          })
                        ) : (
                          <span style={{ fontSize: 11 }}>No sections</span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <Input
                          size="small"
                          placeholder="Add section"
                          value={sectionInputs[record._id] || ""}
                          onChange={(e) =>
                            setSectionInputs((p) => ({
                              ...p,
                              [record._id]: e.target.value,
                            }))
                          }
                          onPressEnter={() => handleAddSection(record)}
                        />
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          loading={saving[`sec_${record._id}`]}
                          onClick={() => handleAddSection(record)}
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

      <style>{`
        .class-table-mobile { display: none; }

        @media (max-width: 768px) {
          .class-table-desktop { display: none; }
          .class-table-mobile { display: block; }
        }

        @media (min-width: 769px) {
          .class-table-desktop { display: block; }
          .class-table-mobile { display: none; }
        }
      `}</style>

      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            onClick={next}
            disabled={!schoolClasses.length}
            style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
          >
            Next: Subjects →
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchoolClass;