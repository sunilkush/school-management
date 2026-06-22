import React, { useMemo, useState, useCallback } from "react";
import {
  Button, Select, InputNumber, Tag, message, Empty, Tooltip,
  Divider, Progress, Modal, Badge,
} from "antd";
import {
  FileTextOutlined, BookOutlined, ClockCircleOutlined,
  TrophyOutlined, PlusOutlined, DeleteOutlined,
  CheckCircleOutlined, SendOutlined, PrinterOutlined,
  EditOutlined, InfoCircleOutlined, BarChartOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getExams, updateExam } from "../../../features/examSlice";
import dayjs from "dayjs";

/* ── Design tokens ───────────────────────────────────────────────── */
const C = {
  primary:   "#2563EB",
  primaryBg: "#EFF6FF",
  primaryBd: "#BFDBFE",
  accent:    "#14B8A6",
  accentBg:  "#F0FDFA",
  success:   "#22C55E",
  successBg: "#F0FDF4",
  warning:   "#F59E0B",
  warningBg: "#FFFBEB",
  danger:    "#EF4444",
  dangerBg:  "#FEF2F2",
  purple:    "#8B5CF6",
  purpleBg:  "#F5F3FF",
  text:      "#0F172A",
  textSub:   "#64748B",
  textMuted: "#94A3B8",
  border:    "#E2E8F0",
  surface:   "#FFFFFF",
  bg:        "#F8FAFC",
};

/* ── Default section blueprint ───────────────────────────────────── */
const DEFAULT_SECTIONS = [
  { key: "A", section: "Section A", questionType: "Multiple Choice (MCQ)", questions: 0, marksEach: 1, color: C.primary,  bg: C.primaryBg },
  { key: "B", section: "Section B", questionType: "Short Answer",           questions: 0, marksEach: 3, color: C.accent,   bg: C.accentBg  },
  { key: "C", section: "Section C", questionType: "Long Answer / Essay",    questions: 0, marksEach: 5, color: C.purple,   bg: C.purpleBg  },
];

