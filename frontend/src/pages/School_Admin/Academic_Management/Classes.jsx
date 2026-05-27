import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchAllUser } from "../../../features/authSlice";
import { Modal, Select, Spin, message } from "antd";
import { useTheme } from "../../../context/ThemeContext";
import { assignSubjectTeacher } from "../../../features/sectionSlice";

const { Option } = Select;

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PALETTES = [
  { a:"#6EE7F7", b:"#3B82F6", glow:"rgba(59,130,246,0.35)"  },
  { a:"#A78BFA", b:"#7C3AED", glow:"rgba(124,58,237,0.35)"  },
  { a:"#6EE7B7", b:"#059669", glow:"rgba(5,150,105,0.35)"   },
  { a:"#FCA5A5", b:"#DC2626", glow:"rgba(220,38,38,0.3)"    },
  { a:"#FCD34D", b:"#D97706", glow:"rgba(217,119,6,0.3)"    },
  { a:"#F9A8D4", b:"#DB2777", glow:"rgba(219,39,119,0.3)"   },
];
const getPal = (idx=0) => PALETTES[idx % PALETTES.length];

/* ─────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────── */
const STYLE_ID = "cls-v2-styles";
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

  .cls-root { font-family:'Instrument Sans',system-ui,sans-serif; }

  .cls-card {
    transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    animation: cls-up 0.45s ease both;
  }
  .cls-card:hover { transform: translateY(-5px) scale(1.012); }

  .cls-stat {
    transition: transform 0.22s ease;
    animation: cls-up 0.4s ease both;
  }
  .cls-stat:hover { transform: translateY(-3px); }

  @keyframes cls-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .cls-assign-btn {
    transition: opacity 0.18s, transform 0.18s;
    border:none; cursor:pointer;
  }
  .cls-assign-btn:hover { opacity:0.88; transform:scale(0.98); }
  .cls-assign-btn:active { transform:scale(0.95); }

  .cls-search:focus-within {
    border-color:rgba(99,102,241,0.55) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
  }

  .cls-chip { transition: transform 0.15s; }
  .cls-chip:hover { transform:scale(1.04); }

  .cls-sec-row { transition: background 0.18s; }
`;

const StyleInject = () => {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement("style");
      el.id = STYLE_ID; el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);
  return null;
};

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
const Ico = ({ children, size=16, stroke="currentColor", sw=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const SearchIco = () => (
  <Ico stroke="#64748b">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.35" y2="16.35"/>
  </Ico>
);
const BookIco = ({ c="currentColor" }) => (
  <Ico stroke={c}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </Ico>
);
const UsersIco = ({ c="currentColor" }) => (
  <Ico stroke={c}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Ico>
);
const GridIco = ({ c="currentColor" }) => (
  <Ico stroke={c}>
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </Ico>
);
const UserPlusIco = ({ c="currentColor" }) => (
  <Ico stroke={c}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </Ico>
);

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, delay=0, dark }) => (
  <div className="cls-stat" style={{
    flex:"1 1 130px", minWidth:130,
    borderRadius:20, padding:"18px 20px",
    background:dark
      ? "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))"
      : "linear-gradient(145deg,#ffffff,#f8fafc)",
    border:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}`,
    backdropFilter:"blur(20px)",
    boxShadow:dark
      ? "0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)"
      : "0 4px 20px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)",
    animationDelay:`${delay}ms`,
    position:"relative", overflow:"hidden",
  }}>
    <div style={{
      position:"absolute", top:-20, right:-20,
      width:80, height:80, borderRadius:"50%",
      background:`radial-gradient(circle,${accent}2e 0%,transparent 70%)`,
      pointerEvents:"none",
    }}/>
    <div style={{
      width:38, height:38, borderRadius:12,
      background:`${accent}1a`, border:`1px solid ${accent}33`,
      display:"flex", alignItems:"center", justifyContent:"center",
      marginBottom:12,
    }}>
      {icon}
    </div>
    <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif", color:dark?"#f8fafc":"#0f172a", lineHeight:1 }}>
      {value}
    </div>
    <div style={{ fontSize:12, color:"#64748b", marginTop:4, fontWeight:500 }}>{label}</div>
  </div>
);

