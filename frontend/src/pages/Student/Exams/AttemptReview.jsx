import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Empty, Progress, Spin, Tag } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getAttemptById } from "../../../features/attemptSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, pageWrapper, sectionPanel, statGrid } from "../../../styles/pageStyles";

/* ── helpers ── */
const resolveQuestionText = (ans, idx) => {
  const snap = ans?.snapshot || ans?.questionSnapshot || ans?.questionRef || {};
  return snap?.statement || snap?.questionText || snap?.title || `Question ${idx + 1}`;
};

const resolveMaxMarks = (ans) => {
  const snap = ans?.snapshot || ans?.questionSnapshot || ans?.questionRef || {};
  return Number(ans?.maxMarks ?? snap?.marks ?? snap?.points ?? 0) || 0;
};

const formatAnswer = (ans) => {
  const raw = ans?.answer ?? ans?.response;
  if (raw === null || raw === undefined) return "—";
  if (Array.isArray(raw))   return raw.filter(Boolean).join(", ") || "—";
  if (typeof raw === "object") return raw.text || raw.value || JSON.stringify(raw);
  return `${raw}`.trim() || "—";
};

const GRADE_COLOR = {
  "A+": "var(--purple)", A: "var(--cyan)", B: "var(--success-hover)",
  C:  "var(--warning-hover)", D: "var(--danger-hover)", F: "#7F1D1D",
};

// Companion tint backgrounds for GRADE_COLOR (kept in sync manually since the
// `${color}22` hex-alpha trick used elsewhere doesn't work with CSS var() values).
const GRADE_BG = {
  "A+": "rgba(var(--purple-rgb),0.15)",
  A: "rgba(8,145,178,0.15)",
  B: "var(--success-light)",
  C: "var(--warning-light)",
  D: "var(--danger-light)",
  F: "rgba(127,29,29,0.15)",
};

