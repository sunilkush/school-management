import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchAllUser } from "../../../features/authSlice";
import { assignSubjectTeacher } from "../../../features/sectionSlice";
import { Modal, Select, Empty, Spin, message, Input } from "antd";
import { SearchOutlined, UserAddOutlined, BookOutlined, TeamOutlined, CloseOutlined, CheckOutlined } from "@ant-design/icons";
import { useTheme } from "../../../context/ThemeContext";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper } from "../../../styles/pageStyles.js";

const { Option } = Select;

/* ── PESTEL PALETTE ─────────────────────────────────────────────────────────
   P – Political   →  Crimson   #DC2626
   E – Economic    →  Emerald   #059669
   S – Social      →  Cobalt    #2563EB
   T – Technology  →  Violet    #7C3AED
   E – Environment →  Teal      #0D9488
   L – Legal       →  Amber     #D97706
───────────────────────────────────────────────────────────────────────────── */

const PESTEL = {
  P: { bg: "#DC2626", light: "#FEF2F2", text: "#DC2626", accent: "#991B1B" },
  E: { bg: "#059669", light: "#ECFDF5", text: "#059669", accent: "#047857" },
  S: { bg: "#2563EB", light: "#EFF6FF", text: "#2563EB", accent: "#1D4ED8" },
  T: { bg: "#7C3AED", light: "#F5F3FF", text: "#7C3AED", accent: "#6D28D9" },
  Ev: { bg: "#0D9488", light: "#F0FDFA", text: "#0D9488", accent: "#0F766E" },
  L: { bg: "#D97706", light: "#FFFBEB", text: "#D97706", accent: "#B45309" },
};

const statColors = [
  { icon: <TeamOutlined />, label: "Total Classes", key: "classes", pestel: PESTEL.S },
  { icon: <BookOutlined />, label: "Sections", key: "sections", pestel: PESTEL.T },
  { icon: <UserAddOutlined />, label: "Subjects", key: "subjects", pestel: PESTEL.Ev },
];

const cardGradients = [
  `linear-gradient(135deg, ${PESTEL.T.bg} 0%, ${PESTEL.S.bg} 100%)`,
  `linear-gradient(135deg, ${PESTEL.E.bg} 0%, ${PESTEL.Ev.bg} 100%)`,
  `linear-gradient(135deg, ${PESTEL.P.bg} 0%, ${PESTEL.L.bg} 100%)`,
  `linear-gradient(135deg, ${PESTEL.S.bg} 0%, ${PESTEL.T.bg} 100%)`,
  `linear-gradient(135deg, ${PESTEL.Ev.bg} 0%, ${PESTEL.E.bg} 100%)`,
  `linear-gradient(135deg, ${PESTEL.L.bg} 0%, ${PESTEL.P.bg} 100%)`,
];

const subjectChipColors = [PESTEL.P, PESTEL.E, PESTEL.S, PESTEL.T, PESTEL.Ev, PESTEL.L];

/* ─── STAT CARD ─────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, pestel }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 20,
      padding: "22px 24px",
      border: `1.5px solid #F1F5F9`,
      display: "flex",
      alignItems: "center",
      gap: 18,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
  >
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: pestel.light,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, color: pestel.bg, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500, letterSpacing: "0.03em", fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", lineHeight: 1.1, fontFamily: "'Sora', sans-serif" }}>{value}</div>
    </div>
    <div style={{
      marginLeft: "auto", width: 5, alignSelf: "stretch",
      borderRadius: 99, background: pestel.bg, opacity: 0.85,
    }} />
  </div>
);

/* ─── SUBJECT CHIP ──────────────────────────────────────────────────────── */
const SubjectChip = ({ name, teacherName, colorIdx }) => {
  const c = subjectChipColors[colorIdx % subjectChipColors.length];
  return (
    <div style={{
      background: c.light,
      border: `1.5px solid ${c.bg}22`,
      borderRadius: 12,
      padding: "8px 12px",
      minWidth: 110,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.bg, fontFamily: "'Sora', sans-serif" }}>{name}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
        {teacherName || "Not Assigned"}
      </div>
    </div>
  );
};

