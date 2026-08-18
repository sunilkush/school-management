import React, { lazy, Suspense, useState } from "react";
import { Typography, Skeleton, Progress } from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  BookOutlined,
  CheckCircleFilled,
  UserOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const SchoolClass              = lazy(() => import("./SchoolClass.jsx"));
const SchoolBoard              = lazy(() => import("./SchoolBoard.jsx"));
const SchoolAcademicYear       = lazy(() => import("./SchoolAcademicYear.jsx"));
const SchoolClassSubject       = lazy(() => import("./SchoolClassSubject.jsx"));
const SchoolClassSectionTeacher = lazy(() => import("./SchoolClassSectionTeacher.jsx"));

const C = { primary: "var(--purple)", success: "var(--success)" };

const STEPS = [
  { key: "1", title: "Academic Year", desc: "Set up the current academic year",   icon: CalendarOutlined  },
  { key: "2", title: "Boards",        desc: "Define examination boards",           icon: ApartmentOutlined },
  { key: "3", title: "Classes",       desc: "Configure class levels & sections",   icon: AppstoreOutlined  },
  { key: "4", title: "Subjects",      desc: "Add subjects per section",            icon: BookOutlined      },
  { key: "5", title: "Teachers",      desc: "Assign class teachers",               icon: UserOutlined      },
];

/* ─── Skeleton ───────────────────────────────────────────────── */
const StepSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
    <Skeleton active title={{ width: "30%" }} paragraph={{ rows: 1, width: ["60%"] }} />
    <div style={{ display: "flex", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <Skeleton.Button key={i} active style={{ flex: 1, height: 80, borderRadius: 10 }} />
      ))}
    </div>
    <Skeleton active paragraph={{ rows: 3 }} />
  </div>
);

