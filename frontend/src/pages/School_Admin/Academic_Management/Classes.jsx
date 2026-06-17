import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchAllUser } from "../../../features/authSlice";
import { assignSubjectTeacher } from "../../../features/sectionSlice";
import { Modal, Select, Empty, Spin, message } from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  BookOutlined,
  TeamOutlined,
  CloseOutlined,
  CheckOutlined,
  AppstoreOutlined,
  RightOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import {
  pageWrapper,
  statGrid,
  pill,
  iconWell,
  toolbarRow,
} from "../../../styles/pageStyles.js";

const { Option } = Select;

const CLASS_ACCENTS = [
  { from: "#7c3aed", to: "#2563eb" },
  { from: "#059669", to: "#0d9488" },
  { from: "#dc2626", to: "#d97706" },
  { from: "#0284c7", to: "#7c3aed" },
  { from: "#0d9488", to: "#059669" },
  { from: "#d97706", to: "#dc2626" },
];

const SECTION_COLORS = [
  { color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  { color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  { color: "#059669", bg: "rgba(5,150,105,0.08)" },
  { color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  { color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  { color: "#0d9488", bg: "rgba(13,148,136,0.08)" },
];

/* ── STAT CARD ─────────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => (
  <div
    style={{
      background: "var(--surface)",
      borderRadius: 16,
      padding: "18px 20px",
      border: "1px solid var(--border-muted)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: "var(--shadow-soft)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-strong)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "var(--shadow-soft)";
    }}
  >
    <div style={iconWell(color, 46)}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
    </div>
    <div style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: color, opacity: 0.65, flexShrink: 0 }} />
  </div>
);

/* ── SUBJECT CHIP ──────────────────────────────────────────────────────────── */
const SubjectChip = ({ name, teacherName, colorIdx }) => {
  const c = SECTION_COLORS[colorIdx % SECTION_COLORS.length];
  return (
    <div style={{
      background: c.bg,
      border: `1.5px solid ${c.color}22`,
      borderRadius: 10,
      padding: "7px 11px",
      minWidth: 100,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.color, whiteSpace: "nowrap" }}>{name}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap" }}>
        {teacherName || "Not Assigned"}
      </div>
    </div>
  );
};

/* ── CLASS CARD ────────────────────────────────────────────────────────────── */
const ClassCard = ({ item, index, onAssign }) => {
  const [expanded, setExpanded] = useState(null);
  const accent = CLASS_ACCENTS[index % CLASS_ACCENTS.length];
  const gradient = `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`;

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid var(--border-muted)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-soft)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.22s, box-shadow 0.22s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "var(--shadow-strong)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-soft)";
      }}
    >
      {/* Header */}
      <div style={{ background: gradient, padding: "20px 20px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -22, right: -22, width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -14, left: 52, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{
              fontSize: 10, color: "rgba(255,255,255,0.62)", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Class
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 4 }}>
              {item.sections?.length || 0} Section{item.sections?.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 900, color: "#fff",
            backdropFilter: "blur(8px)",
            flexShrink: 0,
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Sections accordion */}
      <div style={{ padding: "14px 14px 0", flex: 1 }}>
        {item.sections?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {item.sections.map((sec, si) => {
              const isOpen = expanded === sec._id;
              const c = SECTION_COLORS[si % SECTION_COLORS.length];
              return (
                <div key={sec._id} style={{
                  borderRadius: 12,
                  border: `1px solid ${isOpen ? c.color + "44" : "var(--border-muted)"}`,
                  background: isOpen ? c.bg : "var(--surface-soft)",
                  overflow: "hidden",
                  transition: "border-color 0.18s, background 0.18s",
                }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : sec._id)}
                    style={{
                      width: "100%", background: "none", border: "none", cursor: "pointer",
                      padding: "10px 12px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: c.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>
                          {sec.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textAlign: "left" }}>
                        {sec.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={pill(c.color, c.bg)}>
                        {sec.subjects?.length || 0} subj
                      </span>
                      <RightOutlined style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }} />
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 12px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {sec.subjects?.length
                        ? sec.subjects.map((sub, subIdx) => (
                          <SubjectChip
                            key={sub._id}
                            name={sub.name}
                            teacherName={sub.teacherName}
                            colorIdx={subIdx}
                          />
                        ))
                        : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No subjects yet</span>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No sections added
          </div>
        )}
      </div>

      {/* Assign button */}
      <div style={{ padding: 14 }}>
        <button
          onClick={() => onAssign(item)}
          style={{
            width: "100%", height: 42, borderRadius: 12,
            background: gradient,
            border: "none", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.02em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            transition: "opacity 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.87"; e.currentTarget.style.transform = "scale(1.01)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          <UserAddOutlined style={{ fontSize: 14 }} />
          Assign Teacher
        </button>
      </div>
    </div>
  );
};

/* ── MODAL FIELD LABEL ─────────────────────────────────────────────────────── */
const FieldLabel = ({ label }) => (
  <label style={{
    display: "block",
    fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 7,
  }}>
    {label}
  </label>
);

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
const Classes = () => {
  const dispatch = useDispatch();

  const { schoolClasses = [], loading } = useSelector((state) => state.schoolClass || {});
  const { user, users = [] } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id || selectedAcademicYear || null;

  const [filterText, setFilterText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUser({ roleName: ["Teacher"], isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const filteredItems = useMemo(
    () => schoolClasses.filter(item => item.name?.toLowerCase().includes(filterText.toLowerCase())),
    [schoolClasses, filterText]
  );

  const stats = useMemo(() => ({
    classes: schoolClasses.length,
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
    }
  };

  const statDefs = [
    { icon: <AppstoreOutlined />, label: "Total Classes",   key: "classes",  color: "var(--primary)" },
    { icon: <TeamOutlined />,     label: "Total Sections",  key: "sections", color: "var(--secondary)" },
    { icon: <BookOutlined />,     label: "Total Subjects",  key: "subjects", color: "var(--success)" },
  ];

  return (
    <>
      <PageHeader
        title="Classes Management"
        subtitle="Manage classes, sections & teacher assignments"
        icon={<BookOutlined />}
      />

      <div style={{ ...pageWrapper }}>

        {/* ── Toolbar ── */}
        <div style={{ ...toolbarRow, marginBottom: 20 }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
            <SearchOutlined style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)", fontSize: 14, zIndex: 1,
            }} />
            <input
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search class..."
              style={{
                width: "100%", height: 38, borderRadius: 10,
                border: "1px solid var(--border-color)",
                paddingLeft: 36, paddingRight: 14,
                fontSize: 13, color: "var(--text-primary)",
                background: "var(--surface)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {filterText && (
            <span style={pill("var(--text-muted)", "var(--surface-soft)")}>
              {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div style={{ ...statGrid(180), marginBottom: 24 }}>
          {statDefs.map(s => (
            <StatCard key={s.key} icon={s.icon} label={s.label} value={stats[s.key]} color={s.color} />
          ))}
        </div>

        {/* ── Class grid ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
            <Spin size="large" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            background: "var(--surface)",
            borderRadius: 18,
            border: "1.5px dashed var(--border-color)",
            padding: "60px 24px",
            textAlign: "center",
          }}>
            <Empty description={<span style={{ color: "var(--text-muted)" }}>No classes found</span>} />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
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
          footer={null}
          centered
          destroyOnClose
          width={440}
          title={null}
          styles={{
            body: { padding: 0 },
            content: { borderRadius: 20, overflow: "hidden", padding: 0 },
          }}
          closeIcon={null}
        >
          {/* Modal header */}
          <div style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
            padding: "22px 24px 18px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.62)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3,
                }}>
                  Assignment
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                  Assign Teacher
                </div>
                {selectedClass && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", marginTop: 2 }}>
                    {selectedClass.name}
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(255,255,255,0.18)", border: "none",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 14, flexShrink: 0,
                }}
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div style={{
            padding: "22px 24px",
            display: "flex", flexDirection: "column", gap: 16,
            background: "var(--surface)",
          }}>
            <div>
              <FieldLabel label="Section" />
              <Select
                style={{ width: "100%" }}
                size="large"
                placeholder="Select section"
                value={selectedSection}
                onChange={val => { setSelectedSection(val); setSelectedSubject(null); }}
              >
                {selectedClass?.sections?.map(s => (
                  <Option key={s._id} value={s._id}>{s.name}</Option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel label="Subject" />
              <Select
                style={{ width: "100%" }}
                size="large"
                placeholder="Select subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                disabled={!selectedSection}
              >
                {selectedClass?.sections
                  ?.find(s => s._id === selectedSection)
                  ?.subjects?.map(sub => (
                    <Option key={sub._id} value={sub._id}>{sub.name}</Option>
                  ))}
              </Select>
            </div>

            <div>
              <FieldLabel label="Teacher" />
              <Select
                style={{ width: "100%" }}
                size="large"
                showSearch
                placeholder="Search & select teacher…"
                value={selectedTeacher}
                onChange={setSelectedTeacher}
                optionFilterProp="children"
                disabled={!selectedSubject}
              >
                {users.map(teacher => (
                  <Option key={teacher._id} value={teacher._id}>{teacher.name}</Option>
                ))}
              </Select>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, height: 44, borderRadius: 11,
                  border: "1px solid var(--border-color)",
                  background: "var(--surface-soft)",
                  color: "var(--text-secondary)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <CloseOutlined style={{ fontSize: 12 }} /> Cancel
              </button>
              <button
                onClick={handleFinish}
                style={{
                  flex: 2, height: 44, borderRadius: 11,
                  background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                  border: "none", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <CheckOutlined style={{ fontSize: 13 }} /> Assign Teacher
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Classes;
