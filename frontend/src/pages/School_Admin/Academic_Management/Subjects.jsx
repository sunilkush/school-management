import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import { getAllSubjects } from "../../../features/subjectSlice.js";
import { useTheme } from "../../../context/ThemeContext.jsx";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const toDisplayText = (value, fallback = "—") => {
  if (value == null) return fallback;
  const t = String(value).trim();
  return t.length ? t : fallback;
};

const SUBJECT_ACCENTS = [
  { a: "#6EE7F7", b: "#3B82F6", glow: "rgba(59,130,246,0.35)" },
  { a: "#A78BFA", b: "#7C3AED", glow: "rgba(124,58,237,0.35)" },
  { a: "#6EE7B7", b: "#059669", glow: "rgba(5,150,105,0.35)" },
  { a: "#FCA5A5", b: "#DC2626", glow: "rgba(220,38,38,0.3)"  },
  { a: "#FCD34D", b: "#D97706", glow: "rgba(217,119,6,0.3)"  },
  { a: "#F9A8D4", b: "#DB2777", glow: "rgba(219,39,119,0.3)" },
  { a: "#86EFAC", b: "#16A34A", glow: "rgba(22,163,74,0.3)"  },
  { a: "#FDA4AF", b: "#E11D48", glow: "rgba(225,29,72,0.3)"  },
];
const getAccent = (name = "") => SUBJECT_ACCENTS[name.charCodeAt(0) % SUBJECT_ACCENTS.length];

