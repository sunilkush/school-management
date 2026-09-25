import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Typography, Skeleton, Progress } from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  BookOutlined,
  CheckCircleFilled,
  UserOutlined,
} from "@ant-design/icons";

import { fetchAllAcademicYears } from "../../../features/academicYearSlice";
import { getSchoolBoards } from "../../../features/boardSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";

const { Text, Title } = Typography;

const SchoolClass              = lazy(() => import("./SchoolClass.jsx"));
const SchoolBoard              = lazy(() => import("./SchoolBoard.jsx"));
const SchoolAcademicYear       = lazy(() => import("./SchoolAcademicYear.jsx"));
const SchoolClassSubject       = lazy(() => import("./SchoolClassSubject.jsx"));
const SchoolClassSectionTeacher = lazy(() => import("./SchoolClassSectionTeacher.jsx"));

const C = { primary: "var(--primary)", success: "var(--success)" };

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
            onClick={() => onStep(step.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              cursor: "pointer",
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
                background: "rgba(var(--primary-rgb),0.12)", border: `2px solid ${C.primary}`, color: C.primary,
                boxShadow: "0 0 0 4px rgba(var(--primary-rgb),0.08)",
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

      return (
        <button
          key={step.key}
          onClick={() => onTab(step.key)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 12px", borderRadius: 7, border: "none",
            fontSize: 12.5, fontWeight: isActive ? 600 : 500,
            cursor: "pointer",
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
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState(null);

  const user = useSelector((s) => s.auth?.user);
  const schoolId = user?.school?._id;
  const { academicYears = [], activeYear, selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { schoolBoards = [] } = useSelector((s) => s.boards || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections = [] } = useSelector((s) => s.section || {});

  const academicYearId = selectedAcademicYear?._id || activeYear?._id;

  /* A step is done when the school HAS the thing, not when someone pressed Next during this visit.
     Before this, a school that finished its setup months ago still came back to "0/5 steps done"
     and five grey circles. */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(getSchoolBoards(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchSections({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const completed = useMemo(() => {
    const done = [];
    if (academicYears.length) done.push("1");
    if (schoolBoards.length) done.push("2");
    if (schoolClasses.length) done.push("3");
    if (sections.some((s) => (s.subjects || []).length)) done.push("4");
    if (sections.some((s) => s.classTeacherId)) done.push("5");
    return done;
  }, [academicYears, schoolBoards, schoolClasses, sections]);

  /* Which step to show, until the person picks one themselves: the first one still to do, so a
     half-finished setup carries on where it stopped. Derived rather than stored — the five answers
     arrive one at a time, and a stored choice made on a half-loaded picture opened a finished
     school on step 2 or 3, whichever had answered first. Once they click, their choice stands. */
  const firstUndone = STEPS.find((s) => !completed.includes(s.key))?.key ?? "1";
  const currentKey  = activeKey ?? firstUndone;

  const goTo    = (key) => setActiveKey(key);
  const advance = (fromKey) => {
    const nextIdx = STEPS.findIndex((s) => s.key === fromKey) + 1;
    if (nextIdx < STEPS.length) setActiveKey(STEPS[nextIdx].key);
  };
  const activeStep  = STEPS.find((s) => s.key === currentKey);
  const StepIcon    = activeStep.icon;
  const progressPct = Math.round((completed.length / STEPS.length) * 100);
  const allDone     = completed.length === STEPS.length;

  return (
    <>
      
      <div style={{ minHeight: "100dvh", padding: 24, background: "var(--bg)" }}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="pastel-hero-banner" style={{ marginBottom: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg,var(--primary) 0%,var(--primary-hover) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(var(--primary-rgb),0.35)",
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
              <Text style={{ fontSize: 11, color: allDone ? C.success : "var(--text-muted)", display: "block", marginBottom: 4, fontWeight: allDone ? 600 : 400 }}>
                {allDone
                  ? "Setup complete"
                  : `${completed.length} of ${STEPS.length} done · on step ${currentKey}`}
              </Text>
              <Progress
                percent={progressPct}
                size="small"
                strokeColor={allDone ? C.success : C.primary}
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
            <StepNav steps={STEPS} activeKey={currentKey} completedKeys={completed} onStep={goTo} />
          </div>

          {/* Tab bar — mobile */}
          <div className="setup-tabbar" style={{ display: "none" }}>
            <TabBar steps={STEPS} activeKey={currentKey} completedKeys={completed} onTab={goTo} />
          </div>

          {/* One line about the step in hand. The stepper above already names it, so this says the
              thing the stepper cannot: what this step is for, and whether it is already done. */}
          <div className="setup-step-line">
            <div className="setup-step-icon">
              <StepIcon style={{ fontSize: 16, color: C.primary }} />
            </div>
            <Text type="secondary" style={{ fontSize: 12.5 }}>{activeStep.desc}</Text>
            <span className={`setup-step-chip${completed.includes(currentKey) ? " is-done" : ""}`}>
              {completed.includes(currentKey)
                ? <><CheckCircleFilled style={{ fontSize: 11 }} /> Done</>
                : `Step ${currentKey} of ${STEPS.length}`}
            </span>
          </div>

          {/* Content panel */}
          <div className="setup-panel" key={currentKey}>
            <Suspense fallback={<StepSkeleton />}>
              {currentKey === "1" && <SchoolAcademicYear       next={() => advance("1")} />}
              {currentKey === "2" && <SchoolBoard              next={() => advance("2")} />}
              {currentKey === "3" && <SchoolClass              next={() => advance("3")} />}
              {currentKey === "4" && <SchoolClassSubject       next={() => advance("4")} />}
              {currentKey === "5" && <SchoolClassSectionTeacher next={() => advance("5")} />}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolSetup;