const QUESTION_TYPES = [
  "Multiple Choice (MCQ)", "True / False", "Fill in the Blank",
  "Short Answer", "Long Answer / Essay", "Diagram / Practical", "Case Study",
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const sectionTotal  = (s) => s.questions * s.marksEach;
const uid = () => Math.random().toString(36).slice(2, 8);

/* ── Sub-components ──────────────────────────────────────────────── */
const InfoChip = ({ icon, label, value, color = C.primary, bg = C.primaryBg }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    background: bg, border: `1px solid ${color}25`,
    borderRadius: 12, padding: "10px 16px", flex: "1 1 140px",
  }}>
    <span style={{
      width: 34, height: 34, borderRadius: 8,
      background: `${color}15`, color, fontSize: 16,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{icon}</span>
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

const SectionRow = ({ sec, totalMarks, onChange, onDelete, index }) => {
  const rowTotal  = sectionTotal(sec);
  const pct       = totalMarks > 0 ? Math.min(100, Math.round((rowTotal / totalMarks) * 100)) : 0;
  const progressColors = [C.primary, C.accent, C.purple, C.warning, C.success];
  const strokeColor = progressColors[index % progressColors.length];

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${sec.color}`,
      borderRadius: 12, padding: "16px 20px", marginBottom: 10,
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Section badge */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: sec.bg, color: sec.color,
          fontWeight: 800, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {sec.section.replace("Section ", "")}
        </div>

        {/* Section name */}
        <input
          value={sec.section}
          onChange={(e) => onChange({ ...sec, section: e.target.value })}
          style={{
            border: "none", background: "transparent", fontWeight: 700,
            fontSize: 14, color: C.text, outline: "none", minWidth: 100, flex: "0 0 auto",
          }}
        />

        <Divider type="vertical" style={{ height: 22, margin: "0 4px" }} />

        {/* Question type */}
        <Select
          value={sec.questionType}
          onChange={(v) => onChange({ ...sec, questionType: v })}
          options={QUESTION_TYPES.map((t) => ({ label: t, value: t }))}
          size="small"
          style={{ minWidth: 180 }}
          bordered={false}
        />

        <div style={{ flex: 1 }} />

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: C.textSub, display: "flex", alignItems: "center", gap: 6 }}>
            Questions
            <InputNumber
              min={0} max={200} value={sec.questions} size="small"
              onChange={(v) => onChange({ ...sec, questions: v ?? 0 })}
              style={{ width: 70, marginLeft: 4 }}
            />
          </label>
          <label style={{ fontSize: 12, color: C.textSub, display: "flex", alignItems: "center", gap: 6 }}>
            Marks each
            <InputNumber
              min={0.5} max={100} step={0.5} value={sec.marksEach} size="small"
              onChange={(v) => onChange({ ...sec, marksEach: v ?? 1 })}
              style={{ width: 70, marginLeft: 4 }}
            />
          </label>
          <Tag style={{
            background: sec.bg, color: sec.color, border: `1px solid ${sec.color}30`,
            fontWeight: 700, fontSize: 13, borderRadius: 8, padding: "2px 12px",
          }}>
            {rowTotal} marks
          </Tag>
          <Tooltip title="Remove section">
            <Button
              type="text" size="small" icon={<DeleteOutlined />}
              onClick={onDelete}
              style={{ color: C.danger, opacity: 0.7 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Progress bar */}
      {totalMarks > 0 && (
        <div style={{ marginTop: 12 }}>
          <Progress
            percent={pct} size="small"
            strokeColor={strokeColor}
            trailColor={C.border}
            format={(p) => <span style={{ fontSize: 11, color: C.textMuted }}>{p}%</span>}
          />
        </div>
      )}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────── */
const PaperBuilder = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((s) => s.exams || {});

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [sections, setSections]             = useState(DEFAULT_SECTIONS);
  const [publishing, setPublishing]         = useState(false);
  const [previewOpen, setPreviewOpen]       = useState(false);

  React.useEffect(() => {
    dispatch(getExams({ sortBy: "examDate", sortOrder: "desc" }));
  }, [dispatch]);

  const selectedExam = useMemo(
    () => exams.find((e) => e._id === selectedExamId),
    [exams, selectedExamId]
  );

  const totalMarks       = Number(selectedExam?.totalMarks || 0);
  const blueprintTotal   = sections.reduce((sum, s) => sum + sectionTotal(s), 0);
  const totalQuestions   = sections.reduce((sum, s) => sum + (s.questions || 0), 0);
  const remaining        = totalMarks - blueprintTotal;
  const isBalanced       = totalMarks > 0 && remaining === 0;
  const isOver           = remaining < 0;

  const handleExamChange = (id) => {
    setSelectedExamId(id);
    setSections(DEFAULT_SECTIONS.map((s) => ({ ...s, questions: 0 })));
  };

  const handleSectionChange = useCallback((idx, updated) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }, []);

  const handleDeleteSection = useCallback((idx) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddSection = () => {
    const sectionColors = [
      { color: C.success, bg: C.successBg },
      { color: C.warning, bg: C.warningBg },
      { color: C.danger,  bg: C.dangerBg  },
    ];
    const pick = sectionColors[sections.length % sectionColors.length];
    setSections((prev) => [
      ...prev,
      { key: uid(), section: `Section ${String.fromCharCode(65 + prev.length)}`,
        questionType: "Short Answer", questions: 0, marksEach: 2, ...pick },
    ]);
  };

  const handlePublish = async () => {
    if (!selectedExamId) return message.warning("Please select an exam first.");
    if (totalQuestions === 0) return message.warning("Add at least one question to any section.");
    if (isOver) return message.error(`Blueprint exceeds total marks by ${Math.abs(remaining)}. Please adjust.`);
    setPublishing(true);
    try {
      await dispatch(updateExam({
        examId: selectedExamId,
        payload: { status: "published", paperBlueprint: sections },
      })).unwrap();
      message.success("Paper published successfully!");
    } catch (e) {
      message.error(typeof e === "string" ? e : "Failed to publish paper.");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedExamId) return message.warning("Please select an exam first.");
    try {
      await dispatch(updateExam({
        examId: selectedExamId,
        payload: { paperBlueprint: sections },
      })).unwrap();
      message.success("Draft saved.");
    } catch (e) {
      message.error("Failed to save draft.");
    }
  };

  /* ── Render ── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "clamp(14px,3vw,28px)" }}>

      {/* ── Page Header ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: C.primaryBg, color: C.primary,
            fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileTextOutlined />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
              Paper Builder
            </div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 1 }}>
              Design and publish exam paper blueprints
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {selectedExam && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => setPreviewOpen(true)}
              style={{ borderRadius: 10, borderColor: C.border, color: C.textSub }}
            >
              Preview
            </Button>
          )}
          <Button
            icon={<EditOutlined />}
            onClick={handleSaveDraft}
            disabled={!selectedExamId}
            style={{ borderRadius: 10, borderColor: C.primary, color: C.primary }}
          >
            Save Draft
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handlePublish}
            loading={publishing}
            disabled={!selectedExamId || totalQuestions === 0 || isOver}
            style={{ borderRadius: 10, background: C.primary, borderColor: C.primary }}
          >
            Publish Paper
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Exam selector */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "20px 24px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Select Exam
            </div>
            <Select
              showSearch
              placeholder="Search and select an exam…"
              value={selectedExamId}
              onChange={handleExamChange}
              loading={loading}
              options={exams.map((e) => ({
                label: (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{e.title}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>
                      {e.examDate ? dayjs(e.examDate).format("DD MMM YYYY") : ""}
                    </span>
                  </div>
                ),
                value: e._id,
              }))}
              style={{ width: "100%", fontSize: 14 }}
              size="large"
              filterOption={(input, opt) =>
                exams.find((e) => e._id === opt.value)?.title?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* Exam info chips */}
          {selectedExam && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <InfoChip icon={<TrophyOutlined />}       label="Total Marks" value={totalMarks}                                        color={C.primary}  bg={C.primaryBg} />
              <InfoChip icon={<BookOutlined />}         label="Subject"     value={selectedExam.subjectId?.name || "—"}               color={C.accent}   bg={C.accentBg}  />
              <InfoChip icon={<ClockCircleOutlined />}  label="Duration"    value={selectedExam.duration ? `${selectedExam.duration} min` : "—"} color={C.purple} bg={C.purpleBg} />
              <InfoChip icon={<BarChartOutlined />}     label="Status"      value={String(selectedExam.status || "draft").toUpperCase()} color={C.warning} bg={C.warningBg} />
            </div>
          )}

          {/* Sections builder */}
          {!selectedExam ? (
            <div style={{
              background: C.surface, border: `1.5px dashed ${C.border}`,
              borderRadius: 16, padding: "56px 24px", textAlign: "center",
            }}>
              <FileTextOutlined style={{ fontSize: 40, color: C.textMuted, marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>
                No Exam Selected
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Select an exam above to start building the paper blueprint
              </div>
            </div>
          ) : (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "20px 24px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Paper Sections</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                    Configure question types and mark distribution
                  </div>
                </div>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleAddSection}
                  style={{ borderRadius: 9, borderColor: C.primary, color: C.primary }}
                >
                  Add Section
                </Button>
              </div>

              {sections.length === 0 ? (
                <Empty description="No sections. Click 'Add Section' to start." />
              ) : (
                sections.map((sec, idx) => (
                  <SectionRow
                    key={sec.key}
                    sec={sec}
                    index={idx}
                    totalMarks={totalMarks}
                    onChange={(updated) => handleSectionChange(idx, updated)}
                    onDelete={() => handleDeleteSection(idx)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN — Summary ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Blueprint summary */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Blueprint Summary
            </div>

            {[
              { label: "Total Marks",    value: totalMarks,      color: C.primary },
              { label: "Allocated",      value: blueprintTotal,  color: isOver ? C.danger : C.accent },
              { label: "Remaining",      value: Math.abs(remaining), color: isOver ? C.danger : C.success,
                suffix: isOver ? " (over)" : remaining === 0 ? " ✓" : "" },
              { label: "Total Questions", value: totalQuestions, color: C.purple },
            ].map(({ label, value, color, suffix = "" }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "9px 0",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 13, color: C.textSub }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color }}>
                  {value}{suffix}
                </span>
              </div>
            ))}

            {/* Overall allocation bar */}
            {totalMarks > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Allocation</span>
                  <span style={{ fontSize: 11, color: isOver ? C.danger : C.textMuted }}>
                    {Math.min(100, Math.round((blueprintTotal / totalMarks) * 100))}%
                  </span>
                </div>
                <Progress
                  percent={Math.min(100, Math.round((blueprintTotal / totalMarks) * 100))}
                  strokeColor={isOver ? C.danger : isBalanced ? C.success : C.primary}
                  trailColor={C.border}
                  showInfo={false}
                  strokeLinecap="round"
                />
              </div>
            )}

            {/* Status pill */}
            <div style={{ marginTop: 16 }}>
              {!selectedExam ? (
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12 }}>Select an exam to see summary</div>
              ) : isOver ? (
                <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}25`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.danger, fontWeight: 600 }}>
                  ⚠ Blueprint exceeds total marks by {Math.abs(remaining)}
                </div>
              ) : isBalanced ? (
                <div style={{ background: C.successBg, border: `1px solid ${C.success}25`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                  <CheckCircleOutlined /> Blueprint is perfectly balanced
                </div>
              ) : (
                <div style={{ background: C.warningBg, border: `1px solid ${C.warning}25`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#B45309", fontWeight: 600 }}>
                  <InfoCircleOutlined /> {remaining} marks unallocated
                </div>
              )}
            </div>
          </div>

          {/* Section breakdown */}
          {sections.length > 0 && selectedExam && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Section Breakdown
              </div>
              {sections.map((sec, i) => {
                const pct = totalMarks > 0 ? Math.round((sectionTotal(sec) / totalMarks) * 100) : 0;
                return (
                  <div key={sec.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sec.color }}>{sec.section}</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{sectionTotal(sec)} / {totalMarks} marks ({pct}%)</span>
                    </div>
                    <Progress
                      percent={pct} size="small" strokeColor={sec.color}
                      trailColor={C.border} showInfo={false}
                    />
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                      {sec.questions} × {sec.questionType}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick tip */}
          <div style={{
            background: C.primaryBg, border: `1px solid ${C.primaryBd}`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6 }}>
              <InfoCircleOutlined /> Pro Tip
            </div>
            <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
              Ensure your section marks add up to the total marks before publishing. Use "Save Draft" to save progress without publishing.
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} style={{ background: C.primary }}
            onClick={() => window.print()}>Print</Button>,
        ]}
        width={660}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileTextOutlined style={{ color: C.primary }} />
            <span style={{ fontWeight: 700 }}>Paper Preview — {selectedExam?.title}</span>
          </div>
        }
      >
        <div style={{ padding: "12px 0" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20, borderBottom: `2px solid ${C.border}`, paddingBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{selectedExam?.title}</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
              Subject: {selectedExam?.subjectId?.name || "—"} &nbsp;|&nbsp;
              Total Marks: {totalMarks} &nbsp;|&nbsp;
              Duration: {selectedExam?.duration ? `${selectedExam.duration} min` : "—"}
            </div>
            {selectedExam?.examDate && (
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                Date: {dayjs(selectedExam.examDate).format("DD MMMM YYYY")}
              </div>
            )}
          </div>

          {/* Sections */}
          {sections.map((sec, i) => (
            <div key={sec.key} style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                background: `${sec.color}10`, border: `1px solid ${sec.color}25`,
                borderRadius: 8, padding: "8px 14px", marginBottom: 8,
              }}>
                <span style={{ fontWeight: 700, color: sec.color }}>{sec.section}</span>
                <span style={{ fontSize: 12, color: C.textSub }}>
                  {sec.questions} questions × {sec.marksEach} marks = <b style={{ color: sec.color }}>{sectionTotal(sec)} marks</b>
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, paddingLeft: 14 }}>
                Type: {sec.questionType}
              </div>
            </div>
          ))}

          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.textSub }}>Total Questions: <b style={{ color: C.text }}>{totalQuestions}</b></span>
            <span style={{ fontSize: 13, color: C.textSub }}>Total Marks: <b style={{ color: C.primary }}>{blueprintTotal}</b></span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaperBuilder;
