import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Select, Button, message, Typography, Skeleton } from "antd";
import {
  BookOutlined,
  CheckOutlined,
  FilterOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchAllSubjects } from "../../../features/subjectSlice";
import { addSubjectToSection } from "../../../features/sectionSlice";
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

const SchoolClassSubject = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { schoolClasses = [], loading } = useSelector((s) => s.schoolClass || {});
  const { subjects = [] }               = useSelector((s) => s.subject || {});
  const user                            = useSelector((s) => s.auth.user);
  const { selectedAcademicYear }        = useSelector((s) => s.academicYear);

  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [mapping, setMapping]         = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving]           = useState({});
  const [saved, setSaved]             = useState({});
  const [hovered, setHovered]         = useState(null);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!schoolClasses.length) return;
    const initial = {};
    schoolClasses.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        initial[sec._id] = sec.sectionId?.subjects?.map((s) => s.subjectId) || [];
      });
    });
    setMapping(initial);
  }, [schoolClasses]);

  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((s) => { map[s._id] = s; });
    return map;
  }, [subjects]);

  const tableData = useMemo(() =>
    schoolClasses.flatMap((cls) =>
      (cls.sections || []).map((sec) => ({
        _id: sec._id,
        schoolClassId: cls._id,
        className: cls.name,
        sectionId: sec.sectionId?._id,
        sectionName: sec.sectionId?.name,
      }))
    ), [schoolClasses]);

  const filteredData = useMemo(() =>
    selectedClass ? tableData.filter((r) => r.schoolClassId === selectedClass) : tableData,
    [tableData, selectedClass]);

  const handleChange = useCallback((rowId, values) => {
    setMapping((p) => ({ ...p, [rowId]: values }));
    setSaved((p) => ({ ...p, [rowId]: false }));
  }, []);

  const handleSave = useCallback(async (record) => {
    setSaving((p) => ({ ...p, [record._id]: true }));
    try {
      await dispatch(addSubjectToSection({
        schoolClassId: record.schoolClassId,
        sectionId: record.sectionId,
        subjectIds: mapping[record._id] || [],
      })).unwrap();
      message.success("Subjects saved");
      setSaved((p) => ({ ...p, [record._id]: true }));
    } catch (err) {
      message.error(err || "Failed to save");
    } finally {
      setSaving((p) => ({ ...p, [record._id]: false }));
    }
  }, [dispatch, mapping]);

  const totalMapped = Object.values(mapping).filter((v) => v?.length > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Toolbar ── */}
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
            <BookOutlined style={{ fontSize: 13, color: t.accent }} />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: t.textPri, display: "block" }}>
              Subject Mapping
            </Text>
            <Text style={{ fontSize: 11.5, color: t.textSec }}>
              {totalMapped} of {tableData.length} sections mapped
            </Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilterOutlined style={{ fontSize: 12, color: t.textSec }} />
          <Select
            placeholder="Filter by class"
            style={{ width: 180, borderRadius: 8 }}
            allowClear
            onChange={setSelectedClass}
            value={selectedClass}
            options={schoolClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.thBg, borderBottom: `1px solid ${t.thBorder}` }}>
              {["Class", "Section", "Assign Subjects", "Mapped", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 11, fontWeight: 600, color: t.textSec,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  width: i === 4 ? 80 : "auto",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !filteredData.length
              ? [1, 2, 3].map((i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.thBorder}` }}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <Skeleton active title={false} paragraph={{ rows: 1, width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : filteredData.length === 0
              ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center" }}>
                    <Text style={{ color: t.textSec, fontSize: 13 }}>
                      No sections found. Assign classes first.
                    </Text>
                  </td>
                </tr>
              )
              : filteredData.map((record, i) => {
                  const selected  = mapping[record._id] || [];
                  const isHov     = hovered === i;
                  const isSaved   = saved[record._id];
                  const isSaving  = saving[record._id];
                  const isDirty   = selected.length > 0 && !isSaved;

                  return (
                    <tr
                      key={record._id}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: isHov ? t.rowHover : i % 2 === 0 ? t.rowBg : t.rowAlt,
                        borderBottom: `1px solid ${t.thBorder}`,
                        transition: "background 0.15s ease",
                        verticalAlign: "middle",
                      }}
                    >
                      {/* Class */}
                      <td style={{ padding: "12px 16px" }}>
                        <Text style={{ fontSize: 12.5, fontWeight: 600, color: t.textPri }}>
                          {record.className}
                        </Text>
                      </td>

                      {/* Section */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 600,
                          color: t.accent, background: t.accentBg,
                          padding: "2px 8px", borderRadius: 99,
                        }}>
                          {record.sectionName}
                        </span>
                      </td>

                      {/* Subject select */}
                      <td style={{ padding: "10px 16px", minWidth: 200 }}>
                        <Select
                          mode="multiple"
                          style={{ width: "100%" }}
                          value={selected}
                          onChange={(val) => handleChange(record._id, val)}
                          placeholder="Select subjects…"
                          maxTagCount={2}
                          maxTagTextLength={10}
                          options={subjects.map((s) => ({ label: s.name, value: s._id }))}
                          size="small"
                          styles={{ popup: { root: { borderRadius: 10 } } }}
                        />
                      </td>

                      {/* Count badge */}
                      <td style={{ padding: "12px 16px" }}>
                        {selected.length > 0 ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: t.success, background: t.successBg,
                            padding: "2px 8px", borderRadius: 99,
                          }}>
                            {selected.length} subject{selected.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <Text style={{ fontSize: 11, color: t.textSec }}>—</Text>
                        )}
                      </td>

                      {/* Save btn */}
                      <td style={{ padding: "10px 16px" }}>
                        <Button
                          size="small"
                          type={isSaved ? "default" : "primary"}
                          icon={isSaved ? <CheckOutlined /> : <SaveOutlined />}
                          loading={isSaving}
                          disabled={!selected.length || isSaving}
                          onClick={() => handleSave(record)}
                          style={{
                            borderRadius: 7,
                            fontWeight: 600,
                            fontSize: 11,
                            ...(isSaved ? {
                              color: t.success,
                              borderColor: t.success,
                              background: t.successBg,
                            } : {}),
                          }}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchoolClassSubject;