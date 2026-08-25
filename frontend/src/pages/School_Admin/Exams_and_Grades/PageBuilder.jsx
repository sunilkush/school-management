import React, { useMemo, useState, useCallback } from "react";
import {
  Button, Select, InputNumber, Tag, message, Empty, Tooltip,
  Divider, Progress, Modal,
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
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, modalTitle, emptyState,
} from "../../../styles/pageStyles";

/* ── Accent colours (design tokens) ── */
const C = {
  primary: "var(--primary)",
  accent:  "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger:  "var(--danger)",
  purple:  "var(--purple)",
};

/* ── Default section blueprint ───────────────────────────────────── */
const DEFAULT_SECTIONS = [
  { key: "A", section: "Section A", questionType: "Multiple Choice (MCQ)", questions: 0, marksEach: 1, color: C.primary,  bg: `color-mix(in srgb, ${C.primary} 15%, transparent)` },
  { key: "B", section: "Section B", questionType: "Short Answer",           questions: 0, marksEach: 3, color: C.accent,   bg: `color-mix(in srgb, ${C.accent} 15%, transparent)`  },
  { key: "C", section: "Section C", questionType: "Long Answer / Essay",    questions: 0, marksEach: 5, color: C.purple,   bg: `color-mix(in srgb, ${C.purple} 15%, transparent)`  },
];

