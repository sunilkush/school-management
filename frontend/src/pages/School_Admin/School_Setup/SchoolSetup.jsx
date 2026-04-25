import React, { lazy, Suspense, useState } from "react";
import { Typography, Skeleton } from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  PlusOutlined,
  CheckCircleFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../context/ThemeContext.jsx";
import { User } from "lucide-react";

const { Text } = Typography;

// ── Lazy components ──
const SchoolClass        = lazy(() => import("./SchoolClass.jsx"));
const SchoolBoard        = lazy(() => import("./SchoolBoard.jsx"));
const SchoolAcademicYear  = lazy(() => import("./SchoolAcademicYear.jsx"));
const SchoolClassSubject = lazy(() => import("./SchoolClassSubject.jsx"));
const SchoolClassSectionTeacher = lazy(() => import("./SchoolClassSectionTeacher.jsx"));
/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
const tokens = (isDark) => ({
  pageBg:      isDark ? "#0d0d0d"  : "#f5f6fa",
  cardBg:      isDark ? "#141414"  : "#ffffff",
  border:      isDark ? "#1f1f1f"  : "#f0f0f0",
  sectionBg:   isDark ? "#0f0f0f"  : "#f8faff",
  textPri:     isDark ? "#e8e8e8"  : "#111827",
  textSec:     isDark ? "#6b7280"  : "#9ca3af",
  accent:      "#1677ff",
  accentBg:    isDark ? "rgba(22,119,255,0.10)" : "rgba(22,119,255,0.07)",
  accentBorder:isDark ? "rgba(22,119,255,0.25)" : "rgba(22,119,255,0.2)",
  success:     "#0ea472",
  successBg:   isDark ? "rgba(14,164,114,0.10)" : "rgba(14,164,114,0.07)",
  connectorBg: isDark ? "#2a2a2a"  : "#e5e7eb",
  shadow:      isDark ? "0 2px 20px rgba(0,0,0,0.4)" : "0 2px 20px rgba(0,0,0,0.07)",
});

/* ─────────────────────────────────────────
   Step config
───────────────────────────────────────── */
const STEPS = [
  {
    key: "1",
    title: "Academic Year",
    desc: "Set up the current academic year",
    icon: CalendarOutlined,
    color: "#1677ff",
  },
  {
    key: "2",
    title: "Boards",
    desc: "Define examination boards",
    icon: ApartmentOutlined,
    color: "#7c3aed",
  },
  {
    key: "3",
    title: "Classes",
    desc: "Configure class levels",
    icon: AppstoreOutlined,
    color: "#0891b2",
  },
  {
    key: "4",
    title: "Subjects",
    desc: "Add subjects per class",
    icon: PlusOutlined,
    color: "#0ea472",
  },
  {
    key: "5",
    title: "Teachers",
    desc: "Add teachers to classes",
    icon: UserOutlined,
    color: "#0ea472",
  },
];

/* ─────────────────────────────────────────
   Skeleton fallback
───────────────────────────────────────── */
const StepSkeleton = ({ isDark }) => {
  // eslint-disable-next-line no-unused-vars
  const t = tokens(isDark);
  return (
    <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton active title={{ width: "30%" }} paragraph={{ rows: 1, width: ["60%"] }} />
      <div style={{ display: "flex", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton.Button
            key={i} active
            style={{ flex: 1, height: 80, borderRadius: 10 }}
          />
        ))}
      </div>
      <Skeleton active paragraph={{ rows: 3 }} />
    </div>
  );
};

