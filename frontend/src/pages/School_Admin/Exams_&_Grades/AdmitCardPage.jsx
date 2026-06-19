import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Select, Table, Tag, Modal, Empty,
  Space, message, Tooltip, Badge,
} from "antd";
import {
  DownloadOutlined, EyeOutlined, IdcardOutlined,
  ThunderboltOutlined, CheckCircleFilled,
  ClockCircleOutlined, UserOutlined, BookOutlined,
  PrinterOutlined, TeamOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { generateAdmitCards, getAdmitCards, getExams } from "../../../features/examSlice";
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
  text:      "#0F172A",
  textSub:   "#64748B",
  textMuted: "#94A3B8",
  border:    "#E2E8F0",
  surface:   "#FFFFFF",
  bg:        "#F8FAFC",
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : dayjs(d).format("DD MMM YYYY, hh:mm A");
};

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : dayjs(d).format("DD MMM YYYY");
};

const escHtml = (v = "") =>
  String(v).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c]));

const buildPrintHtml = (card) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Admit Card – ${escHtml(card.studentName)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Segoe UI",Arial,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #E2E8F0;border-radius:16px;width:720px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;padding:28px 32px;display:flex;align-items:center;gap:20px}
    .school-logo{width:60px;height:60px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;flex-shrink:0}
    .header-text h1{font-size:22px;font-weight:800;letter-spacing:-.02em}
    .header-text p{font-size:13px;opacity:.8;margin-top:4px}
    .admit-badge{margin-left:auto;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.06em}
    .body{padding:28px 32px}
    .student-row{display:flex;align-items:center;gap:16px;padding:16px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;margin-bottom:24px}
    .avatar{width:52px;height:52px;border-radius:50%;background:#2563EB;color:#fff;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .student-name{font-size:18px;font-weight:800;color:#0F172A}
    .roll{font-size:13px;color:#64748B;margin-top:3px}
    .seat{margin-left:auto;background:#fff;border:1px solid #BFDBFE;border-radius:8px;padding:8px 16px;text-align:center}
    .seat-label{font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em}
    .seat-value{font-size:22px;font-weight:900;color:#2563EB}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
    .field{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px}
    .f-label{font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
    .f-value{font-size:14px;font-weight:600;color:#0F172A}
    .instructions{background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px 20px;margin-bottom:24px}
    .instr-title{font-size:12px;font-weight:700;color:#B45309;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
    .instr-title::before{content:"⚠ "}
    ul{padding-left:18px}
    li{font-size:13px;color:#64748B;margin-bottom:5px;line-height:1.5}
    .footer{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:8px;padding-top:24px;border-top:1px dashed #E2E8F0}
    .sign-box{text-align:center}
    .sign-line{border-top:1px solid #CBD5E1;margin-top:40px;padding-top:8px;font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
    @media print{body{background:#fff;padding:0}.card{box-shadow:none;border:none;border-radius:0;width:100%}}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="school-logo">🏫</div>
      <div class="header-text">
        <h1>Admit Card</h1>
        <p>${escHtml(card.examTitle)} — ${fmtDate(card.examDate)}</p>
      </div>
      <div class="admit-badge">CONFIDENTIAL</div>
    </div>
    <div class="body">
      <div class="student-row">
        <div class="avatar">${escHtml((card.studentName || "?")[0].toUpperCase())}</div>
        <div>
          <div class="student-name">${escHtml(card.studentName)}</div>
          <div class="roll">Roll No: ${escHtml(card.rollNumber)}</div>
        </div>
        <div class="seat">
          <div class="seat-label">Seat No</div>
          <div class="seat-value">${escHtml(card.seatNumber)}</div>
        </div>
      </div>
      <div class="grid">
        <div class="field"><div class="f-label">Subject</div><div class="f-value">${escHtml(card.subjectName || "—")}</div></div>
        <div class="field"><div class="f-label">Class / Section</div><div class="f-value">${escHtml([card.className, card.sectionName].filter(Boolean).join(" – ") || "—")}</div></div>
        <div class="field"><div class="f-label">Exam Date</div><div class="f-value">${fmtDate(card.examDate)}</div></div>
        <div class="field"><div class="f-label">Exam Time</div><div class="f-value">${fmt(card.startTime)} – ${fmt(card.endTime)}</div></div>
      </div>
      ${(card.instructions?.length) ? `
      <div class="instructions">
        <div class="instr-title">Important Instructions</div>
        <ul>${(card.instructions).map((i) => `<li>${escHtml(i)}</li>`).join("")}</ul>
      </div>` : ""}
      <div class="footer">
        <div class="sign-box"><div class="sign-line">Student Signature</div></div>
        <div class="sign-box"><div class="sign-line">Invigilator Signature</div></div>
        <div class="sign-box"><div class="sign-line">Principal / Controller</div></div>
      </div>
    </div>
  </div>
</body>
</html>`;

/* ── Stat chip ───────────────────────────────────────────────────── */
const StatChip = ({ icon, label, value, color, bg }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    background: bg, border: `1px solid ${color}25`,
    borderRadius: 12, padding: "10px 18px", flex: "1 1 130px",
  }}>
    <span style={{
      width: 34, height: 34, borderRadius: 8, background: `${color}15`,
      color, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
    }}>{icon}</span>
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{value}</div>
    </div>
  </div>
);

/* ── Main page ───────────────────────────────────────────────────── */
const AdmitCardPage = () => {
  const dispatch = useDispatch();
  const { exams = [], loading } = useSelector((s) => s.exams || {});
  const { selectedAcademicYear }  = useSelector((s) => s.academicYear || {});

  const [examId, setExamId]           = useState(null);
  const [rows, setRows]               = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const academicYear = useMemo(() => selectedAcademicYear?._id ? selectedAcademicYear : null, [selectedAcademicYear]);

  useEffect(() => {
    if (!academicYear?._id) return;
    dispatch(getExams({ schoolId: academicYear.schoolId, academicYearId: academicYear._id, limit: 100 }));
  }, [dispatch, academicYear]);

  const loadCards = async (id) => {
    if (!id) { setRows([]); setIsGenerated(false); return; }
    const res = await dispatch(getAdmitCards(id));
    if (getAdmitCards.fulfilled.match(res)) {
      setRows(res.payload.cards || []);
      setIsGenerated(Boolean(res.payload.meta?.isGenerated));
    }
  };

  const handleExamChange = (val) => { setExamId(val); loadCards(val); };

  const handleGenerate = async () => {
    if (!examId) return message.warning("Please select an exam first.");
    setGenerating(true);
    const res = await dispatch(generateAdmitCards(examId));
    setGenerating(false);
    if (generateAdmitCards.fulfilled.match(res)) {
      setRows(res.payload.cards || []);
      setIsGenerated(true);
      message.success(res.payload.message || "Admit cards generated!");
    } else {
      message.error(res.payload || "Failed to generate admit cards.");
    }
  };

  const handlePrint = (card) => {
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return message.error("Popup blocked — please allow popups.");
    w.document.write(buildPrintHtml(card));
    w.document.close();
    w.focus();
    w.print();
  };

  const selectedExam = useMemo(() => exams.find((e) => e._id === examId), [exams, examId]);

  const columns = [
    {
      title: "Student",
      dataIndex: "studentName",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: C.primaryBg, color: C.primary,
            fontWeight: 800, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {(v || "?")[0].toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: C.text }}>{v || "—"}</span>
        </div>
      ),
    },
    {
      title: "Roll No",
      dataIndex: "rollNumber",
      render: (v) => <Tag style={{ borderRadius: 6, fontWeight: 600, background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBd}` }}>{v || "—"}</Tag>,
    },
    {
      title: "Seat No",
      dataIndex: "seatNumber",
      render: (v) => <span style={{ fontWeight: 700, color: C.accent }}>{v || "—"}</span>,
    },
    {
      title: "Exam",
      dataIndex: "examTitle",
      ellipsis: true,
      render: (v) => <span style={{ fontSize: 13, color: C.textSub }}>{v || "—"}</span>,
    },
    {
      title: "Date",
      dataIndex: "examDate",
      render: (v) => <span style={{ fontSize: 12, color: C.textMuted }}>{fmtDate(v)}</span>,
    },
    {
      title: "Actions",
      width: 140,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Preview">
            <Button
              size="small" icon={<EyeOutlined />}
              onClick={() => setSelectedCard(record)}
              style={{ borderRadius: 7, borderColor: C.primary, color: C.primary }}
            />
          </Tooltip>
          <Tooltip title="Print / Download">
            <Button
              size="small" icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
              style={{ borderRadius: 7, borderColor: C.accent, color: C.accent }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
            <IdcardOutlined />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
              Admit Cards
            </div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 1 }}>
              Generate, view and download student admit cards
            </div>
          </div>
        </div>

        {isGenerated && (
          <Tag icon={<CheckCircleFilled />} color="success" style={{ borderRadius: 8, padding: "4px 12px", fontSize: 13 }}>
            Generated
          </Tag>
        )}
      </div>

      {/* ── Exam Selector + Generate ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 16,
        display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 280px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Select Exam
          </div>
          <Select
            showSearch
            placeholder="Search and select an exam…"
            value={examId}
            onChange={handleExamChange}
            loading={loading}
            style={{ width: "100%" }}
            size="large"
            options={exams.map((e) => ({ label: e.title, value: e._id }))}
            filterOption={(input, opt) => opt.label?.toLowerCase().includes(input.toLowerCase())}
          />
        </div>

        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          loading={generating}
          disabled={!examId || isGenerated}
          style={{
            borderRadius: 10, background: C.primary, borderColor: C.primary,
            fontWeight: 600, minWidth: 160,
          }}
        >
          {isGenerated ? "Already Generated" : "Generate Cards"}
        </Button>
      </div>

      {/* ── Stats ── */}
      {examId && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <StatChip icon={<TeamOutlined />}        label="Total Cards"   value={rows.length}                                       color={C.primary} bg={C.primaryBg} />
          <StatChip icon={<BookOutlined />}         label="Exam"          value={selectedExam?.title || "—"}                        color={C.accent}  bg={C.accentBg}  />
          <StatChip icon={<ClockCircleOutlined />}  label="Status"        value={isGenerated ? "Generated" : "Pending"}             color={isGenerated ? C.success : C.warning} bg={isGenerated ? C.successBg : C.warningBg} />
          <StatChip icon={<UserOutlined />}         label="Date"          value={selectedExam?.examDate ? fmtDate(selectedExam.examDate) : "—"} color={C.textSub} bg={C.bg} />
        </div>
      )}

      {/* ── Table ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
            Student List
            {rows.length > 0 && (
              <span style={{
                marginLeft: 8, background: C.primaryBg, color: C.primary,
                borderRadius: 99, fontSize: 11, fontWeight: 700,
                padding: "2px 8px", border: `1px solid ${C.primaryBd}`,
              }}>{rows.length}</span>
            )}
          </div>
          {rows.length > 0 && (
            <Button
              icon={<PrinterOutlined />} size="small"
              onClick={() => rows.forEach((r) => handlePrint(r))}
              style={{
                borderRadius: 8, borderColor: C.accent,
                color: C.accent, fontWeight: 600,
              }}
            >
              Print All
            </Button>
          )}
        </div>

        <Table
          rowKey={(r) => r._id || `${r.studentId}-${r.seatNumber}`}
          dataSource={rows}
          loading={loading || generating}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <IdcardOutlined style={{ fontSize: 40, color: C.textMuted, marginBottom: 12 }} />
                <div style={{ fontSize: 14, color: C.textSub, fontWeight: 600 }}>No admit cards yet</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                  Select an exam and click "Generate Cards"
                </div>
              </div>
            ),
          }}
          onRow={() => ({
            onMouseEnter: (e) => (e.currentTarget.style.background = C.bg),
            onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"),
          })}
        />
      </div>

      {/* ── Preview Modal ── */}
      <Modal
        open={Boolean(selectedCard)}
        onCancel={() => setSelectedCard(null)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IdcardOutlined style={{ color: C.primary, fontSize: 18 }} />
            <span style={{ fontWeight: 700, color: C.text }}>Admit Card Preview</span>
          </div>
        }
        footer={[
          <Button
            key="close" onClick={() => setSelectedCard(null)}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}
          >
            Close
          </Button>,
          <Button
            key="print" type="primary" icon={<PrinterOutlined />}
            onClick={() => handlePrint(selectedCard)}
            style={{ borderRadius: 8, background: C.primary, borderColor: C.primary, fontWeight: 600 }}
          >
            Print / Download
          </Button>,
        ]}
        width={600}
        styles={{ body: { padding: "12px 0" } }}
      >
        {selectedCard && (
          <div>
            {/* Card header strip */}
            <div style={{
              background: `linear-gradient(135deg, ${C.primary}, #1D4ED8)`,
              borderRadius: 12, padding: "20px 24px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)", color: "#fff",
                fontWeight: 800, fontSize: 22,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {(selectedCard.studentName || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{selectedCard.studentName}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>
                  Roll No: {selectedCard.rollNumber}
                </div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 10, padding: "8px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Seat No</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{selectedCard.seatNumber}</div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Exam",           value: selectedCard.examTitle },
                { label: "Subject",        value: selectedCard.subjectName || "—" },
                { label: "Class / Section",value: [selectedCard.className, selectedCard.sectionName].filter(Boolean).join(" – ") || "—" },
                { label: "Exam Date",      value: fmtDate(selectedCard.examDate) },
                { label: "Start Time",     value: fmt(selectedCard.startTime) },
                { label: "End Time",       value: fmt(selectedCard.endTime) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            {selectedCard.instructions?.length > 0 && (
              <div style={{
                background: C.warningBg, border: `1px solid ${C.warning}30`,
                borderRadius: 10, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                  ⚠ Instructions
                </div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {selectedCard.instructions.map((ins, i) => (
                    <li key={i} style={{ fontSize: 13, color: C.textSub, marginBottom: 4, lineHeight: 1.5 }}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signature row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12, marginTop: 20, paddingTop: 16,
              borderTop: `1px dashed ${C.border}`,
            }}>
              {["Student Signature", "Invigilator", "Principal"].map((lbl) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <div style={{ height: 36, borderBottom: `1px solid ${C.border}`, marginBottom: 6 }} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdmitCardPage;