const StatusMeta = (status) => {
  if (status === "evaluated") return { color: "var(--success-hover)", bg: "var(--success-light)", label: "Evaluated" };
  if (status === "submitted") return { color: "var(--primary-hover)", bg: "var(--primary-light)", label: "Submitted" };
  return { color: "var(--warning-hover)", bg: "var(--warning-light)", label: "In Progress" };
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 14, padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <div style={iconWell(color, 40)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Main ── */
const AttemptReview = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const attemptId = useMemo(() => new URLSearchParams(location.search).get("attemptId"), [location.search]);
  const { currentAttempt: attempt, loading, error } = useSelector((s) => s.attempts || {});

  useEffect(() => {
    if (attemptId) dispatch(getAttemptById(attemptId));
  }, [attemptId, dispatch]);

  const answers   = Array.isArray(attempt?.answers) ? attempt.answers : [];
  const sm        = StatusMeta(attempt?.status);

  const stats = useMemo(() => {
    if (!attempt) return null;
    const evaled   = answers.filter((a) => a?.isCorrect !== null && a?.isCorrect !== undefined);
    const correct  = evaled.filter((a) => a.isCorrect).length;
    const answered = answers.filter((a) => {
      const v = a?.answer ?? a?.response;
      if (Array.isArray(v)) return v.length > 0;
      if (v && typeof v === "object") return Object.keys(v).length > 0;
      return v !== null && v !== undefined && `${v}`.trim() !== "";
    }).length;
    const possible  = answers.reduce((s, a) => s + resolveMaxMarks(a), 0);
    const obtained  = Number(attempt?.totalMarksObtained ?? attempt?.totalObtainedMarks ?? 0) || 0;
    const pct       = possible ? Math.round((obtained / possible) * 100) : 0;
    return { total: answers.length, answered, correct, evaled: evaled.length, possible, obtained, pct };
  }, [attempt, answers]);

  /* ── States ── */
  if (!attemptId) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <Empty description="Attempt ID missing. Open review from Exam Hub." />
    </div>
  );

  if (loading && !attempt) return (
    <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Spin size="large" />
    </div>
  );

  if (!attempt) return (
    <div style={pageWrapper}>
      <Empty description="Attempt not found" />
    </div>
  );

  const grade = attempt?.grade;
  const gc    = GRADE_COLOR[grade] || "var(--text-secondary)";
  const pct   = stats?.pct ?? 0;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Attempt Review"
        subtitle={attempt?.examId?.title || "Exam Review"}
        icon={<FileTextOutlined />}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/student/exams")}>
            Back to Hub
          </Button>
        }
      />

      {error && (
        <Alert type="warning" showIcon message={error} style={{ marginTop: 16, borderRadius: 12 }} closable />
      )}

      {/* ── Score card ── */}
      <div style={{
        ...sectionPanel, marginTop: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {/* Circle progress */}
          <Progress
            type="circle"
            percent={pct}
            size={110}
            strokeColor={pct >= 60 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)"}
            trailColor="var(--border-muted)"
            format={() => (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{pct}%</div>
                {grade && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: gc, marginTop: 4 }}>{grade}</div>
                )}
              </div>
            )}
          />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              {attempt?.examId?.title || "Exam"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
                background: sm.bg, color: sm.color, padding: "3px 10px", borderRadius: 99,
              }}>
                {sm.label}
              </span>
              {grade && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
                  background: GRADE_BG[grade] || "transparent", color: gc, padding: "3px 10px", borderRadius: 99,
                }}>
                  Grade {grade}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
              {stats?.obtained ?? 0} / {stats?.possible ?? 0} marks obtained
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Score</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{pct}%</span>
          </div>
          <Progress
            percent={pct} showInfo={false}
            strokeColor={pct >= 60 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)"}
            trailColor="var(--border-muted)"
          />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ ...statGrid(130), marginTop: 0 }}>
        <StatCard icon={<FileTextOutlined />}    label="Questions"  value={stats?.total ?? 0}    color="var(--purple)" />
        <StatCard icon={<CheckCircleOutlined />} label="Answered"   value={stats?.answered ?? 0} color="var(--cyan)" sub={`${(stats?.total ?? 0) - (stats?.answered ?? 0)} skipped`} />
        <StatCard icon={<TrophyOutlined />}      label="Correct"    value={`${stats?.correct ?? 0}/${stats?.evaled ?? 0}`} color="var(--success-hover)" />
        <StatCard icon={<ClockCircleOutlined />} label="Submitted"  value={attempt?.submittedAt ? dayjs(attempt.submittedAt).format("hh:mm A") : "Pending"} color="var(--warning-hover)" sub={attempt?.submittedAt ? dayjs(attempt.submittedAt).format("DD MMM YYYY") : ""} />
      </div>

      {/* ── Question-wise Review ── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={iconWell("var(--primary)", 34)}><FileTextOutlined /></div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
            Question-wise Review
          </span>
        </div>

        {!answers.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No answers found" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {answers.map((ans, i) => {
              const maxMks  = resolveMaxMarks(ans);
              const gotMks  = Number(ans?.marksObtained ?? 0) || 0;
              const hasEval = ans?.isCorrect !== null && ans?.isCorrect !== undefined;
              const correct = Boolean(ans?.isCorrect);
              const text    = resolveQuestionText(ans, i);
              const snap    = ans?.snapshot || ans?.questionSnapshot || ans?.questionRef || {};
              const type    = snap?.questionType || snap?.type || "subjective";

              return (
                <div
                  key={ans?._id || i}
                  style={{
                    border: `1px solid ${hasEval ? (correct ? "var(--success-light)" : "var(--danger-light)") : "var(--border-muted)"}`,
                    borderLeft: `4px solid ${hasEval ? (correct ? "var(--success)" : "var(--danger)") : "var(--border-muted)"}`,
                    borderRadius: 12, padding: "14px 16px",
                    background: hasEval ? (correct ? "rgba(220,252,231,0.1)" : "rgba(254,226,226,0.1)") : "var(--surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: "var(--primary)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 12,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(124,58,237,0.1)", color: "var(--primary)", padding: "2px 7px", borderRadius: 99 }}>
                        {type}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                        {gotMks} / {maxMks} marks
                      </span>
                      {hasEval ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
                          background: correct ? "var(--success-light)" : "var(--danger-light)",
                          color:      correct ? "var(--success-hover)" : "var(--danger-hover)",
                          padding: "2px 10px", borderRadius: 99,
                        }}>
                          {correct ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          {correct ? "Correct" : "Incorrect"}
                        </span>
                      ) : (
                        <Tag color="default" style={{ margin: 0 }}>Pending</Tag>
                      )}
                      {ans?.flagged && <Tag color="orange" style={{ margin: 0 }}>Flagged</Tag>}
                    </div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.5 }}>
                    {text}
                  </div>

                  <div style={{
                    fontSize: 13, color: "var(--text-muted)", padding: "8px 12px",
                    background: "var(--surface-soft, var(--surface-page))", borderRadius: 8,
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", marginRight: 6 }}>Your answer:</span>
                    {formatAnswer(ans)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttemptReview;
