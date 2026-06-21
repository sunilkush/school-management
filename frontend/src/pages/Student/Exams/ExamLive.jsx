import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Empty, Modal, Spin, Tag, message } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import QuestionCard from "./components/QuestionCard";
import ExamTimer from "./components/ExamTimer";
import AutosaveIndicator from "./components/AutosaveIndicator";
import { autosaveAnswer, getAttemptById, submitAttempt } from "../../../features/attemptSlice";

/* ── helpers ── */
const resolveQuestionId = (q) => q?.questionRef?._id || q?.questionRef || q?.questionId;

const normalizeQuestion = (answerItem) => {
  const snap = answerItem?.snapshot || answerItem?.questionSnapshot || answerItem?.questionRef || {};
  return {
    ...answerItem,
    _id:     resolveQuestionId(answerItem),
    text:    snap?.statement || snap?.questionText || snap?.title || "Untitled Question",
    type:    snap?.questionType || snap?.type || "subjective",
    options: snap?.options || [],
    marks:   snap?.marks ?? 0,
  };
};

const isAnswered = (val) => {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.trim() !== "";
  return true;
};

/* ── Question Navigator ── */
const QuestionNav = ({ questions, answers, onNavigate }) => {
  const answeredCount = questions.filter((q) => isAnswered(answers[q._id])).length;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-muted)",
      borderRadius: 14, padding: "14px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
          Questions
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ color: "#22C55E", fontWeight: 700 }}>{answeredCount}</span>
          {" / "}
          {questions.length} answered
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {questions.map((q, i) => {
          const answered = isAnswered(answers[q._id]);
          return (
            <button
              key={q._id || i}
              onClick={() => onNavigate(i)}
              style={{
                width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                fontWeight: 700, fontSize: 13, border: "none", outline: "none",
                background: answered ? "#22C55E" : "var(--surface-soft, #f8fafc)",
                color:      answered ? "#fff" : "var(--text-muted)",
                boxShadow:  answered ? "0 2px 6px rgba(34,197,94,0.3)" : "inset 0 0 0 1px var(--border-muted)",
                transition: "all 0.15s",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main component ── */
const ExamLive = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const attemptId  = useMemo(() => new URLSearchParams(location.search).get("attemptId"), [location.search]);
  const { currentAttempt, loading } = useSelector((s) => s.attempts || {});

  const [answers,        setAnswers]        = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState("idle");
  const [submitting,     setSubmitting]     = useState(false);
  const autosaveTimerRef = useRef();
  const questionRefs     = useRef([]);

  /* fetch attempt */
  useEffect(() => {
    if (attemptId) dispatch(getAttemptById(attemptId));
  }, [attemptId, dispatch]);

  /* hydrate saved answers */
  useEffect(() => {
    if (!currentAttempt?.answers?.length) return;
    const mapped = currentAttempt.answers.reduce((acc, row) => {
      const key = resolveQuestionId(row);
      if (key) acc[key] = row.answer ?? row.response ?? null;
      return acc;
    }, {});
    setAnswers(mapped);
  }, [currentAttempt]);

  /* cleanup debounce */
  useEffect(() => () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); }, []);

  const questions = useMemo(() => {
    if (!currentAttempt?.answers?.length) return [];
    return currentAttempt.answers.map(normalizeQuestion);
  }, [currentAttempt]);

  /* ── Remaining time calculation (fixes resume timer) ── */
  const remainingSeconds = useMemo(() => {
    if (!currentAttempt) return null;
    const totalSec = (currentAttempt.examId?.durationMinutes || 30) * 60;
    if (!currentAttempt.startedAt) return totalSec;
    const elapsed = dayjs().diff(dayjs(currentAttempt.startedAt), "second");
    return Math.max(0, totalSec - elapsed);
  }, [currentAttempt]);

  const handleAnswerChange = (qid, answer) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }));
    setAutosaveStatus("saving");
    if (!attemptId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      dispatch(autosaveAnswer({ attemptId, questionId: qid, answer }))
        .unwrap()
        .then(() => setAutosaveStatus("saved"))
        .catch(() => setAutosaveStatus("error"));
    }, 350);
  };

  const scrollToQuestion = (idx) => {
    questionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const buildPayload = () =>
    questions.map((q) => ({
      questionId: `${q._id}`,
      response:   answers[q._id] ?? null,
    }));

  const doSubmit = async () => {
    if (!attemptId) { message.error("Attempt ID missing"); return; }
    try {
      setSubmitting(true);
      await dispatch(submitAttempt({ attemptId, answers: buildPayload() })).unwrap();
      message.success("Exam submitted successfully!");
      navigate(`/dashboard/student/exams/attempt-review?attemptId=${attemptId}`);
    } catch (err) {
      message.error(typeof err === "string" ? err : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    const answered    = questions.filter((q) => isAnswered(answers[q._id])).length;
    const unanswered  = questions.length - answered;
    Modal.confirm({
      title:   "Submit Exam?",
      icon:    <WarningOutlined style={{ color: "#F59E0B" }} />,
      content: unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
        : "All questions answered. Ready to submit?",
      okText:     "Yes, Submit",
      cancelText: "Continue Exam",
      okButtonProps: { danger: unanswered > 0 },
      onOk: doSubmit,
    });
  };

  /* ── No attempt selected ── */
  if (!attemptId) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Empty description="No attempt selected. Start an exam from the Exam Hub." />
      </div>
    );
  }

  /* ── Loading ── */
  if (loading && !currentAttempt) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  const examTitle = currentAttempt?.examId?.title || "Live Exam";
  const answeredCount = questions.filter((q) => isAnswered(answers[q._id])).length;

  return (
    <div style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--surface)", borderBottom: "1px solid var(--border-muted)",
        padding: "12px clamp(12px,3vw,24px)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(124,58,237,0.1)", color: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>
            <ClockCircleOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{examTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ color: "#22C55E", fontWeight: 700 }}>{answeredCount}</span>
              {" / "}{questions.length} answered
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Tag color={currentAttempt?.status === "in_progress" ? "blue" : "default"} style={{ margin: 0 }}>
            {currentAttempt?.status || "in_progress"}
          </Tag>
          {/* Timer rendered inline in header */}
          {currentAttempt && remainingSeconds !== null && (
            <ExamTimer
              key={`timer-${currentAttempt._id}`}
              initialSeconds={remainingSeconds}
              onTimeUp={doSubmit}
              inline
            />
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px clamp(12px,3vw,24px)", maxWidth: 860, margin: "0 auto" }}>
        {!questions.length ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-muted)",
            borderRadius: 14, padding: 48, textAlign: "center",
          }}>
            <Empty description="No questions available for this attempt" />
          </div>
        ) : (
          <>
            {/* Question navigator */}
            <QuestionNav
              questions={questions}
              answers={answers}
              onNavigate={scrollToQuestion}
            />

            {/* Questions */}
            {questions.map((question, i) => (
              <div
                key={question._id || i}
                ref={(el) => { questionRefs.current[i] = el; }}
                style={{ marginBottom: 14 }}
              >
                <QuestionCard
                  index={i}
                  question={question}
                  userAnswer={answers[question._id]}
                  onAnswerChange={handleAnswerChange}
                />
              </div>
            ))}

            {/* Bottom action bar */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-muted)",
              borderRadius: 14, padding: "14px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12, marginTop: 4,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AutosaveIndicator status={autosaveStatus} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {answeredCount}/{questions.length} answered
                </span>
              </div>
              <Button
                type="primary" size="large"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={handleSubmitClick}
                style={{ minWidth: 140 }}
              >
                Submit Exam
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamLive;