const QUESTION_TYPES = [
  "Multiple Choice (MCQ)", "True / False", "Fill in the Blank",
  "Short Answer", "Long Answer / Essay", "Diagram / Practical", "Case Study",
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const sectionTotal  = (s) => s.questions * s.marksEach;
const uid = () => Math.random().toString(36).slice(2, 8);

/* ── Sub-components ──────────────────────────────────────────────── */
const InfoChip = ({ icon, label, value, color = C.primary }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
    <div style={iconWell(color, 38)}>{icon}</div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{value}</div>
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
      ...sectionPanel,
      borderLeft: `4px solid ${sec.color}`,
      padding: "16px 20px", marginBottom: 10,
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Section badge */}
        <div style={iconWell(sec.color, 36, { fontWeight: 800, fontSize: 14 })}>
          {sec.section.replace("Section ", "")}
        </div>

        {/* Section name */}
        <input
          value={sec.section}
          onChange={(e) => onChange({ ...sec, section: e.target.value })}
          style={{
            border: "none", background: "transparent", fontWeight: 700,
            fontSize: 14, color: "var(--text-primary)", outline: "none", minWidth: 100, flex: "0 0 auto",
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
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            Questions
            <InputNumber
              min={0} max={200} value={sec.questions} size="small"
              onChange={(v) => onChange({ ...sec, questions: v ?? 0 })}
              style={{ width: 70, marginLeft: 4 }}
            />
          </label>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            Marks each
            <InputNumber
              min={0.5} max={100} step={0.5} value={sec.marksEach} size="small"
              onChange={(v) => onChange({ ...sec, marksEach: v ?? 1 })}
              style={{ width: 70, marginLeft: 4 }}
            />
          </label>
          <Tag style={{
            background: sec.bg, color: sec.color, border: `1px solid color-mix(in srgb, ${sec.color} 30%, transparent)`,
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
            trailColor="var(--border-muted)"
            format={(p) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p}%</span>}
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
    const exam = exams.find((e) => e._id === id);
    setSections(
      exam?.paperBlueprint?.length
        ? exam.paperBlueprint
        : DEFAULT_SECTIONS.map((s) => ({ ...s, questions: 0 }))
    );
  };

  const handleSectionChange = useCallback((idx, updated) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }, []);

  const handleDeleteSection = useCallback((idx) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddSection = () => {
    const sectionColors = [
      { color: C.success, bg: `color-mix(in srgb, ${C.success} 15%, transparent)` },
      { color: C.warning, bg: `color-mix(in srgb, ${C.warning} 15%, transparent)` },
      { color: C.danger,  bg: `color-mix(in srgb, ${C.danger} 15%, transparent)`  },
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
    } catch {
      message.error("Failed to save draft.");
    }
  };

  /* ── Render ── */
  return (
    <div>
      <PageHeader
        title="Paper Builder"
        subtitle="Design and publish exam paper blueprints"
        icon={<FileTextOutlined />}
        extra={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {selectedExam && (
              <Button icon={<PrinterOutlined />} onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={handleSaveDraft}
              disabled={!selectedExamId}
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={publishing}
              disabled={!selectedExamId || totalQuestions === 0 || isOver}
            >
              Publish Paper
            </Button>
          </div>
        }
      />
      <div style={pageWrapper}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Exam selector */}
          <div style={sectionPanel}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
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
            <div style={statGrid(150)}>
              <InfoChip icon={<TrophyOutlined />}       label="Total Marks" value={totalMarks}                                        color={C.primary} />
              <InfoChip icon={<BookOutlined />}         label="Subject"     value={selectedExam.subjectId?.name || "—"}               color={C.accent}  />
              <InfoChip icon={<ClockCircleOutlined />}  label="Duration"    value={selectedExam.duration ? `${selectedExam.duration} min` : "—"} color={C.purple} />
              <InfoChip icon={<BarChartOutlined />}     label="Status"      value={String(selectedExam.status || "draft").toUpperCase()} color={C.warning} />
            </div>
          )}

          {/* Sections builder */}
          {!selectedExam ? (
            <div style={emptyState}>
              <FileTextOutlined style={{ fontSize: 40, color: "var(--text-muted)", marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                No Exam Selected
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Select an exam above to start building the paper blueprint
              </div>
            </div>
          ) : (
            <div style={sectionPanel}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Paper Sections</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
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
          <div style={sectionPanel}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                borderBottom: "1px solid var(--border-muted)",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color }}>
                  {value}{suffix}
                </span>
              </div>
            ))}

            {/* Overall allocation bar */}
            {totalMarks > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Allocation</span>
                  <span style={{ fontSize: 11, color: isOver ? C.danger : "var(--text-muted)" }}>
                    {Math.min(100, Math.round((blueprintTotal / totalMarks) * 100))}%
                  </span>
                </div>
                <Progress
                  percent={Math.min(100, Math.round((blueprintTotal / totalMarks) * 100))}
                  strokeColor={isOver ? C.danger : isBalanced ? C.success : C.primary}
                  trailColor="var(--border-muted)"
                  showInfo={false}
                  strokeLinecap="round"
                />
              </div>
            )}

            {/* Status pill */}
            <div style={{ marginTop: 16 }}>
              {!selectedExam ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Select an exam to see summary</div>
              ) : isOver ? (
                <div style={{ background: `color-mix(in srgb, ${C.danger} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${C.danger} 25%, transparent)`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.danger, fontWeight: 600 }}>
                  ⚠ Blueprint exceeds total marks by {Math.abs(remaining)}
                </div>
              ) : isBalanced ? (
                <div style={{ background: `color-mix(in srgb, ${C.success} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${C.success} 25%, transparent)`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--success-hover)", fontWeight: 600 }}>
                  <CheckCircleOutlined /> Blueprint is perfectly balanced
                </div>
              ) : (
                <div style={{ background: `color-mix(in srgb, ${C.warning} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${C.warning} 25%, transparent)`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--warning-hover)", fontWeight: 600 }}>
                  <InfoCircleOutlined /> {remaining} marks unallocated
                </div>
              )}
            </div>
          </div>

          {/* Section breakdown */}
          {sections.length > 0 && selectedExam && (
            <div style={sectionPanel}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Section Breakdown
              </div>
              {sections.map((sec) => {
                const pct = totalMarks > 0 ? Math.round((sectionTotal(sec) / totalMarks) * 100) : 0;
                return (
                  <div key={sec.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sec.color }}>{sec.section}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sectionTotal(sec)} / {totalMarks} marks ({pct}%)</span>
                    </div>
                    <Progress
                      percent={pct} size="small" strokeColor={sec.color}
                      trailColor="var(--border-muted)" showInfo={false}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                      {sec.questions} × {sec.questionType}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick tip */}
          <div style={{
            background: `color-mix(in srgb, ${C.primary} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${C.primary} 30%, transparent)`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6 }}>
              <InfoCircleOutlined /> Pro Tip
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
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
          <Button key="print" type="primary" icon={<PrinterOutlined />}
            onClick={() => window.print()}>Print</Button>,
        ]}
        width={660}
        title={modalTitle(<FileTextOutlined />, `Paper Preview — ${selectedExam?.title || ""}`)}
      >
        <div style={{ padding: "12px 0" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px solid var(--border-muted)", paddingBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{selectedExam?.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Subject: {selectedExam?.subjectId?.name || "—"} &nbsp;|&nbsp;
              Total Marks: {totalMarks} &nbsp;|&nbsp;
              Duration: {selectedExam?.duration ? `${selectedExam.duration} min` : "—"}
            </div>
            {selectedExam?.examDate && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Date: {dayjs(selectedExam.examDate).format("DD MMMM YYYY")}
              </div>
            )}
          </div>

          {/* Sections */}
          {sections.map((sec) => (
            <div key={sec.key} style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                background: `color-mix(in srgb, ${sec.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${sec.color} 25%, transparent)`,
                borderRadius: 8, padding: "8px 14px", marginBottom: 8,
              }}>
                <span style={{ fontWeight: 700, color: sec.color }}>{sec.section}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {sec.questions} questions × {sec.marksEach} marks = <b style={{ color: sec.color }}>{sectionTotal(sec)} marks</b>
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", paddingLeft: 14 }}>
                Type: {sec.questionType}
              </div>
            </div>
          ))}

          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Questions: <b style={{ color: "var(--text-primary)" }}>{totalQuestions}</b></span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Marks: <b style={{ color: C.primary }}>{blueprintTotal}</b></span>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default PaperBuilder;