/* ─── Desktop stepper ────────────────────────────────────────── */
const StepNav = ({ steps, activeKey, completedKeys, onStep }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
    {steps.map((step, i) => {
      const Icon     = step.icon;
      const isActive = step.key === activeKey;
      const isDone   = completedKeys.includes(step.key);
      const isLast   = i === steps.length - 1;

      return (
        <React.Fragment key={step.key}>
          <button
            onClick={() => (isDone || isActive) && onStep(step.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              cursor: isDone || isActive ? "pointer" : "default",
              padding: "0 4px", flex: "0 0 auto", minWidth: 80,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, transition: "all 0.22s ease",
              ...(isDone ? {
                background: "rgba(var(--success-rgb),0.12)", border: `2px solid ${C.success}`, color: C.success,
              } : isActive ? {
                background: "rgba(var(--purple-rgb),0.12)", border: `2px solid ${C.primary}`, color: C.primary,
                boxShadow: "0 0 0 4px rgba(var(--purple-rgb),0.08)",
              } : {
                background: "var(--surface-soft)", border: "2px solid var(--border)", color: "var(--text-muted)",
              }),
            }}>
              {isDone ? <CheckCircleFilled style={{ fontSize: 18 }} /> : <Icon />}
            </div>
            <div style={{ textAlign: "center" }}>
              <Text style={{
                fontSize: 11.5, fontWeight: isActive ? 700 : 500, display: "block",
                lineHeight: 1.3, whiteSpace: "nowrap",
                color: isDone ? C.success : isActive ? C.primary : "var(--text-muted)",
              }}>
                {step.title}
              </Text>
              {isActive && (
                <Text style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginTop: 1 }}>
                  {step.desc}
                </Text>
              )}
            </div>
          </button>
          {!isLast && (
            <div style={{
              flex: 1, height: 2, marginBottom: 28, borderRadius: 99,
              background: isDone
                ? `linear-gradient(90deg,${C.success},rgba(var(--success-rgb),0.5))`
                : "var(--border)",
              transition: "background 0.4s ease",
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─── Mobile tab bar ─────────────────────────────────────────── */
const TabBar = ({ steps, activeKey, completedKeys, onTab }) => (
  <div style={{
    display: "flex", gap: 4, background: "var(--surface-soft)",
    borderRadius: 10, padding: 4, marginBottom: 24, overflowX: "auto",
  }}>
    {steps.map((step) => {
      const isActive  = step.key === activeKey;
      const isDone    = completedKeys.includes(step.key);
      const Icon      = step.icon;
      const canClick  = isDone || isActive;

      return (
        <button
          key={step.key}
          onClick={() => canClick && onTab(step.key)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 12px", borderRadius: 7, border: "none",
            fontSize: 12.5, fontWeight: isActive ? 600 : 500,
            cursor: canClick ? "pointer" : "not-allowed",
            transition: "all 0.18s ease", whiteSpace: "nowrap",
            ...(isActive ? {
              background: "var(--surface)", color: C.primary,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            } : isDone ? {
              background: "transparent", color: C.success,
            } : {
              background: "transparent", color: "var(--text-muted)", opacity: 0.6,
            }),
          }}
        >
          {isDone && !isActive
            ? <CheckCircleFilled style={{ fontSize: 12, color: C.success }} />
            : <Icon style={{ fontSize: 12 }} />
          }
          {step.title}
        </button>
      );
    })}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   SchoolSetup
════════════════════════════════════════════════════════════════ */
const SchoolSetup = () => {
  const [activeKey, setActiveKey] = useState("1");
  const [completed, setCompleted] = useState([]);

  const goTo    = (key) => setActiveKey(key);
  const advance = (fromKey) => {
    if (!completed.includes(fromKey)) setCompleted((p) => [...p, fromKey]);
    const nextIdx = STEPS.findIndex((s) => s.key === fromKey) + 1;
    if (nextIdx < STEPS.length) setActiveKey(STEPS[nextIdx].key);
  };

  const activeStep = STEPS.find((s) => s.key === activeKey);
  const StepIcon   = activeStep.icon;
  const progressPct = Math.round((completed.length / STEPS.length) * 100);

  return (
    <>
      <style>{`
        .setup-panel { animation: setupFade 0.25s ease forwards; }
        @keyframes setupFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 640px)  { .setup-stepper-desktop { display:none!important; } .setup-tabbar { display:block!important; } }
        @media (min-width: 641px)  { .setup-stepper-desktop { display:block!important; } .setup-tabbar { display:none!important; } }
      `}</style>

      <div style={{ minHeight: "100dvh", padding: 24, background: "var(--bg)" }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="pastel-hero-banner" style={{ marginBottom: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg,var(--purple) 0%,var(--purple-hover) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(var(--purple-rgb),0.35)",
              }}>
                <AppstoreOutlined style={{ fontSize: 22, color: "#fff" }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: "var(--text)" }}>School Setup</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Configure your school in {STEPS.length} steps
                </Text>
              </div>
            </div>

            <div style={{
              background: "var(--surface)", borderRadius: 12, padding: "10px 16px",
              border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)",
            }}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                {completed.length}/{STEPS.length} steps done
              </Text>
              <Progress
                percent={progressPct}
                size="small"
                strokeColor={progressPct === 100 ? C.success : C.primary}
                trailColor="var(--border)"
                showInfo={false}
                style={{ width: 130, margin: 0 }}
              />
            </div>
          </div>
        </div>

        {/* ── Main card ───────────────────────────────────────── */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "24px 24px 20px",
          boxShadow: "var(--shadow-soft)",
        }}>
          {/* Stepper — desktop */}
          <div className="setup-stepper-desktop">
            <StepNav steps={STEPS} activeKey={activeKey} completedKeys={completed} onStep={goTo} />
          </div>

          {/* Tab bar — mobile */}
          <div className="setup-tabbar" style={{ display: "none" }}>
            <TabBar steps={STEPS} activeKey={activeKey} completedKeys={completed} onTab={goTo} />
          </div>

          {/* Active step label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "rgba(var(--purple-rgb),0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <StepIcon style={{ fontSize: 16, color: C.primary }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 13.5, color: "var(--text)", display: "block" }}>{activeStep.title}</Text>
              <Text type="secondary" style={{ fontSize: 11.5 }}>{activeStep.desc}</Text>
            </div>
            <div style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600,
              color: "var(--text-muted)", background: "var(--surface-soft)",
              padding: "3px 10px", borderRadius: 99,
            }}>
              Step {activeKey} of {STEPS.length}
            </div>
          </div>

          {/* Content panel */}
          <div className="setup-panel" key={activeKey}>
            <Suspense fallback={<StepSkeleton />}>
              {activeKey === "1" && <SchoolAcademicYear       next={() => advance("1")} />}
              {activeKey === "2" && <SchoolBoard              next={() => advance("2")} />}
              {activeKey === "3" && <SchoolClass              next={() => advance("3")} />}
              {activeKey === "4" && <SchoolClassSubject       next={() => advance("4")} />}
              {activeKey === "5" && <SchoolClassSectionTeacher next={() => advance("5")} />}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolSetup;
