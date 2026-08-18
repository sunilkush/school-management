import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Drawer, Empty, Input, InputNumber,
  Select, Space, Table, Tag, Tooltip, Tabs, Badge,
} from "antd";
import {
  CheckCircleOutlined, RobotOutlined, EyeOutlined,
  FilterOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { evaluateAttempt, getAttempts } from "../../../features/attemptSlice";
import {
  pageWrapper, pageCard, tableHeadCss, statGrid,
  statCard, statLabel, statValue,
} from "../../../styles/pageStyles";
import PageHeader from "../../../components/layout/PageHeader";
import { GraduationCap } from "lucide-react";

/* ── Grade badge colour ─────────────────────────────────────────── */
const GRADE_COLORS = { "A+": "var(--success-hover)", A: "var(--success)", "B+": "var(--primary)", B: "var(--info)", C: "var(--warning-hover)", D: "var(--orange)", F: "var(--danger-hover)" };

// RGB triples for the tokens above, used to build alpha-tinted backgrounds/borders from
// a CSS custom property — the old `${color}NN` hex-alpha-suffix concatenation used
// throughout this file doesn't work once these are var() values, so we go through
// rgba() instead.
const RGB = {
  "var(--primary)": "var(--primary-rgb)",
  "var(--success)": "var(--success-rgb)",
  "var(--success-hover)": "var(--success-rgb)",
  "var(--warning)": "var(--warning-rgb)",
  "var(--warning-hover)": "var(--warning-rgb)",
  "var(--danger)": "var(--danger-rgb)",
  "var(--danger-hover)": "var(--danger-rgb)",
  "var(--info)": "59,130,246",
  "var(--orange)": "249,115,22",
  "var(--text-secondary)": "100,116,139",
};
const tint = (color, alpha) => `rgba(${RGB[color] || "100,116,139"}, ${alpha})`;

const gradeBadge = (g) => {
  const c = GRADE_COLORS[g] || "var(--text-secondary)";
  return (
    <span style={{
      background: tint(c, 0.09),
      color: c,
      border: `1px solid ${tint(c, 0.2)}`,
      padding: "2px 10px", borderRadius: 99, fontWeight: 700, fontSize: 13,
    }}>{g || "—"}</span>
  );
};

/* ── Question type label ────────────────────────────────────────── */
const AUTO_TYPES = new Set(["mcq_single", "mcq_multi", "true_false", "fill_blank"]);
const qTypePill = (t) => {
  const auto = AUTO_TYPES.has(t);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
      background: auto ? "var(--success-light)" : "var(--warning-light)",
      color:      auto ? "var(--success-hover)" : "var(--warning-hover)",
      border:     `1px solid ${auto ? tint("var(--success)", 0.2) : tint("var(--warning)", 0.2)}`,
    }}>
      {auto ? "Auto" : "Manual"} · {t}
    </span>
  );
};