/* ─── CLASS CARD ─────────────────────────────────────────────────────────── */
const ClassCard = ({ item, index, onAssign }) => {
  const [expanded, setExpanded] = useState(null);
  const gradient = cardGradients[index % cardGradients.length];

  return (
    <div style={{
      borderRadius: 24,
      overflow: "hidden",
      border: "1.5px solid #F1F5F9",
      background: "#fff",
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      transition: "transform 0.25s, box-shadow 0.25s",
      display: "flex", flexDirection: "column",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
    >
      {/* Header */}
      <div style={{ background: gradient, padding: "22px 22px 18px", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -28, right: -28, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", bottom: -18, left: 60, width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Class</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Sora', sans-serif", marginTop: 2 }}>{item.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              {item.sections?.length || 0} Section{item.sections?.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff",
            fontFamily: "'Sora', sans-serif",
            backdropFilter: "blur(8px)",
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 18px 0", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {item.sections?.map((sec, si) => {
            const isOpen = expanded === sec._id;
            const secColor = subjectChipColors[si % subjectChipColors.length];
            return (
              <div key={sec._id} style={{
                borderRadius: 16,
                border: `1.5px solid ${isOpen ? secColor.bg + "44" : "#F1F5F9"}`,
                background: isOpen ? secColor.light : "#F8FAFC",
                overflow: "hidden",
                transition: "border 0.2s, background 0.2s",
              }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : sec._id)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: secColor.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Sora', sans-serif" }}>
                        {sec.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "'Sora', sans-serif" }}>{sec.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: secColor.bg,
                      background: secColor.light, borderRadius: 99, padding: "2px 10px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {sec.subjects?.length || 0} subj
                    </span>
                    <span style={{ fontSize: 14, color: "#94A3B8", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: "0 14px 14px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sec.subjects?.length ? sec.subjects.map((sub, subIdx) => (
                      <SubjectChip key={sub._id} name={sub.name} teacherName={sub.teacherName} colorIdx={subIdx} />
                    )) : (
                      <span style={{ fontSize: 12, color: "#CBD5E1", fontFamily: "'DM Sans', sans-serif" }}>No subjects yet</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Button */}
      <div style={{ padding: 18 }}>
        <button
          onClick={() => onAssign(item)}
          style={{
            width: "100%", height: 46, borderRadius: 14,
            background: gradient,
            border: "none", color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Sora', sans-serif", letterSpacing: "0.03em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.01)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          <UserAddOutlined style={{ fontSize: 16 }} />
          Assign Teacher
        </button>
      </div>
    </div>
  );
};

/* ─── MODAL LABEL ────────────────────────────────────────────────────────── */
const FieldLabel = ({ letter, label, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
    <div style={{
      width: 22, height: 22, borderRadius: 6, background: color.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'Sora', sans-serif",
      flexShrink: 0,
    }}>{letter}</div>
    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const Classes = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();

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

  const filteredItems = useMemo(() =>
    schoolClasses.filter(item => item.name?.toLowerCase().includes(filterText.toLowerCase())),
    [schoolClasses, filterText]
  );

  const stats = useMemo(() => ({
    classes: schoolClasses.length,
    sections: schoolClasses.reduce((acc, cls) => acc + (cls.sections?.length || 0), 0),
    subjects: schoolClasses.reduce((acc, cls) => acc + (cls.sections?.reduce((a, s) => a + (s.subjects?.length || 0), 0) || 0), 0),
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
      await dispatch(assignSubjectTeacher({ sectionId: selectedSection, subjectId: selectedSubject, teacherId: selectedTeacher })).unwrap();
      dispatch(getClassData({ schoolId, academicYearId }));
      message.success("Teacher Assigned Successfully ✅");
      handleClose();
    } catch (err) {
      message.error("Assignment Failed: " + (err?.message || "Unknown error"));
    }
  };

  /* ── FONT INJECTION ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  /* ── PESTEL LEGEND ── */
  const pestelLegend = [
    { letter: "P", label: "Political", color: PESTEL.P.bg },
    { letter: "E", label: "Economic", color: PESTEL.E.bg },
    { letter: "S", label: "Social", color: PESTEL.S.bg },
    { letter: "T", label: "Tech", color: PESTEL.T.bg },
    { letter: "E", label: "Environment", color: PESTEL.Ev.bg },
    { letter: "L", label: "Legal", color: PESTEL.L.bg },
  ];

  const pageBg = isDark ? "#0B1120" : "#F8FAFC";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";

  return (
    <>
    <PageHeader
      title="Classes Management"
      subtitle="Manage classes, sections & teacher assignments"
      icon={<BookOutlined />}
    />
    <div style={{ ...pageWrapper, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── SEARCH TOOLBAR ── */}
      <div className="page-toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <SearchOutlined style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 16, zIndex: 1 }} />
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Search class..."
            style={{
              width: "100%", height: 40, borderRadius: 10,
              border: "1px solid var(--border-muted)",
              paddingLeft: 40, paddingRight: 16,
              fontSize: 14, color: "var(--text-primary)",
              background: "var(--surface)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {statColors.map(s => (
          <StatCard key={s.key} icon={s.icon} label={s.label} value={stats[s.key]} pestel={s.pestel} />
        ))}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
          <Spin size="large" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 24, border: "1.5px solid #F1F5F9", padding: "60px 24px", textAlign: "center" }}>
          <Empty description={<span style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}>No Classes Found</span>} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredItems.map((item, index) => (
            <ClassCard key={item._id} item={item} index={index} onAssign={handleAssign} />
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      <Modal
        open={openModal}
        onCancel={handleClose}
        footer={null}
        centered
        destroyOnClose
        width={460}
        title={null}
        styles={{ body: { padding: 0 }, content: { borderRadius: 24, overflow: "hidden", padding: 0 } }}
        closeIcon={null}
      >
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
          padding: "24px 28px 20px", position: "relative",
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Assignment</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Sora', sans-serif", marginTop: 2 }}>Assign Teacher</div>
            </div>
            <button onClick={handleClose} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15 }}>
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, background: "#fff" }}>

          {/* Class display */}
          <div>
            <FieldLabel letter="S" label="Class" color={PESTEL.S} />
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: PESTEL.S.light, border: `1.5px solid ${PESTEL.S.bg}33`,
              fontSize: 15, fontWeight: 700, color: PESTEL.S.bg,
              fontFamily: "'Sora', sans-serif",
            }}>
              {selectedClass?.name}
            </div>
          </div>

          {/* Section */}
          <div>
            <FieldLabel letter="E" label="Section" color={PESTEL.Ev} />
            <Select
              style={{ width: "100%" }}
              size="large"
              placeholder="Select Section"
              value={selectedSection}
              onChange={(val) => { setSelectedSection(val); setSelectedSubject(null); }}
              styles={{ selector: { borderRadius: 12, borderColor: `${PESTEL.Ev.bg}55`, background: PESTEL.Ev.light } }}
            >
              {selectedClass?.sections?.map(s => (
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
          </div>

          {/* Subject */}
          <div>
            <FieldLabel letter="T" label="Subject" color={PESTEL.T} />
            <Select
              style={{ width: "100%" }}
              size="large"
              placeholder="Select Subject"
              value={selectedSubject}
              onChange={setSelectedSubject}
              disabled={!selectedSection}
              styles={{ selector: { borderRadius: 12, borderColor: `${PESTEL.T.bg}55` } }}
            >
              {selectedClass?.sections
                ?.find(s => s._id === selectedSection)
                ?.subjects?.map(sub => (
                  <Option key={sub._id} value={sub._id}>{sub.name}</Option>
                ))}
            </Select>
          </div>

          {/* Teacher */}
          <div>
            <FieldLabel letter="L" label="Teacher" color={PESTEL.L} />
            <Select
              style={{ width: "100%" }}
              size="large"
              showSearch
              placeholder="Search Teacher..."
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              optionFilterProp="children"
              styles={{ selector: { borderRadius: 12, borderColor: `${PESTEL.L.bg}55` } }}
            >
              {users.map(teacher => (
                <Option key={teacher._id} value={teacher._id}>{teacher.name}</Option>
              ))}
            </Select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                color: "#64748B", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <CloseOutlined style={{ fontSize: 13 }} /> Cancel
            </button>
            <button
              onClick={handleFinish}
              style={{
                flex: 2, height: 46, borderRadius: 12,
                background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                border: "none", color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Sora', sans-serif", letterSpacing: "0.02em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <CheckOutlined style={{ fontSize: 15 }} /> Assign Teacher
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
};

export default Classes;