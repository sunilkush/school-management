import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Progress, Segmented, Spin, Tag, message } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getExams, getStudentResults } from "../../../features/examSlice";
import { getActiveAttemptByExam, getAttempts, startAttempt } from "../../../features/attemptSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, pageWrapper, sectionPanel, statGrid } from "../../../styles/pageStyles";

/* ── helpers ── */
const getExamWindow = (exam, now = dayjs()) => {
  if (exam?.status !== "published")
    return { canStart: false, label: "Not Published", color: "#64748B", bg: "#F1F5F9" };
  const s = exam.startTime ? dayjs(exam.startTime) : null;
  const e = exam.endTime   ? dayjs(exam.endTime)   : null;
  if (!s?.isValid() || !e?.isValid())
    return { canStart: false, label: "No Time Set", color: "#64748B", bg: "#F1F5F9" };
  if (now.isBefore(s))
    return { canStart: false, label: `Opens ${s.format("hh:mm A")}`, color: "#B45309", bg: "#FEF3C7" };
  if (now.isAfter(e))
    return { canStart: false, label: "Closed", color: "#DC2626", bg: "#FEE2E2" };
  return { canStart: true, label: "Live Now", color: "#15803D", bg: "#DCFCE7" };
};

const GRADE_COLOR = {
  "A+": "#7C3AED", A: "#0891B2", B: "#15803D",
  C: "#B45309",   D: "#DC2626", F: "#7F1D1D",
};