/* ─────────────────────────────────────────
   Custom stepper
───────────────────────────────────────── */
const StepNav = ({ steps, activeKey, completedKeys, onStep, isDark }) => {
  const t = tokens(isDark);
  // eslint-disable-next-line no-unused-vars
  const activeIdx = steps.findIndex((s) => s.key === activeKey);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((step, i) => {
        const Icon     = step.icon;
        const isActive = step.key === activeKey;
        const isDone   = completedKeys.includes(step.key);
        const isLast   = i === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            {/* Step node */}
            <button
              onClick={() => isDone || isActive ? onStep(step.key) : null}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                cursor: isDone || isActive ? "pointer" : "default",
                padding: "0 4px",
                flex: "0 0 auto",
                minWidth: 80,
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.22s ease",
                ...(isDone ? {
                  background: t.successBg,
                  border: `2px solid ${t.success}`,
                  color: t.success,
                } : isActive ? {
                  background: t.accentBg,
                  border: `2px solid ${t.accent}`,
                  color: t.accent,
                  boxShadow: `0 0 0 4px ${t.accentBg}`,
                } : {
                  background: isDark ? "#1a1a1a" : "#f3f4f6",
                  border: `2px solid ${t.connectorBg}`,
                  color: t.textSec,
                }),
              }}>
                {isDone
                  ? <CheckCircleFilled style={{ fontSize: 18 }} />
                  : <Icon />
                }
              </div>

              {/* Labels */}
              <div style={{ textAlign: "center" }}>
                <Text style={{
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isDone ? t.success : isActive ? t.accent : t.textSec,
                  display: "block",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                }}>
                  {step.title}
                </Text>
                {isActive && (
                  <Text style={{ fontSize: 10, color: t.textSec, display: "block", marginTop: 1 }}>
                    {step.desc}
                  </Text>
                )}
              </div>
            </button>

            {/* Connector */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: 2,
                marginBottom: 28,
                borderRadius: 99,
                background: isDone
                  ? `linear-gradient(90deg, ${t.success}, ${t.success}80)`
                  : t.connectorBg,
                transition: "background 0.4s ease",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────
   Tab bar
───────────────────────────────────────── */
const TabBar = ({ steps, activeKey, completedKeys, onTab, isDark }) => {
  const t = tokens(isDark);
  return (
    <div style={{
      display: "flex",
      gap: 4,
      background: isDark ? "#0f0f0f" : "#f3f4f6",
      borderRadius: 10,
      padding: 4,
      marginBottom: 24,
      overflowX: "auto",
    }}>
      {steps.map((step) => {
        const isActive = step.key === activeKey;
        const isDone   = completedKeys.includes(step.key);
        const Icon     = step.icon;
        const canClick = isDone || isActive;

        return (
          <button
            key={step.key}
            onClick={() => canClick && onTab(step.key)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 7,
              border: "none",
              fontSize: 12.5,
              fontWeight: isActive ? 600 : 500,
              cursor: canClick ? "pointer" : "not-allowed",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
              ...(isActive ? {
                background: t.cardBg,
                color: t.accent,
                boxShadow: isDark
                  ? "0 1px 4px rgba(0,0,0,0.4)"
                  : "0 1px 4px rgba(0,0,0,0.1)",
              } : isDone ? {
                background: "transparent",
                color: t.success,
              } : {
                background: "transparent",
                color: t.textSec,
                opacity: 0.6,
              }),
            }}
          >
            {isDone && !isActive
              ? <CheckCircleFilled style={{ fontSize: 12, color: t.success }} />
              : <Icon style={{ fontSize: 12 }} />
            }
            {step.title}
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────
   Main SchoolSetup
───────────────────────────────────────── */
const SchoolSetup = () => {
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const [activeKey, setActiveKey]     = useState("1");
  const [completed, setCompleted]     = useState([]);

  const goTo = (key) => setActiveKey(key);

  const advance = (fromKey) => {
    if (!completed.includes(fromKey)) {
      setCompleted((prev) => [...prev, fromKey]);
    }
    const nextIdx = STEPS.findIndex((s) => s.key === fromKey) + 1;
    if (nextIdx < STEPS.length) setActiveKey(STEPS[nextIdx].key);
  };

  const activeStep = STEPS.find((s) => s.key === activeKey);
  const StepIcon   = activeStep.icon;

  return (
    <>
      <style>{`
        
        .setup-panel {
          animation: setupFade 0.25s ease forwards;
        }
        @keyframes setupFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ padding: "24px" }}>
        {/* Page header */}
        <div style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: t.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: t.accentBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppstoreOutlined style={{ fontSize: 18, color: t.accent }} />
            </div>
            <div>
              <Text style={{ fontSize: 15, fontWeight: 700, color: t.textPri, display: "block" }}>
                School Setup
              </Text>
              <Text style={{ fontSize: 12, color: t.textSec }}>
                Configure your school in {STEPS.length} steps
              </Text>
            </div>
          </div>

          {/* Progress pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isDark ? "#1a1a1a" : "#f3f4f6",
            padding: "6px 14px",
            borderRadius: 99,
          }}>
            <div style={{
              width: 28, height: 4, borderRadius: 99,
              background: isDark ? "#2a2a2a" : "#e5e7eb",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${((completed.length) / STEPS.length) * 100}%`,
                background: t.success,
                borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </div>
            <Text style={{ fontSize: 11.5, fontWeight: 600, color: t.textSec }}>
              {completed.length}/{STEPS.length} done
            </Text>
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: "24px 24px 20px",
          boxShadow: t.shadow,
        }}>
          {/* Stepper (desktop) */}
          <div className="setup-stepper-desktop">
            <StepNav
              steps={STEPS}
              activeKey={activeKey}
              completedKeys={completed}
              onStep={goTo}
              isDark={isDark}
            />
          </div>

          {/* Tab bar (compact) */}
          <div className="setup-tabbar">
            <TabBar
              steps={STEPS}
              activeKey={activeKey}
              completedKeys={completed}
              onTab={goTo}
              isDark={isDark}
              style={{ overflow: "auto" }}
            />
          </div>

          {/* Active step label */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `1px solid ${t.border}`,
            
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: t.accentBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <StepIcon style={{ fontSize: 14, color: t.accent }} />
            </div>
            <div>
              <Text style={{ fontSize: 13.5, fontWeight: 700, color: t.textPri, display: "block" }}>
                {activeStep.title}
              </Text>
              <Text style={{ fontSize: 11.5, color: t.textSec }}>{activeStep.desc}</Text>
            </div>
            <div style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 600,
              color: t.textSec,
              background: isDark ? "#1a1a1a" : "#f3f4f6",
              padding: "3px 9px",
              borderRadius: 99,
            }}>
              Step {activeKey} of {STEPS.length}
            </div>
          </div>

          {/* Content panel */}
          <div className="setup-panel" key={activeKey}>
            <Suspense fallback={<StepSkeleton isDark={isDark} />}>
              {activeKey === "1" && <SchoolAcademicYear  next={() => advance("1")} />}
              {activeKey === "2" && <SchoolBoard         next={() => advance("2")} />}
              {activeKey === "3" && <SchoolClass         next={() => advance("3")} />}
              {activeKey === "4" && <SchoolClassSubject next={() => advance("4")} />}
              {activeKey === "5" && (
                <SchoolClassSectionTeacher next={() => advance("5")} />
              )}
            </Suspense>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .setup-stepper-desktop { display: none; }
          .setup-tabbar          { display: block; }
        }
        @media (min-width: 641px) {
          .setup-stepper-desktop { display: block; }
          .setup-tabbar          { display: none; }
        }
      `}</style>
    </>
  );
};

export default SchoolSetup;