import React, { useEffect, useState } from "react";
import { Select, Button, Input, message, Typography, Tag, Switch, Skeleton } from "antd";
import {
  AppstoreOutlined,
  PlusOutlined,
  CheckCircleFilled,
  LockOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getSchoolBoards } from "../../../features/boardSlice";
import { getBoardClass } from "../../../features/boardClassSlice";
import { createSchoolClass, fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { createSection } from "../../../features/sectionSlice";
import { useTheme } from "../../../context/ThemeContext";

const { Text } = Typography;

const tokens = (isDark) => ({
  cardBg:    isDark ? "#141414" : "#ffffff",
  innerBg:   isDark ? "#0f0f0f" : "#f8faff",
  rowBg:     isDark ? "#141414" : "#ffffff",
  rowAlt:    isDark ? "#111111" : "#fafafa",
  rowHover:  isDark ? "#1a1a1a" : "#f0f7ff",
  border:    isDark ? "#1f1f1f" : "#f0f0f0",
  textPri:   isDark ? "#e8e8e8" : "#111827",
  textSec:   isDark ? "#6b7280" : "#9ca3af",
  accent:    "#1677ff",
  accentBg:  isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success:   "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  thBg:      isDark ? "#0f0f0f" : "#f9fafb",
  thBorder:  isDark ? "#1f1f1f" : "#f0f0f0",
});

const SchoolClass = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { boardClass = [], loading } = useSelector((s) => s.boardClass);
  const { schoolBoards = [] }        = useSelector((s) => s.boards);
  const { schoolClasses = [] }       = useSelector((s) => s.schoolClass || {});
  const { selectedAcademicYear }     = useSelector((s) => s.academicYear);
  const user     = useSelector((s) => s.auth.user);
  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [sectionInputs, setSectionInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (schoolId) {
      dispatch(getSchoolBoards(schoolId));
      dispatch(fetchSchoolClasses({ schoolId }));
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (selectedBoard) dispatch(getBoardClass({ boardId: selectedBoard }));
  }, [selectedBoard, dispatch]);

  useEffect(() => {
    if (schoolBoards.length && !selectedBoard) {
      setSelectedBoard(schoolBoards[0]?.boardId?._id);
    }
  }, [schoolBoards, selectedBoard]);

  const isAssigned  = (id) => schoolClasses.some((c) => c.boardClassId?._id === id);
  const getClass    = (id) => schoolClasses.find((c) => c.boardClassId?._id === id);
  const getSections = (id) => getClass(id)?.sections || [];

  const handleToggle = async (record) => {
    if (isAssigned(record._id)) return message.warning("Already assigned");
    setSaving((p) => ({ ...p, [record._id]: true }));
    try {
      await dispatch(createSchoolClass({
        schoolId, academicYearId,
        classId: record.classId?._id,
        name: record.classId?.name,
        boardClassId: record._id,
      })).unwrap();
      message.success("Class assigned");
      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error("Failed to assign class",err.message || "");
    } finally {
      setSaving((p) => ({ ...p, [record._id]: false }));
    }
  };

  const handleAddSection = async (boardClassId) => {
    const input = sectionInputs[boardClassId];
    if (!input?.trim()) return message.warning("Enter section name");
    const cls = getClass(boardClassId);
    if (!cls) return message.warning("Assign class first");

    setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: true }));
    try {
      for (const name of input.split(",").map((s) => s.trim()).filter(Boolean)) {
        await dispatch(createSection({
          schoolId, schoolClassId: cls._id,
          name, capacity: 100, academicYearId,
        })).unwrap();
      }
      message.success("Sections created");
      setSectionInputs((p) => ({ ...p, [boardClassId]: "" }));
      dispatch(fetchSchoolClasses({ schoolId }));
    } catch (err) {
      message.error("Failed to create sections", err.message || "");
    } finally {
      setSaving((p) => ({ ...p, [`sec_${boardClassId}`]: false }));
    }
  };

  const assignedCount = boardClass.filter((bc) => isAssigned(bc._id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header bar ── */}
      <div style={{
        background: t.innerBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: t.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppstoreOutlined style={{ fontSize: 13, color: t.accent }} />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: t.textPri, display: "block" }}>
              Class & Section Setup
            </Text>
            <Text style={{ fontSize: 11.5, color: t.textSec }}>
              {assignedCount} of {boardClass.length} classes assigned
            </Text>
          </div>
        </div>

        <Select
          style={{ width: 220 }}
          value={selectedBoard}
          disabled
          placeholder="Board"
        >
          {schoolBoards.map((item) => (
            <Select.Option key={item._id} value={item.boardId?._id}>
              {item.boardId?.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* ── Class table ── */}
      <div style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.thBg, borderBottom: `1px solid ${t.thBorder}` }}>
              {["Class", "Assign", "Sections"].map((h, i) => (
                <th key={h} style={{
                  padding: "10px 16px",
                  textAlign: i === 1 ? "center" : "left",
                  fontSize: 11, fontWeight: 600, color: t.textSec,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  width: i === 1 ? 90 : "auto",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !boardClass.length
              ? [1, 2, 3].map((i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.thBorder}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <Skeleton active title={{ width: 100 }} paragraph={false} />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <Skeleton.Button active size="small" style={{ width: 40 }} />
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Skeleton active title={false} paragraph={{ rows: 1, width: "60%" }} />
                    </td>
                  </tr>
                ))
              : boardClass.length === 0
              ? (
                <tr>
                  <td colSpan={3} style={{ padding: 40, textAlign: "center" }}>
                    <Text style={{ color: t.textSec, fontSize: 13 }}>
                      No classes available for this board.
                    </Text>
                  </td>
                </tr>
              )
              : boardClass.map((record, i) => {
                  const assigned = isAssigned(record._id);
                  const sections = getSections(record._id);
                  const isHov = hovered === i;

                  return (
                    <tr
                      key={record._id}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: isHov ? t.rowHover : i % 2 === 0 ? t.rowBg : t.rowAlt,
                        borderBottom: `1px solid ${t.thBorder}`,
                        transition: "background 0.15s ease",
                        verticalAlign: "top",
                      }}
                    >
                      {/* Class name */}
                      <td style={{ padding: "14px 16px" }}>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>
                          {record.classId?.name}
                        </Text>
                      </td>

                      {/* Toggle */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
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
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11.5, color: t.textSec,
                            background: isDark ? "#1a1a1a" : "#f3f4f6",
                            padding: "3px 8px", borderRadius: 99,
                          }}>
                            <LockOutlined style={{ fontSize: 10 }} /> Assign class first
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Existing section tags */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, minHeight: 24 }}>
                              {sections.length
                                ? sections.map((sec) => (
                                    <span
                                      key={sec._id}
                                      style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: t.accent, background: t.accentBg,
                                        border: `1px solid rgba(22,119,255,0.15)`,
                                        padding: "2px 8px", borderRadius: 99,
                                      }}
                                    >
                                      {sec.sectionId?.name}
                                    </span>
                                  ))
                                : <Text style={{ fontSize: 11.5, color: t.textSec }}>No sections yet</Text>
                              }
                            </div>

                            {/* Add section input */}
                            <div style={{ display: "flex", gap: 6, maxWidth: 280 }}>
                              <Input
                                size="small"
                                placeholder="A, B, C …"
                                value={sectionInputs[record._id] || ""}
                                onChange={(e) =>
                                  setSectionInputs((p) => ({ ...p, [record._id]: e.target.value }))
                                }
                                onPressEnter={() => handleAddSection(record._id)}
                                style={{ borderRadius: 7, fontSize: 12 }}
                              />
                              <Button
                                size="small"
                                type="primary"
                                icon={<PlusOutlined />}
                                loading={saving[`sec_${record._id}`]}
                                onClick={() => handleAddSection(record._id)}
                                style={{ borderRadius: 7, fontWeight: 600 }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

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