/* ── Sub-components ── */
const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 14, padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 13,
  }}>
    <div style={iconWell(color, 44)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const ExamCard = ({ exam, attempt, onStart, onResume, onReview, starting }) => {
  const win = getExamWindow(exam);
  const hasAttempt = Boolean(attempt);

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-muted)",
      borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 4,
        background: win.canStart ? "#22C55E" : exam.status === "published" ? "#F59E0B" : "#94A3B8",
      }} />
      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* title + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 6 }}>
              {exam.title || "Untitled Exam"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {exam.subjectId?.name && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(124,58,237,0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: 99 }}>
                  {exam.subjectId.name}
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 700, background: win.bg, color: win.color, padding: "2px 8px", borderRadius: 99 }}>
                {win.label}
              </span>
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, flexShrink: 0, padding: "3px 10px", borderRadius: 99,
            background: exam.status === "published" ? "#DCFCE7" : "#F1F5F9",
            color:      exam.status === "published" ? "#15803D" : "#64748B",
          }}>
            {exam.status || "draft"}
          </span>
        </div>

        {/* info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {[
            [<CalendarOutlined />, dayjs(exam.examDate).format("DD MMM YYYY")],
            [<ClockCircleOutlined />, `${exam.startTime ? dayjs(exam.startTime).format("hh:mm A") : "--"} – ${exam.endTime ? dayjs(exam.endTime).format("hh:mm A") : "--"}`],
            [<FileTextOutlined />, `${exam.totalMarks ?? 0} marks · Pass: ${exam.passingMarks ?? 0}`],
            [<ClockCircleOutlined />, `${exam.durationMinutes ?? 0} min`],
          ].map(([icon, text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "var(--primary)", fontSize: 12, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto", paddingTop: 4 }}>
          {hasAttempt ? (
            <>
              <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => onResume(attempt._id)}>
                Resume
              </Button>
              <Button size="small" onClick={() => onReview(attempt._id)}>Review</Button>
            </>
          ) : (
            <Button
              size="small" type="primary"
              icon={<PlayCircleOutlined />}
              disabled={!win.canStart}
              loading={starting === exam._id}
              onClick={() => onStart(exam._id)}
            >
              Start Exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ result }) => {
  const [open, setOpen] = useState(false);
  const pct  = Number(result.percentage || 0);
  const pass = result.resultStatus === "PASS";
  const grade = result.grade || "N/A";
  const gc  = GRADE_COLOR[grade] || "#64748B";

  return (
    <div style={{ border: "1px solid var(--border-muted)", borderRadius: 12, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", cursor: "pointer",
          background: "var(--surface-soft, var(--surface-page))",
          flexWrap: "wrap", gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: gc + "22", color: gc,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14,
          }}>
            {grade}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
              {result.examId?.title || "Exam"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}% overall</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: pass ? "#DCFCE7" : "#FEE2E2",
            color:      pass ? "#15803D" : "#DC2626",
            padding: "3px 10px", borderRadius: 99, fontWeight: 700, fontSize: 12,
          }}>
            {pass ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {result.resultStatus}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <Progress
          percent={pct} size="small" showInfo={false}
          strokeColor={pass ? "#22C55E" : "#EF4444"}
          trailColor="var(--border-muted)"
        />
      </div>

      {open && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-muted)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {(result.subjects || []).map((sub, i) => (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 10,
                border: "1px solid var(--border-muted)",
                background: sub.isPassed ? "rgba(220,252,231,0.3)" : "rgba(254,226,226,0.3)",
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>
                  {sub.subjectName}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                  {sub.obtainedMarks} / {sub.totalMarks} · Pass: {sub.passingMarks}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: sub.isPassed ? "#15803D" : "#DC2626" }}>
                  {sub.isPassed ? "✓ PASS" : "✗ FAIL"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const StudentExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams = [], results = [], loading } = useSelector((s) => s.exams || {});
  const { attempts = [], loading: aLoading } = useSelector((s) => s.attempts || {});
  const [filter,   setFilter]  = useState("upcoming");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "asc" }));
    dispatch(getStudentResults());
    dispatch(getAttempts({ status: "in_progress", limit: 100 }));
  }, [dispatch]);

  const safeExams    = Array.isArray(exams)    ? exams    : [];
  const safeResults  = Array.isArray(results)  ? results  : [];
  const safeAttempts = Array.isArray(attempts) ? attempts : [];

  const inProgressMap = useMemo(() => {
    const m = new Map();
    safeAttempts.forEach((a) => {
      const id = a?.examId?._id || a?.examId;
      if (id) m.set(`${id}`, a);
    });
    return m;
  }, [safeAttempts]);

  const filteredExams = useMemo(() => {
    const now = dayjs();
    if (filter === "all") return safeExams;
    return safeExams.filter((e) => {
      const d = dayjs(e.examDate);
      return filter === "upcoming"
        ? d.isAfter(now, "day") || d.isSame(now, "day")
        : d.isBefore(now, "day");
    });
  }, [safeExams, filter]);

  const stats = useMemo(() => {
    const now     = dayjs();
    const upcoming = safeExams.filter((e) => {
      const d = dayjs(e.examDate);
      return d.isAfter(now, "day") || d.isSame(now, "day");
    }).length;
    const passed  = safeResults.filter((r) => r.resultStatus === "PASS").length;
    const avg     = safeResults.length
      ? Math.round(safeResults.reduce((s, r) => s + Number(r.percentage || 0), 0) / safeResults.length)
      : 0;
    return { total: safeExams.length, upcoming, passed, failed: safeResults.length - passed, avg };
  }, [safeExams, safeResults]);

  const nextExam = useMemo(() => {
    const now = dayjs();
    return safeExams
      .filter((e) => dayjs(e.examDate).isAfter(now, "day") || dayjs(e.examDate).isSame(now, "day"))
      .sort((a, b) => dayjs(a.examDate).valueOf() - dayjs(b.examDate).valueOf())[0];
  }, [safeExams]);

  const handleStart = async (examId) => {
    setStarting(examId);
    try {
      try {
        const active = await dispatch(getActiveAttemptByExam(examId)).unwrap();
        if (active?._id) {
          navigate(`/dashboard/student/exams/exam-live?attemptId=${active._id}`);
          message.info("Resuming your in-progress attempt");
          return;
        }
      } catch { /* no active attempt, start fresh */ }
      const attempt = await dispatch(startAttempt({ examId })).unwrap();
      navigate(`/dashboard/student/exams/exam-live?attemptId=${attempt._id}`);
      message.success("Exam started!");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Unable to start exam");
    } finally {
      setStarting(null);
    }
  };

  const handleResume = (attemptId) => navigate(`/dashboard/student/exams/exam-live?attemptId=${attemptId}`);
  const handleReview = (attemptId) => navigate(`/dashboard/student/exams/attempt-review?attemptId=${attemptId}`);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Exam Hub"
        subtitle="View your schedule, start live exams, and check published results"
        icon={<FileTextOutlined />}
      />

      {/* ── Stat cards ── */}
      <div style={{ ...statGrid(140), marginTop: 20 }}>
        <StatCard icon={<FileTextOutlined />}    label="Total Exams" value={stats.total}    color="#7C3AED" />
        <StatCard icon={<CalendarOutlined />}    label="Upcoming"    value={stats.upcoming} color="#B45309" />
        <StatCard icon={<TrophyOutlined />}      label="Avg. Score"  value={`${stats.avg}%`} color="#0891B2" />
        <StatCard icon={<CheckCircleOutlined />} label="Passed"      value={stats.passed}   color="#15803D" sub={`${stats.failed} failed`} />
      </div>

      {/* ── Next exam banner ── */}
      {nextExam && (
        <div style={{
          ...sectionPanel, marginTop: 0, padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(124,58,237,0.07), rgba(124,58,237,0.02))",
          border: "1px solid rgba(124,58,237,0.2)", flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={iconWell("var(--primary)", 38)}><CalendarOutlined /></div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Next Exam</div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{nextExam.title}</div>
            </div>
          </div>
          <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13 }}>
            {dayjs(nextExam.examDate).format("DD MMM YYYY")}
            {nextExam.startTime ? ` · ${dayjs(nextExam.startTime).format("hh:mm A")}` : ""}
          </div>
        </div>
      )}

      {/* ── In-progress alert ── */}
      {inProgressMap.size > 0 && (
        <Alert
          type="info" showIcon
          message={`${inProgressMap.size} exam attempt(s) in progress — resume from the cards below.`}
          style={{ borderRadius: 10, marginBottom: 16 }}
        />
      )}

      {/* ── Exam Schedule ── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWell("#B45309", 34)}><CalendarOutlined /></div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Exam Schedule</span>
          </div>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: "Upcoming", value: "upcoming" },
              { label: "Past",     value: "completed" },
              { label: "All",      value: "all" },
            ]}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>
        ) : filteredExams.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam._id}
                exam={exam}
                attempt={inProgressMap.get(`${exam._id}`)}
                starting={starting}
                onStart={handleStart}
                onResume={handleResume}
                onReview={handleReview}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: "var(--text-muted)" }}>No {filter} exams found</span>}
          />
        )}
      </div>

      {/* ── Published Results ── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={iconWell("#15803D", 34)}><TrophyOutlined /></div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Published Results</span>
        </div>

        {loading || aLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>
        ) : !safeResults.length ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: "var(--text-muted)" }}>No published results yet</span>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {safeResults.map((result) => (
              <ResultCard key={result._id} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamsPage;