/* ─────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────── */
const STYLE_ID = "subj-v2-styles";
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

  .subj-root { font-family:'Instrument Sans',system-ui,sans-serif; }

  .subj-card {
    transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    animation: subj-up 0.45s ease both;
  }
  .subj-card:hover { transform: translateY(-6px) scale(1.015); }

  .subj-stat {
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    animation: subj-up 0.4s ease both;
  }
  .subj-stat:hover { transform: translateY(-4px); }

  @keyframes subj-up {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .subj-pill {
    transition: transform 0.18s ease;
  }
  .subj-pill:hover { transform:scale(1.05); }

  .subj-search:focus-within {
    border-color:rgba(99,102,241,0.55) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
  }

  .badge-active   { background:rgba(34,197,94,0.14);  color:#4ade80; border:1px solid rgba(34,197,94,0.3);  }
  .badge-inactive { background:rgba(239,68,68,0.14);  color:#f87171; border:1px solid rgba(239,68,68,0.3);  }
  .badge-global   { background:rgba(59,130,246,0.14); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); }
  .badge-school   { background:rgba(167,139,250,0.14);color:#c084fc; border:1px solid rgba(167,139,250,0.3);}
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
const Ico = ({ children, size = 16, stroke = "currentColor", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const SearchIco = () => (
  <Ico stroke="#64748b">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.35" y2="16.35"/>
  </Ico>
);
const BookIco = ({ c = "currentColor" }) => (
  <Ico stroke={c}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </Ico>
);
const GlobeIco = ({ c = "currentColor" }) => (
  <Ico stroke={c}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </Ico>
);
const CheckIco = ({ c = "#4ade80" }) => (
  <Ico stroke={c} sw={2.5}><polyline points="20 6 9 17 4 12"/></Ico>
);
const XIco = ({ c = "#f87171" }) => (
  <Ico stroke={c} sw={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>
);

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, delay = 0, dark }) => (
  <div className="subj-stat" style={{
    flex: "1 1 130px", minWidth: 130,
    borderRadius: 20, padding: "18px 20px",
    background: dark
      ? "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))"
      : "linear-gradient(145deg,#ffffff,#f8fafc)",
    border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
    backdropFilter: "blur(20px)",
    boxShadow: dark
      ? "0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)"
      : "0 4px 20px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9)",
    animationDelay: `${delay}ms`,
    position: "relative", overflow: "hidden",
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
   SUBJECT CARD
───────────────────────────────────────── */
const SubjectCard = ({ item, idx, dark }) => {
  const name = toDisplayText(item?.name, "Unnamed");
  const acc  = getAccent(name);
  const isActive = item?.isActive;

  return (
    <div className="subj-card" style={{
      borderRadius: 22, overflow: "hidden",
      background: dark
        ? "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))"
        : "linear-gradient(145deg,#ffffff,#f9fafb)",
      border: `1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}`,
      backdropFilter: "blur(24px)",
      boxShadow: dark
        ? "0 4px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 4px 24px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95)",
      animationDelay: `${idx * 55}ms`,
      position: "relative",
    }}>
      {/* Glow blob */}
      <div style={{
        position:"absolute", top:-28, right:-28, width:110, height:110, borderRadius:"50%",
        background:`radial-gradient(circle,${acc.glow} 0%,transparent 70%)`,
        pointerEvents:"none",
      }}/>

      {/* Top gradient line */}
      <div style={{ height:3, background:`linear-gradient(90deg,${acc.a},${acc.b})` }}/>

      <div style={{ padding:"18px 18px 16px" }}>
        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
          {/* Avatar */}
          <div style={{
            width:48, height:48, borderRadius:15, flexShrink:0,
            background:`linear-gradient(135deg,${acc.a},${acc.b})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:21, fontWeight:800, color:"#fff",
            fontFamily:"'Syne',sans-serif",
            boxShadow:`0 6px 18px ${acc.glow}`,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
            <div style={{
              fontSize:15, fontWeight:700, fontFamily:"'Syne',sans-serif",
              color:dark?"#f1f5f9":"#0f172a",
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              letterSpacing:"-0.2px",
            }}>
              {name}
            </div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:2, fontWeight:500 }}>
              {toDisplayText(item?.category)} · {toDisplayText(item?.type)}
            </div>
          </div>

          <span className={isActive?"badge-active":"badge-inactive"} style={{
            padding:"3px 10px", borderRadius:30, fontSize:11, fontWeight:700,
            display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
          }}>
            {isActive ? <CheckIco/> : <XIco/>}
            {isActive?"Active":"Inactive"}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)", margin:"0 0 13px" }}/>

        {/* Footer pills */}
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {/* Marks */}
          <div className="subj-pill" style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"5px 11px", borderRadius:30,
            background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",
            border:`1px solid ${dark?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.06)"}`,
            fontSize:12, fontWeight:500, color:dark?"#94a3b8":"#64748b",
          }}>
            <BookIco c={dark?"#94a3b8":"#64748b"}/>
            <span>Pass / Max</span>
            <span style={{
              padding:"1px 8px", borderRadius:20,
              background:`linear-gradient(90deg,${acc.a}22,${acc.b}22)`,
              border:`1px solid ${acc.b}44`,
              color:dark?acc.a:acc.b, fontWeight:700, fontSize:12,
            }}>
              {toDisplayText(item?.passMarks,"0")} / {toDisplayText(item?.maxMarks,"0")}
            </span>
          </div>

          {/* Scope */}
          <span className={item?.isGlobal?"badge-global":"badge-school"} style={{
            padding:"5px 11px", borderRadius:30, fontSize:12, fontWeight:600,
            display:"flex", alignItems:"center", gap:5,
          }}>
            <GlobeIco c="currentColor"/>
            {item?.isGlobal ? "Global" : toDisplayText(item?.schoolId?.name,"School")}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const Subjects = () => {
  const dispatch   = useDispatch();
  const { isDark } = useTheme();
  const [searchText, setSearchText] = useState("");

  const { user }                   = useSelector((s) => s.auth || {});
  const { selectedAcademicYear }   = useSelector((s) => s.academicYear || {});
  const { subjects = [], loading } = useSelector((s) => s.subject || {});
  const schoolId       = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  useEffect(() => {
    if (schoolId) dispatch(getAllSubjects({ page:1, limit:50, schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const safe = useMemo(() => (Array.isArray(subjects) ? subjects : []), [subjects]);
  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return q ? safe.filter((s) => toDisplayText(s?.name,"").toLowerCase().includes(q)) : safe;
  }, [safe, searchText]);

  const stats = useMemo(() => ({
    total:    safe.length,
    active:   safe.filter((s) =>  s?.isActive).length,
    inactive: safe.filter((s) => !s?.isActive).length,
    global:   safe.filter((s) =>  s?.isGlobal).length,
  }), [safe]);

  return (
    <>
      <StyleInject />
      <div className="subj-root" style={{ minHeight:"100vh", padding:"28px 24px", color:isDark?"#e2e8f0":"#1e293b", position:"relative" }}>

        {/* Ambient blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-8%", left:"-4%", width:520, height:520, borderRadius:"50%",
            background:`radial-gradient(circle,${isDark?"rgba(99,102,241,0.07)":"rgba(99,102,241,0.04)"} 0%,transparent 70%)` }}/>
          <div style={{ position:"absolute", bottom:"-8%", right:"-4%", width:580, height:580, borderRadius:"50%",
            background:`radial-gradient(circle,${isDark?"rgba(6,182,212,0.06)":"rgba(6,182,212,0.03)"} 0%,transparent 70%)` }}/>
        </div>

        <div style={{ position:"relative", zIndex:1 }}>

          {/* HEADER */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:14 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <div style={{
                  width:38, height:38, borderRadius:12,
                  background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 4px 14px rgba(99,102,241,0.4)",
                }}>
                  <BookIco c="#fff"/>
                </div>
                <h1 style={{
                  margin:0, fontSize:27, fontWeight:800,
                  fontFamily:"'Syne',sans-serif",
                  letterSpacing:"-0.6px",
                  color:isDark?"#f8fafc":"#0f172a",
                }}>
                  Subjects
                </h1>
              </div>
              <p style={{ margin:0, fontSize:13, color:"#64748b", fontWeight:500 }}>
                Curriculum management · {safe.length} subjects
              </p>
            </div>

            {/* Search */}
            <div className="subj-search" style={{
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
                placeholder="Search subjects…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <span onClick={() => setSearchText("")} style={{ cursor:"pointer", color:"#94a3b8", fontSize:18, lineHeight:1 }}>×</span>
              )}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display:"flex", gap:12, marginBottom:28, flexWrap:"wrap" }}>
            <StatCard label="Total Subjects" value={stats.total}    dark={isDark} accent="#6366f1" delay={0}   icon={<BookIco c="#6366f1"/>}/>
            <StatCard label="Active"          value={stats.active}   dark={isDark} accent="#22c55e" delay={60}  icon={<CheckIco c="#22c55e"/>}/>
            <StatCard label="Global"          value={stats.global}   dark={isDark} accent="#3b82f6" delay={120} icon={<GlobeIco c="#3b82f6"/>}/>
            <StatCard label="Inactive"        value={stats.inactive} dark={isDark} accent="#f43f5e" delay={180} icon={<XIco c="#f43f5e"/>}/>
          </div>

          {/* GRID */}
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:80 }}>
              <Spin size="large"/>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign:"center", padding:"80px 20px", borderRadius:24,
              background:isDark?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.6)",
              border:`1px dashed ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.09)"}`,
            }}>
              <div style={{ fontSize:52, marginBottom:14 }}>📚</div>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Syne',sans-serif", color:isDark?"#f1f5f9":"#0f172a" }}>
                No subjects found
              </div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:6 }}>
                {searchText ? `No results for "${searchText}"` : "No subjects added yet"}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:12, color:"#64748b", fontWeight:500, marginBottom:16 }}>
                Showing{" "}
                <strong style={{ color:isDark?"#a5b4fc":"#4f46e5" }}>{filtered.length}</strong>
                {" "}of {safe.length} subjects
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                {filtered.map((item, i) => (
                  <SubjectCard key={item?._id || i} item={item} idx={i} dark={isDark}/>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Subjects;
