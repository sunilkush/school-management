import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchAllUser } from "../../../features/authSlice";
import { assignSubjectTeacher } from "../../../features/sectionSlice";
import {
  Modal, Select, Empty, Spin, message, Input, Button, Tag,
  Typography, Collapse,
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  BookOutlined,
  TeamOutlined,
  AppstoreOutlined,
  RightOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader.jsx";

const { Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const C = { primary: "#7c3aed", success: "#10b981", warning: "#f59e0b", danger: "#ef4444", info: "#06b6d4" };

/* ─── Pastel palette — one per class card ────────────────────── */
const PASTEL = [
  { accent: "#7c3aed", light: "#ede9fe" },   // lavender
  { accent: "#0369a1", light: "#e0f2fe" },   // sky
  { accent: "#047857", light: "#d1fae5" },   // mint
  { accent: "#b45309", light: "#fef3c7" },   // amber
  { accent: "#be123c", light: "#ffe4e6" },   // rose
  { accent: "#0e7490", light: "#cffafe" },   // cyan
  { accent: "#7e22ce", light: "#f3e8ff" },   // violet
  { accent: "#be185d", light: "#fce7f3" },   // pink
];

/* ─── Stat row ───────────────────────────────────────────────── */
const StatRow = ({ classes, sections, subjects }) => (
  <div style={{
    display: "flex", gap: 1, background: "var(--border)",
    border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
    marginBottom: 16,
  }}>
    {[
      { icon: <AppstoreOutlined />, label: "Classes",  value: classes,  color: C.primary },
      { icon: <TeamOutlined />,     label: "Sections", value: sections, color: C.info    },
      { icon: <BookOutlined />,     label: "Subjects", value: subjects, color: C.success },
    ].map((s) => (
      <div key={s.label} style={{
        flex: 1, background: "var(--surface)", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${s.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: s.color, fontSize: 14,
        }}>
          {s.icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{s.label}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Class card ─────────────────────────────────────────────── */
const ClassCard = ({ item, index, onAssign }) => {
  const [openSec, setOpenSec] = useState(null);
  const p = PASTEL[index % PASTEL.length];

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
      boxShadow: "var(--shadow-soft)",
    }}>
      {/* Pastel top strip */}
      <div style={{ height: 4, background: p.accent, opacity: 0.7 }} />

      {/* Card header */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: p.light + "55",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: p.light,
            border: `1.5px solid ${p.accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: p.accent,
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block" }}>
              {item.name}
            </Text>
            <Text style={{ fontSize: 11, color: p.accent, opacity: 0.85 }}>
              {item.sections?.length || 0} section{item.sections?.length !== 1 ? "s" : ""}
            </Text>
          </div>
        </div>
        <Button
          size="small"
          icon={<UserAddOutlined />}
          onClick={() => onAssign(item)}
          style={{
            borderRadius: 7, fontSize: 11, fontWeight: 600,
            background: p.light, borderColor: `${p.accent}40`,
            color: p.accent,
          }}
        >
          Assign
        </Button>
      </div>

      {/* Sections */}
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        {item.sections?.length ? (
          item.sections.map((sec) => {
            const isOpen = openSec === sec._id;
            return (
              <div key={sec._id} style={{
                border: `1px solid ${isOpen ? p.accent + "35" : "var(--border)"}`,
                borderRadius: 8, overflow: "hidden",
                background: isOpen ? p.light + "66" : "var(--surface-soft)",
                transition: "border-color 0.15s, background 0.15s",
              }}>
                <button
                  onClick={() => setOpenSec(isOpen ? null : sec._id)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "7px 10px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      background: p.light,
                      border: `1px solid ${p.accent}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: p.accent,
                    }}>
                      {sec.name?.charAt(0) || "?"}
                    </div>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                      {sec.name}
                    </Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: p.accent,
                      background: p.light, padding: "1px 7px", borderRadius: 99,
                      border: `1px solid ${p.accent}25`,
                    }}>
                      {sec.subjects?.length || 0} subj
                    </span>
                    <RightOutlined style={{
                      fontSize: 9, color: "var(--text-muted)",
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.18s",
                    }} />
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: "4px 10px 10px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {sec.subjects?.length ? (
                      sec.subjects.map((sub) => (
                        <div key={sub._id} style={{
                          background: p.light + "88",
                          border: `1px solid ${p.accent}20`,
                          borderRadius: 7, padding: "4px 9px",
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: 600, color: p.accent, display: "block" }}>
                            {sub.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            {sub.teacherName || "Not assigned"}
                          </Text>
                        </div>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontSize: 11 }}>No subjects yet</Text>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <Text type="secondary" style={{ fontSize: 12, textAlign: "center", display: "block", padding: "8px 0" }}>
            No sections added
          </Text>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
const Classes = () => {
  const dispatch = useDispatch();

  const { schoolClasses = [], loading } = useSelector((state) => state.schoolClass || {});
  const { user, users = [] }            = useSelector((state) => state.auth || {});
  const { selectedAcademicYear }        = useSelector((s) => s.academicYear || {});

  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || selectedAcademicYear || null;

  const [filterText,      setFilterText]      = useState("");
  const [openModal,       setOpenModal]       = useState(false);
  const [selectedClass,   setSelectedClass]   = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assigning,       setAssigning]       = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser({ roleName: ["Teacher"], isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const filteredItems = useMemo(
    () => schoolClasses.filter((item) =>
      item.name?.toLowerCase().includes(filterText.toLowerCase())
    ),
    [schoolClasses, filterText]
  );

  const stats = useMemo(() => ({
    classes:  schoolClasses.length,
    sections: schoolClasses.reduce((acc, cls) => acc + (cls.sections?.length || 0), 0),
    subjects: schoolClasses.reduce((acc, cls) =>
      acc + (cls.sections?.reduce((a, s) => a + (s.subjects?.length || 0), 0) || 0), 0),
  }), [schoolClasses]);

  const handleClose = () => {
    setOpenModal(false);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setSelectedTeacher(null);
  };

  const handleAssign = (item) => {
    setSelectedClass(item);
    setSelectedSection(null);
    setSelectedSubject(null);
    setSelectedTeacher(null);
    setOpenModal(true);
  };

  const handleFinish = async () => {
    if (!selectedSection || !selectedSubject || !selectedTeacher)
      return message.error("Please fill in all fields");
    setAssigning(true);
    try {
      await dispatch(assignSubjectTeacher({
        sectionId: selectedSection,
        subjectId: selectedSubject,
        teacherId: selectedTeacher,
      })).unwrap();
      dispatch(getClassData({ schoolId, academicYearId }));
      message.success("Teacher assigned successfully");
      handleClose();
    } catch (err) {
      message.error("Assignment failed: " + (err?.message || "Unknown error"));
    } finally {
      setAssigning(false);
    }
  };

  /* subjects available for the selected section */
  const sectionSubjects = useMemo(
    () => selectedClass?.sections?.find((s) => s._id === selectedSection)?.subjects || [],
    [selectedClass, selectedSection]
  );

  return (
    <>
      <PageHeader
        title="Classes Management"
        subtitle="Manage classes, sections & teacher assignments"
        icon={<BookOutlined />}
      />

      <div style={{ padding: "16px 24px 40px" }}>

        {/* ── Stats ── */}
        <StatRow classes={stats.classes} sections={stats.sections} subjects={stats.subjects} />

        {/* ── Toolbar ── */}
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />}
            placeholder="Search class…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            allowClear
            style={{ maxWidth: 280, borderRadius: 8, fontSize: 12 }}
          />
          {filterText && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 10 }}>
              {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
            </Text>
          )}
        </div>

        {/* ── Class grid ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            background: "var(--surface)", borderRadius: 12,
            border: "1px dashed var(--border)", padding: "48px 24px", textAlign: "center",
          }}>
            <Empty description={<Text type="secondary" style={{ fontSize: 13 }}>No classes found</Text>} />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}>
            {filteredItems.map((item, index) => (
              <ClassCard key={item._id} item={item} index={index} onAssign={handleAssign} />
            ))}
          </div>
        )}

        {/* ── Assign Teacher Modal ── */}
        <Modal
          open={openModal}
          onCancel={handleClose}
          centered
          destroyOnClose
          width={420}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(124,58,237,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <UserAddOutlined style={{ color: C.primary, fontSize: 14 }} />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block" }}>
                  Assign Subject Teacher
                </Text>
                {selectedClass && (
                  <Text type="secondary" style={{ fontSize: 11 }}>{selectedClass.name}</Text>
                )}
              </div>
            </div>
          }
          footer={
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={handleClose} style={{ flex: 1, borderRadius: 8, fontSize: 12 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={assigning}
                onClick={handleFinish}
                disabled={!selectedSection || !selectedSubject || !selectedTeacher}
                style={{ flex: 2, borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                Assign Teacher
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
            {/* Section */}
            <div>
              <Text style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Section
              </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Select section"
                value={selectedSection}
                onChange={(val) => { setSelectedSection(val); setSelectedSubject(null); }}
              >
                {selectedClass?.sections?.map((s) => (
                  <Option key={s._id} value={s._id}>{s.name}</Option>
                ))}
              </Select>
            </div>

            {/* Subject */}
            <div>
              <Text style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Subject
              </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Select subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                disabled={!selectedSection}
                notFoundContent={
                  selectedSection && sectionSubjects.length === 0
                    ? <Text type="secondary" style={{ fontSize: 12 }}>No subjects in this section</Text>
                    : undefined
                }
              >
                {sectionSubjects.map((sub) => (
                  <Option key={sub._id} value={sub._id}>{sub.name}</Option>
                ))}
              </Select>
            </div>

            {/* Teacher */}
            <div>
              <Text style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Teacher
              </Text>
              <Select
                style={{ width: "100%" }}
                showSearch
                placeholder="Search & select teacher…"
                value={selectedTeacher}
                onChange={setSelectedTeacher}
                optionFilterProp="children"
                disabled={!selectedSubject}
              >
                {users.map((teacher) => (
                  <Option key={teacher._id} value={teacher._id}>{teacher.name}</Option>
                ))}
              </Select>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Classes;