/* ─────────────────────────────────────────
   SUBJECT CHIP
───────────────────────────────────────── */
const SubjectChip = ({ s, dark }) => (
  <div className="cls-chip" style={{
    display:"flex", alignItems:"center", gap:5,
    padding:"4px 10px 4px 7px", borderRadius:30, fontSize:11.5, fontWeight:500,
    background:dark?"rgba(255,255,255,0.05)":"rgba(99,102,241,0.07)",
    border:`1px solid ${dark?"rgba(255,255,255,0.09)":"rgba(99,102,241,0.18)"}`,
  }}>
    <div style={{
      width:6, height:6, borderRadius:"50%", flexShrink:0,
      background:s.teacherName?"#22c55e":"#f59e0b",
      boxShadow:s.teacherName?"0 0 5px #22c55e88":"0 0 5px #f59e0b88",
    }}/>
    <span style={{ color:dark?"#c7d2fe":"#4338ca", fontWeight:600 }}>{s.name}</span>
    <span style={{ color:"#94a3b8", fontSize:10.5 }}>· {s.teacherName||"Unassigned"}</span>
  </div>
);

/* ─────────────────────────────────────────
   CLASS CARD
───────────────────────────────────────── */
const ClassCard = ({ item, idx, dark, onAssign }) => {
  const pal     = getPal(item.name, idx);
  const classNum = item.name?.replace(/\D/g,"") || item.name?.[0] || "C";
  const totalSubjects = item.sections?.reduce((a,s)=>a+(s.subjects?.length||0),0)||0;

  return (
    <div className="cls-card" style={{
      borderRadius:22, overflow:"hidden",
      background:dark
        ? "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))"
        : "linear-gradient(145deg,#ffffff,#f9fafb)",
      border:`1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
      backdropFilter:"blur(24px)",
      boxShadow:dark
        ? "0 4px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 4px 24px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)",
      animationDelay:`${idx*70}ms`,
      position:"relative",
      display:"flex", flexDirection:"column",
    }}>
      {/* Glow */}
      <div style={{
        position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%",
        background:`radial-gradient(circle,${pal.glow} 0%,transparent 70%)`,
        pointerEvents:"none",
      }}/>

      {/* Top gradient header */}
      <div style={{
        background:`linear-gradient(135deg,${pal.a},${pal.b})`,
        padding:"20px 20px 16px",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", top:-25, right:-25, width:100, height:100, borderRadius:"50%",
          background:"rgba(255,255,255,0.1)", pointerEvents:"none",
        }}/>
        <div style={{
          position:"absolute", bottom:-40, left:-20, width:80, height:80, borderRadius:"50%",
          background:"rgba(255,255,255,0.07)", pointerEvents:"none",
        }}/>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{
            width:50, height:50, borderRadius:16,
            background:"rgba(255,255,255,0.22)",
            border:"1.5px solid rgba(255,255,255,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, fontWeight:800, color:"#fff",
            fontFamily:"'Syne',sans-serif",
            backdropFilter:"blur(8px)",
          }}>
            {classNum}
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{totalSubjects} subjects</div>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#fff", fontFamily:"'Syne',sans-serif", letterSpacing:"-0.3px" }}>
            {item.name}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.72)", marginTop:2 }}>
            {item.sections?.length||0} sections
          </div>
        </div>

        {/* Section pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:10 }}>
          {item.sections?.map((s)=>(
            <span key={s._id} style={{
              padding:"3px 10px", borderRadius:30, fontSize:11.5, fontWeight:600,
              background:"rgba(255,255,255,0.2)", color:"#fff",
              border:"1px solid rgba(255,255,255,0.3)",
            }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"14px 16px 16px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {item.sections?.map((sec)=>(
          <div key={sec._id} className="cls-sec-row" style={{
            borderRadius:14, padding:"10px 12px",
            background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.025)",
            border:`1px solid ${dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`,
          }}>
            <div style={{
              fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px",
              color:dark?"#64748b":"#94a3b8", marginBottom:7,
            }}>
              {sec.name}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {sec.subjects?.length
                ? sec.subjects.map((s)=><SubjectChip key={s._id} s={s} dark={dark}/>)
                : <span style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>No subjects</span>
              }
            </div>
          </div>
        ))}

        {/* Assign button */}
        <button className="cls-assign-btn" onClick={() => onAssign(item)} style={{
          marginTop:6, width:"100%", padding:"11px 0", borderRadius:14,
          background:`linear-gradient(135deg,${pal.a},${pal.b})`,
          color:"#fff", fontSize:13, fontWeight:700,
          fontFamily:"'Instrument Sans',sans-serif",
          boxShadow:`0 4px 14px ${pal.glow}`,
          letterSpacing:"0.2px",
        }}>
          Assign Teacher
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const Classes = () => {
  const dispatch   = useDispatch();
  const { isDark } = useTheme();

  const { schoolClasses=[], loading } = useSelector((s)=>s.schoolClass||{});
  const { user, users=[] }            = useSelector((s)=>s.auth||{});
  const schoolId = user?.school?._id;
  const { selectedAcademicYear, activeYear } = useSelector((state) => state.academicYear);
   const academicYearId = selectedAcademicYear?._id || activeYear?._id;
  const [filterText,       setFilterText]       = useState("");
  const [openModal,        setOpenModal]         = useState(false);
  const [selectedClass,    setSelectedClass]     = useState(null);
  const [selectedSection,  setSelectedSection]   = useState(null);
  const [selectedSubject,  setSelectedSubject]   = useState(null);
  const [selectedTeacher,  setSelectedTeacher]   = useState(null);

  useEffect(()=>{
    dispatch(fetchAllUser({ roleName:["Teacher"], isActive:true }));
  },[dispatch]);
  useEffect(()=>{
    if(schoolId) dispatch(getClassData({ schoolId, academicYearId }));
  },[dispatch,schoolId,academicYearId]);

  const filtered = useMemo(()=>
    schoolClasses.filter((i)=>i.name?.toLowerCase().includes(filterText.toLowerCase()))
  ,[schoolClasses,filterText]);

  const stats = useMemo(()=>({
    classes:  schoolClasses.length,
    sections: schoolClasses.reduce((a,c)=>a+(c.sections?.length||0),0),
    subjects: schoolClasses.reduce((a,c)=>a+(c.sections?.reduce((x,s)=>x+(s.subjects?.length||0),0)||0),0),
  }),[schoolClasses]);

  const handleClose = () => {
    setOpenModal(false);
    setSelectedClass(null); setSelectedSection(null);
    setSelectedSubject(null); setSelectedTeacher(null);
  };

  const handleFinish = async () => {
    if (!selectedSection||!selectedSubject||!selectedTeacher)
      return message.error("Please select all fields");
    try {
      await dispatch(assignSubjectTeacher({
        sectionId:selectedSection, subjectId:selectedSubject, teacherId:selectedTeacher,
      })).unwrap();
      dispatch(getClassData({ schoolId, academicYearId }));
      message.success("Teacher assigned successfully ✅");
      handleClose();
    } catch { message.error("Failed to assign teacher"); }
  };

  return (
    <>
      <StyleInject/>
      <div className="cls-root" style={{ minHeight:"100vh", padding:"28px 24px", color:isDark?"#e2e8f0":"#1e293b", position:"relative" }}>

        {/* Ambient blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-8%", right:"-4%", width:500, height:500, borderRadius:"50%",
            background:`radial-gradient(circle,${isDark?"rgba(139,92,246,0.07)":"rgba(139,92,246,0.04)"} 0%,transparent 70%)` }}/>
          <div style={{ position:"absolute", bottom:"-8%", left:"-4%", width:560, height:560, borderRadius:"50%",
            background:`radial-gradient(circle,${isDark?"rgba(6,182,212,0.06)":"rgba(6,182,212,0.03)"} 0%,transparent 70%)` }}/>
        </div>

        <div style={{ position:"relative", zIndex:1 }}>

          {/* HEADER */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:14 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <div style={{
                  width:38, height:38, borderRadius:12,
                  background:"linear-gradient(135deg,#8b5cf6,#6366f1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 4px 14px rgba(139,92,246,0.4)",
                }}>
                  <GridIco c="#fff"/>
                </div>
                <h1 style={{
                  margin:0, fontSize:27, fontWeight:800,
                  fontFamily:"'Syne',sans-serif",
                  letterSpacing:"-0.6px",
                  color:isDark?"#f8fafc":"#0f172a",
                }}>
                  Classes
                </h1>
              </div>
              <p style={{ margin:0, fontSize:13, color:"#64748b", fontWeight:500 }}>
                Manage classes, sections & teacher assignments
              </p>
            </div>

            {/* Search */}
            <div className="cls-search" style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"10px 16px", borderRadius:16,
              background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.88)",
              border:`1.5px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,
              backdropFilter:"blur(20px)",
              boxShadow:isDark?"none":"0 2px 12px rgba(0,0,0,0.05)",
              transition:"border-color 0.2s, box-shadow 0.2s",
              width:240,
            }}>
              <SearchIco/>
              <input
                style={{
                  border:"none", outline:"none", background:"transparent",
                  fontSize:13, color:isDark?"#e2e8f0":"#1e293b",
                  width:"100%", fontFamily:"inherit",
                }}
                placeholder="Search class…"
                value={filterText}
                onChange={(e)=>setFilterText(e.target.value)}
              />
              {filterText && (
                <span onClick={()=>setFilterText("")} style={{ cursor:"pointer", color:"#94a3b8", fontSize:18, lineHeight:1 }}>×</span>
              )}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display:"flex", gap:12, marginBottom:28, flexWrap:"wrap" }}>
            <StatCard label="Total Classes"   value={stats.classes}  dark={isDark} accent="#8b5cf6" delay={0}   icon={<GridIco c="#8b5cf6"/>}/>
            <StatCard label="Total Sections"  value={stats.sections} dark={isDark} accent="#3b82f6" delay={60}  icon={<UsersIco c="#3b82f6"/>}/>
            <StatCard label="Total Subjects"  value={stats.subjects} dark={isDark} accent="#10b981" delay={120} icon={<BookIco c="#10b981"/>}/>
          </div>

          {/* GRID */}
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spin size="large"/></div>
          ) : filtered.length===0 ? (
            <div style={{
              textAlign:"center", padding:"80px 20px", borderRadius:24,
              background:isDark?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.6)",
              border:`1px dashed ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.09)"}`,
            }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🏫</div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Syne',sans-serif", color:isDark?"#f1f5f9":"#0f172a" }}>
                No classes found
              </div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:6 }}>
                {filterText?`No results for "${filterText}"`:"No classes added yet"}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:12, color:"#64748b", fontWeight:500, marginBottom:16 }}>
                Showing{" "}
                <strong style={{ color:isDark?"#a5b4fc":"#4f46e5" }}>{filtered.length}</strong>
                {" "}of {schoolClasses.length} classes
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:18 }}>
                {filtered.map((item,i)=>(
                  <ClassCard key={item._id} item={item} idx={i} dark={isDark}
                    onAssign={(cls)=>{
                      setSelectedClass(cls);
                      setSelectedSection(null); setSelectedSubject(null); setSelectedTeacher(null);
                      setOpenModal(true);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODAL */}
        <Modal
          title={
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:10,
                background:"linear-gradient(135deg,#8b5cf6,#6366f1)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 10px rgba(139,92,246,0.4)",
              }}>
                <UserPlusIco c="#fff"/>
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, fontFamily:"'Syne',sans-serif" }}>Assign Teacher</div>
                <div style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>{selectedClass?.name}</div>
              </div>
            </div>
          }
          open={openModal}
          onCancel={handleClose}
          onOk={handleFinish}
          okText="Assign"
          cancelText="Cancel"
          okButtonProps={{ style:{ background:"linear-gradient(135deg,#8b5cf6,#6366f1)", border:"none", fontWeight:600, borderRadius:10, height:36 } }}
          cancelButtonProps={{ style:{ borderRadius:10, height:36 } }}
          destroyOnClose
          styles={{ body:{ paddingTop:8 } }}
        >
          {/* Section */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b", display:"block", marginBottom:6 }}>
              Section
            </label>
            <Select style={{ width:"100%" }} value={selectedSection} placeholder="Select a section"
              onChange={(v)=>{ setSelectedSection(v); setSelectedSubject(null); }}>
              {selectedClass?.sections?.map((s)=>(
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
          </div>

          {/* Subject */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b", display:"block", marginBottom:6 }}>
              Subject
            </label>
            <Select style={{ width:"100%" }} value={selectedSubject} placeholder="Select a subject"
              onChange={setSelectedSubject} disabled={!selectedSection}>
              {selectedClass?.sections?.find((s)=>s._id===selectedSection)?.subjects?.map((sub)=>(
                <Option key={sub._id} value={sub._id}>{sub.name}</Option>
              ))}
            </Select>
          </div>

          {/* Teacher */}
          <div>
            <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b", display:"block", marginBottom:6 }}>
              Teacher
            </label>
            <Select style={{ width:"100%" }} value={selectedTeacher} placeholder="Search & select teacher"
              onChange={setSelectedTeacher} showSearch
              filterOption={(inp,opt)=>opt?.children?.toLowerCase().includes(inp.toLowerCase())}>
              {users.map((t)=>(
                <Option key={t._id} value={t._id}>{t.name}</Option>
              ))}
            </Select>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Classes;