/* ── Answer preview row ─────────────────────────────────────────── */
const AnswerRow = ({ ans, idx, marksOverride, onChangeMarks, readOnly }) => {
  const snap    = ans.questionSnapshot || ans.snapshot || {};
  const isAuto  = AUTO_TYPES.has(snap.questionType);
  const maxMarks = Number(snap.marks ?? 0);

  return (
    <div style={{
      padding: "14px 16px", marginBottom: 8, borderRadius: 10,
      background: ans.isCorrect === true ? "var(--success-light)" : ans.isCorrect === false ? "var(--danger-light)" : "var(--surface-soft)",
      border: `1px solid ${ans.isCorrect === true ? tint("var(--success)", 0.2) : ans.isCorrect === false ? tint("var(--danger)", 0.2) : "var(--border-muted)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
          background: "var(--border)", color: "var(--text-muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 11,
        }}>{idx + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.5 }}>
            {snap.statement || "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {qTypePill(snap.questionType)}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Max: <b>{maxMarks}</b> marks
            </span>
            {ans.isCorrect !== null && (
              <Tag color={ans.isCorrect ? "success" : "error"} style={{ fontSize: 11 }}>
                {ans.isCorrect ? "Correct" : "Wrong"}
              </Tag>
            )}
          </div>

          {/* Student response */}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Student Answer: </span>
            <span style={{ color: "var(--text-primary)" }}>
              {Array.isArray(ans.response) ? ans.response.join(", ") : String(ans.response ?? "—")}
            </span>
          </div>

          {/* Correct answer (auto questions) */}
          {isAuto && snap.correctAnswers != null && (
            <div style={{ fontSize: 12, marginTop: 2 }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Correct Answer: </span>
              <span style={{ color: "var(--success-hover)", fontWeight: 600 }}>
                {Array.isArray(snap.correctAnswers) ? snap.correctAnswers.join(", ") : String(snap.correctAnswers)}
              </span>
            </div>
          )}
        </div>

        {/* Marks input (only for subjective / readOnly false) */}
        {!isAuto && !readOnly ? (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Marks</div>
            <InputNumber
              min={0} max={maxMarks} size="small"
              value={marksOverride ?? ans.marksObtained ?? 0}
              onChange={onChangeMarks}
              style={{ width: 70 }}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Marks</div>
            <div style={{
              fontWeight: 700, fontSize: 15,
              color: isAuto && ans.isCorrect ? "var(--success-hover)" : isAuto ? "var(--danger-hover)" : "var(--primary)",
            }}>
              {ans.marksObtained ?? 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const TeacherEvaluationPage = () => {
  const dispatch = useDispatch();
  const { attempts = [], loading, error } = useSelector((s) => s.attempts || {});

  const [search,        setSearch]        = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [drawerAttempt, setDrawerAttempt] = useState(null);
  const [marksMap,      setMarksMap]      = useState({}); // { attemptId: { questionId: marks } }
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("pending");

  /* Fetch submitted + evaluated attempts */
  useEffect(() => {
    dispatch(getAttempts({ limit: 200 }));
  }, [dispatch]);

  const pending   = useMemo(() => attempts.filter((a) => a.status === "submitted"),  [attempts]);
  const evaluated = useMemo(() => attempts.filter((a) => a.status === "evaluated"),  [attempts]);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    attempts.forEach((a) => {
      const id   = a?.examId?.subjectId?._id || a?.examId?.subjectId;
      const name = a?.examId?.subjectId?.name || "Unknown";
      if (!map.has(String(id || name))) map.set(String(id || name), { label: name, value: String(id || name) });
    });
    return Array.from(map.values());
  }, [attempts]);

  const applyFilters = (list) => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => {
      const subId  = String(a?.examId?.subjectId?._id || a?.examId?.subjectId || "");
      const bySubj = subjectFilter === "all" || subId === subjectFilter;
      const byQ    = !q || `${a?.examId?.title || ""} ${a?.studentId?.name || ""}`.toLowerCase().includes(q);
      return bySubj && byQ;
    });
  };

  const pendingFiltered   = applyFilters(pending);
  const evaluatedFiltered = applyFilters(evaluated);

  /* ── Per-question marks tracking ── */
  const setQuestionMark = (attemptId, questionId, value) => {
    setMarksMap((prev) => ({
      ...prev,
      [attemptId]: { ...(prev[attemptId] || {}), [String(questionId)]: value },
    }));
  };

  /* ── Finalize evaluation ── */
  const handleFinalize = async (attempt) => {
    setSaving(true);
    try {
      const perQ = marksMap[attempt._id] || {};
      const evaluations = attempt.answers
        .filter((ans) => !AUTO_TYPES.has(ans.questionSnapshot?.questionType))
        .map((ans) => ({
          questionId: String(ans.questionId),
          marksObtained: perQ[String(ans.questionId)] ?? ans.marksObtained ?? 0,
        }));

      const totalMarks = Number(attempt.examId?.totalMarks || 0);
      const subjectiveTotal = evaluations.reduce((s, e) => s + Number(e.marksObtained || 0), 0);
      const autoTotal       = attempt.answers
        .filter((a) => AUTO_TYPES.has(a.questionSnapshot?.questionType))
        .reduce((s, a) => s + Number(a.marksObtained || 0), 0);
      const grandTotal = subjectiveTotal + autoTotal;
      const pct        = totalMarks > 0 ? Math.round((grandTotal / totalMarks) * 100) : 0;
      const grade      = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";

      await dispatch(evaluateAttempt({ attemptId: attempt._id, evaluations, grade })).unwrap();
      setDrawerAttempt(null);
      dispatch(getAttempts({ limit: 200 }));
    } catch (e) {
      /* toast shown by thunk */
    } finally {
      setSaving(false);
    }
  };

  /* ── Table columns ── */
  const makeColumns = (readOnly = false) => [
    {
      title: "Exam · Subject",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>
            {r.examId?.title || "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {r.examId?.subjectId?.name || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Student",
      render: (_, r) => (
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {r.studentId?.name || r.studentId || "—"}
        </div>
      ),
    },
    {
      title: "Questions",
      width: 100,
      align: "center",
      render: (_, r) => {
        const auto = (r.answers || []).filter((a) => AUTO_TYPES.has(a.questionSnapshot?.questionType)).length;
        const subj = (r.answers || []).length - auto;
        return (
          <div style={{ fontSize: 12, textAlign: "center" }}>
            <div>{(r.answers || []).length} total</div>
            {auto > 0 && <div style={{ color: "var(--success-hover)" }}>{auto} auto</div>}
            {subj > 0 && <div style={{ color: "var(--warning-hover)" }}>{subj} manual</div>}
          </div>
        );
      },
    },
    {
      title: "Score",
      width: 100,
      align: "center",
      render: (_, r) => (
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", textAlign: "center" }}>
          {r.totalMarksObtained ?? 0}
          <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 11 }}>
            /{r.examId?.totalMarks || "—"}
          </span>
        </div>
      ),
    },
    ...(readOnly ? [{
      title: "Grade",
      width: 90,
      align: "center",
      render: (_, r) => gradeBadge(r.grade),
    }, {
      title: "Method",
      width: 110,
      align: "center",
      render: (_, r) => r.autoEvaluated
        ? <Tag color="green" icon={<RobotOutlined />} style={{ fontSize: 11 }}>Auto</Tag>
        : <Tag color="blue"  icon={<CheckCircleOutlined />} style={{ fontSize: 11 }}>Teacher</Tag>,
    }] : []),
    {
      title: "Action",
      width: 120,
      align: "right",
      render: (_, r) => (
        <Tooltip title={readOnly ? "View Details" : "Evaluate"}>
          <Button
            type={readOnly ? "default" : "primary"}
            size="small"
            icon={readOnly ? <EyeOutlined /> : <CheckCircleOutlined />}
            onClick={() => setDrawerAttempt(r)}
          >
            {readOnly ? "View" : "Evaluate"}
          </Button>
        </Tooltip>
      ),
    },
  ];

  /* ── Stats ── */
  const statsMeta = [
    { label: "Pending Review", value: pending.length,       color: "var(--warning-hover)" },
    { label: "Auto Evaluated", value: evaluated.filter((a) => a.autoEvaluated).length, color: "var(--success-hover)" },
    { label: "Teacher Graded", value: evaluated.filter((a) => !a.autoEvaluated).length, color: "var(--primary)" },
  ];

  const isReadOnly = drawerAttempt?.status === "evaluated";

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("eval-table")}</style>

      <PageHeader
        title="Evaluation"
        subtitle="Subjective exams manually grade karein — MCQ auto-evaluated hote hain."
        icon={<GraduationCap size={20} />}
        extra={
          <Space>
            <Input
              allowClear
              placeholder="Exam ya student search karein"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              value={subjectFilter}
              onChange={setSubjectFilter}
              style={{ width: 160 }}
              options={[{ label: "All Subjects", value: "all" }, ...subjectOptions]}
              prefix={<FilterOutlined />}
            />
          </Space>
        }
      />

      <div style={{ marginTop: 20 }}>
        {/* Stats */}
        <div style={{ ...statGrid(160), marginBottom: 20 }}>
          {statsMeta.map((s) => (
            <div key={s.label} style={statCard({ color: s.color })}>
              <div>
                <div style={statLabel(s.color)}>{s.label}</div>
                <div style={statValue(s.color)}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <Alert type="error" showIcon message="Attempts load nahi hue" style={{ marginBottom: 16 }} />}

        {/* Tabs */}
        <div style={pageCard}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "pending",
                label: (
                  <Badge count={pending.length} size="small" color="var(--warning-hover)">
                    <span style={{ paddingRight: pending.length ? 10 : 0 }}>
                      Pending Evaluation
                    </span>
                  </Badge>
                ),
                children: (
                  <Table
                    className="eval-table"
                    rowKey="_id"
                    loading={loading}
                    dataSource={pendingFiltered}
                    columns={makeColumns(false)}
                    locale={{ emptyText: <Empty description="Koi pending attempt nahi" /> }}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    scroll={{ x: 650 }}
                  />
                ),
              },
              {
                key: "evaluated",
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <RobotOutlined style={{ color: "var(--success-hover)" }} />
                    Auto / Graded
                    <Badge count={evaluated.length} size="small" color="var(--success-hover)" />
                  </span>
                ),
                children: (
                  <Table
                    className="eval-table"
                    rowKey="_id"
                    loading={loading}
                    dataSource={evaluatedFiltered}
                    columns={makeColumns(true)}
                    locale={{ emptyText: <Empty description="Koi evaluated attempt nahi" /> }}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    scroll={{ x: 750 }}
                  />
                ),
              },
            ]}
            style={{ padding: "0 20px" }}
          />
        </div>
      </div>

      {/* ── Evaluate / View Drawer ── */}
      <Drawer
        open={!!drawerAttempt}
        onClose={() => setDrawerAttempt(null)}
        width={600}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isReadOnly
              ? <EyeOutlined style={{ color: "var(--primary)" }} />
              : <ThunderboltOutlined style={{ color: "var(--warning-hover)" }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {isReadOnly ? "Attempt Details" : "Evaluate Attempt"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                {drawerAttempt?.examId?.title || "—"} · {drawerAttempt?.studentId?.name || "—"}
              </div>
            </div>
            {isReadOnly && drawerAttempt?.autoEvaluated && (
              <Tag color="green" icon={<RobotOutlined />} style={{ marginLeft: "auto" }}>Auto Evaluated</Tag>
            )}
          </div>
        }
        footer={
          !isReadOnly && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button onClick={() => setDrawerAttempt(null)}>Cancel</Button>
              <Button
                type="primary"
                loading={saving}
                icon={<CheckCircleOutlined />}
                onClick={() => handleFinalize(drawerAttempt)}
              >
                Finalize & Grade
              </Button>
            </div>
          )
        }
        styles={{ body: { padding: 20 } }}
      >
        {drawerAttempt && (
          <>
            {/* Summary bar */}
            <div style={{
              display: "flex", gap: 16, marginBottom: 20,
              padding: "12px 16px", borderRadius: 10,
              background: "var(--surface-soft)", border: "1px solid var(--border-muted)",
              flexWrap: "wrap",
            }}>
              {[
                { label: "Total Marks",   value: drawerAttempt.examId?.totalMarks || "—" },
                { label: "Obtained",      value: drawerAttempt.totalMarksObtained ?? 0   },
                { label: "Grade",         value: drawerAttempt.grade || "Pending"         },
                { label: "Questions",     value: drawerAttempt.answers?.length || 0       },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Questions */}
            {(drawerAttempt.answers || []).map((ans, i) => (
              <AnswerRow
                key={i}
                ans={ans}
                idx={i}
                readOnly={isReadOnly}
                marksOverride={marksMap[drawerAttempt._id]?.[String(ans.questionId)]}
                onChangeMarks={(v) => setQuestionMark(drawerAttempt._id, ans.questionId, v)}
              />
            ))}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default TeacherEvaluationPage;
