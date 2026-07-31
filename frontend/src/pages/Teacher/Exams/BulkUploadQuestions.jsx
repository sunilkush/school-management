import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { bulkCreateQuestions } from "../../../features/questionSlice";
import { Upload, Button, Table, Alert, Space, Tag, Divider, Tooltip } from "antd";
import {
  UploadOutlined, CloudUploadOutlined,
  DownloadOutlined, DeleteOutlined, CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { pageCard } from "../../../styles/pageStyles";

/* ── Excel column spec shown to users ── */
const COLUMNS = [
  { key: "statement",     label: "statement",     required: true,  hint: "Question text — pura sawaal likhein"                        },
  { key: "questionType",  label: "questionType",  required: true,  hint: "mcq_single | mcq_multi | true_false | fill_blank | match"   },
  { key: "difficulty",    label: "difficulty",    required: false, hint: "easy | medium | hard"                                        },
  { key: "marks",         label: "marks",         required: false, hint: "Number — default 1"                                          },
  { key: "negativeMarks", label: "negativeMarks", required: false, hint: "Number — default 0"                                          },
  { key: "option_A",      label: "option_A",      required: false, hint: "MCQ ke liye option A ka text"                                },
  { key: "option_B",      label: "option_B",      required: false, hint: "MCQ ke liye option B ka text"                                },
  { key: "option_C",      label: "option_C",      required: false, hint: "MCQ ke liye option C ka text"                                },
  { key: "option_D",      label: "option_D",      required: false, hint: "MCQ ke liye option D ka text"                                },
  { key: "correctAnswers",label: "correctAnswers",required: true,  hint: "Sahi jawab — MCQ ke liye A,B,C,D; fill_blank ke liye text"   },
  { key: "schoolClassId", label: "schoolClassId", required: true,  hint: "Class _id — Sheet 2 'Classes & Subjects' se copy karein"    },
  { key: "subjectId",     label: "subjectId",     required: true,  hint: "Subject _id — Sheet 2 'Classes & Subjects' se copy karein"  },
  { key: "chapterId",     label: "chapterId",     required: false, hint: "Chapter _id — Sheet 3 se copy karein (optional)"             },
  { key: "topic",         label: "topic",         required: false, hint: "Topic naam (optional)"                                       },
  { key: "tags",          label: "tags",          required: false, hint: "Comma-separated tags: math,algebra,easy"                     },
];

/* ── Style helpers for xlsx cells ── */
const headerStyle = {
  font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill:      { fgColor: { rgb: "2563EB" } },
  alignment: { horizontal: "center", wrapText: true },
  border: {
    top:    { style: "thin", color: { rgb: "1D4ED8" } },
    bottom: { style: "thin", color: { rgb: "1D4ED8" } },
    left:   { style: "thin", color: { rgb: "1D4ED8" } },
    right:  { style: "thin", color: { rgb: "1D4ED8" } },
  },
};
const requiredHeaderStyle = {
  ...headerStyle,
  fill: { fgColor: { rgb: "DC2626" } },
};
const sampleStyle = {
  fill:      { fgColor: { rgb: "F0FDF4" } },
  alignment: { wrapText: true },
};
const refHeaderStyle = {
  font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill:      { fgColor: { rgb: "7C3AED" } },
  alignment: { horizontal: "center" },
};
const altRowStyle = {
  fill: { fgColor: { rgb: "F5F3FF" } },
};
const instrHeaderStyle = {
  font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
  fill:      { fgColor: { rgb: "D97706" } },
  alignment: { horizontal: "center" },
};
const instrStyle = {
  alignment: { wrapText: true, vertical: "top" },
};

/* ── Apply styles to a range of cells ── */
const styleRange = (ws, startRow, endRow, cols, style) => {
  for (let r = startRow; r <= endRow; r++) {
    cols.forEach((col) => {
      const ref = `${col}${r}`;
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = style;
    });
  }
};

/* ── Main template generator ── */
const downloadTemplate = (classAssignTeacher = []) => {
  const wb = XLSX.utils.book_new();

  /* ────────────────────────────────
     SHEET 1 — Questions Template
  ──────────────────────────────── */
  const headers = COLUMNS.map((c) => c.label);

  const sampleRows = [
    {
      statement:      "Bharat ka rashtrapita kaun hai?",
      questionType:   "mcq_single",
      difficulty:     "easy",
      marks:          1,
      negativeMarks:  0,
      option_A:       "Jawaharlal Nehru",
      option_B:       "Mahatma Gandhi",
      option_C:       "Subhas Chandra Bose",
      option_D:       "Sardar Patel",
      correctAnswers: "B",
      schoolClassId:  classAssignTeacher[0]?._id || "<class _id — Sheet 2 dekhen>",
      subjectId:      (() => {
        const c = classAssignTeacher[0];
        const sub = c?.subjects?.[0]?.subjectId || c?.sections?.[0]?.subjects?.[0]?.subjectId;
        return (typeof sub === "object" ? sub._id : sub) || "<subject _id — Sheet 2 dekhen>";
      })(),
      chapterId:      "",
      topic:          "Swatantrata Sangram",
      tags:           "civics,history",
    },
    {
      statement:      "2 + 2 × 2 = ?",
      questionType:   "mcq_single",
      difficulty:     "medium",
      marks:          2,
      negativeMarks:  0.5,
      option_A:       "8",
      option_B:       "6",
      option_C:       "4",
      option_D:       "10",
      correctAnswers: "B",
      schoolClassId:  classAssignTeacher[0]?._id || "<class _id — Sheet 2 dekhen>",
      subjectId:      (() => {
        const c = classAssignTeacher[0];
        const sub = c?.subjects?.[1]?.subjectId || c?.subjects?.[0]?.subjectId || c?.sections?.[0]?.subjects?.[0]?.subjectId;
        return (typeof sub === "object" ? sub._id : sub) || "<subject _id — Sheet 2 dekhen>";
      })(),
      chapterId:      "",
      topic:          "BODMAS",
      tags:           "math,arithmetic",
    },
    {
      statement:      "Prithvi suraj ke chaaron taraf ghoomti hai.",
      questionType:   "true_false",
      difficulty:     "easy",
      marks:          1,
      negativeMarks:  0,
      option_A:       "",
      option_B:       "",
      option_C:       "",
      option_D:       "",
      correctAnswers: "true",
      schoolClassId:  classAssignTeacher[0]?._id || "<class _id — Sheet 2 dekhen>",
      subjectId:      (() => {
        const c = classAssignTeacher[0];
        const sub = c?.subjects?.[0]?.subjectId || c?.sections?.[0]?.subjects?.[0]?.subjectId;
        return (typeof sub === "object" ? sub._id : sub) || "<subject _id — Sheet 2 dekhen>";
      })(),
      chapterId:      "",
      topic:          "Solar System",
      tags:           "science,space",
    },
    {
      statement:      "Bharat ki rajdhani _____ hai.",
      questionType:   "fill_blank",
      difficulty:     "easy",
      marks:          1,
      negativeMarks:  0,
      option_A:       "",
      option_B:       "",
      option_C:       "",
      option_D:       "",
      correctAnswers: "New Delhi",
      schoolClassId:  classAssignTeacher[0]?._id || "<class _id — Sheet 2 dekhen>",
      subjectId:      (() => {
        const c = classAssignTeacher[0];
        const sub = c?.subjects?.[0]?.subjectId || c?.sections?.[0]?.subjects?.[0]?.subjectId;
        return (typeof sub === "object" ? sub._id : sub) || "<subject _id — Sheet 2 dekhen>";
      })(),
      chapterId:      "",
      topic:          "Geography",
      tags:           "geography",
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

  /* Column widths */
  ws1["!cols"] = [
    { wch: 45 }, { wch: 14 }, { wch: 10 }, { wch: 7 }, { wch: 13 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
  ];

  /* Row heights */
  ws1["!rows"] = [{ hpt: 30 }, { hpt: 24 }, { hpt: 24 }, { hpt: 24 }, { hpt: 24 }];

  /* Style header row */
  const alphaCols = "ABCDEFGHIJKLMNO".split("");
  COLUMNS.forEach((col, i) => {
    const ref = `${alphaCols[i]}1`;
    if (!ws1[ref]) ws1[ref] = { v: col.label, t: "s" };
    ws1[ref].s = col.required ? requiredHeaderStyle : headerStyle;
  });

  /* Style sample rows */
  styleRange(ws1, 2, 5, alphaCols.slice(0, COLUMNS.length), sampleStyle);

  XLSX.utils.book_append_sheet(wb, ws1, "Questions Template");

  /* ────────────────────────────────
     SHEET 2 — Classes & Subjects
  ──────────────────────────────── */
  const refData = [];
  classAssignTeacher.forEach((cls) => {
    const classId   = cls?._id        || "";
    const className = cls?.name       || "";

    const addSub = (s) => {
      const subId   = (typeof s?.subjectId === "object" ? s?.subjectId?._id : s?.subjectId) || s?._id || "";
      const subName = s?.subjectId?.name || s?.name || "";
      if (subId && subName) {
        refData.push({ "Class Naam": className, "Class _id (copy this)": classId, "Subject Naam": subName, "Subject _id (copy this)": subId });
      }
    };
    (cls?.subjects || []).forEach(addSub);
    (cls?.sections || []).forEach((sec) => (sec?.subjects || []).forEach(addSub));
    if (!(cls?.subjects?.length) && !(cls?.sections?.some((s) => s?.subjects?.length))) {
      refData.push({ "Class Naam": className, "Class _id (copy this)": classId, "Subject Naam": "—", "Subject _id (copy this)": "—" });
    }
  });

  if (!refData.length) {
    refData.push({
      "Class Naam": "Koi class assign nahi",
      "Class _id (copy this)": "—",
      "Subject Naam": "Pehle class assign karein",
      "Subject _id (copy this)": "—",
    });
  }

  const ws2 = XLSX.utils.json_to_sheet(refData);
  ws2["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 22 }, { wch: 30 }];
  ws2["!rows"] = [{ hpt: 28 }];

  const ref2Cols = ["A", "B", "C", "D"];
  ref2Cols.forEach((col) => {
    const ref = `${col}1`;
    if (!ws2[ref]) ws2[ref] = { v: "", t: "s" };
    ws2[ref].s = refHeaderStyle;
  });

  /* Alternate row shading */
  const rowCount2 = refData.length + 1;
  for (let r = 2; r <= rowCount2; r++) {
    if (r % 2 === 0) styleRange(ws2, r, r, ref2Cols, altRowStyle);
  }

  XLSX.utils.book_append_sheet(wb, ws2, "Classes & Subjects");

  /* ────────────────────────────────
     SHEET 3 — Instructions
  ──────────────────────────────── */
  const instrRows = [
    ["Column",         "Required?", "Allowed Values / Format",                                         "Example"],
    ["statement",      "✅ Yes",     "Any text — question ka pura sawaal",                               "Bharat ki rajdhani kya hai?"],
    ["questionType",   "✅ Yes",     "mcq_single | mcq_multi | true_false | fill_blank | match",         "mcq_single"],
    ["difficulty",     "No",        "easy | medium | hard",                                             "easy"],
    ["marks",          "No",        "Number (default: 1)",                                              "2"],
    ["negativeMarks",  "No",        "Number (default: 0)",                                              "0.5"],
    ["option_A",       "No*",       "MCQ ke liye option A ka text (* MCQ mein required)",               "New Delhi"],
    ["option_B",       "No*",       "MCQ ke liye option B ka text",                                     "Mumbai"],
    ["option_C",       "No*",       "MCQ ke liye option C ka text",                                     "Kolkata"],
    ["option_D",       "No*",       "MCQ ke liye option D ka text",                                     "Chennai"],
    ["correctAnswers", "✅ Yes",     "MCQ → A / B / C / D  (multi ke liye A,B). fill_blank → actual text. true_false → true/false", "B"],
    ["schoolClassId",  "✅ Yes",     "Sheet 2 'Classes & Subjects' se Class _id copy karein",            "(24-char MongoDB ID)"],
    ["subjectId",      "✅ Yes",     "Sheet 2 'Classes & Subjects' se Subject _id copy karein",          "(24-char MongoDB ID)"],
    ["chapterId",      "No",        "Sheet 3 se Chapter _id (agar available ho)",                       "(24-char MongoDB ID)"],
    ["topic",          "No",        "Topic naam (free text)",                                           "Swatantrata Sangram"],
    ["tags",           "No",        "Comma-separated tags",                                             "math,algebra,easy"],
    [],
    ["💡 Tips", "", "", ""],
    ["1", "Sheet 2 se class aur subject ke _id copy karein — galat ID dene par upload fail hoga.", "", ""],
    ["2", "mcq_single — sirf ek sahi jawab (A/B/C/D).  mcq_multi — comma se alag karein (A,C).", "", ""],
    ["3", "true_false ke liye options blank rakhen; correctAnswers mein 'true' ya 'false' likhein.", "", ""],
    ["4", "fill_blank ke liye options blank rakhen; correctAnswers mein exact text likhein.", "", ""],
    ["5", "Ek se zyada correct answers MCQ_multi ke liye: A,C  (bina space ke)", "", ""],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(instrRows);
  ws3["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 60 }, { wch: 30 }];
  ws3["!rows"] = instrRows.map((_, i) => ({ hpt: i === 0 || i === 17 ? 28 : 22 }));

  /* Style header row */
  ["A1", "B1", "C1", "D1"].forEach((ref) => {
    if (!ws3[ref]) ws3[ref] = { v: "", t: "s" };
    ws3[ref].s = instrHeaderStyle;
  });

  /* Style data rows */
  for (let r = 2; r <= instrRows.length; r++) {
    ["A", "B", "C", "D"].forEach((col) => {
      const ref = `${col}${r}`;
      if (!ws3[ref]) return;
      ws3[ref].s = instrStyle;
    });
  }

  /* Tips header */
  const tipRef = `A18`;
  if (ws3[tipRef]) ws3[tipRef].s = { font: { bold: true, sz: 12, color: { rgb: "D97706" } } };

  XLSX.utils.book_append_sheet(wb, ws3, "Instructions");

  XLSX.writeFile(wb, "question_bank_template.xlsx");
};

/* ══════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════ */
/**
 * Props:
 *  onSuccess     — callback after a successful upload
 *  schoolId      — Super Admin only: which school these questions belong to (Super Admin has no
 *                  school of their own, so the parent page's School filter supplies this)
 *  classOptions  — Super Admin only: override for the class/subject reference sheet in the
 *                  downloadable template — classAssignTeacher (this teacher's assigned classes)
 *                  doesn't apply to Super Admin, who isn't assigned to any class
 */
const BulkUploadQuestions = ({ onSuccess, schoolId, classOptions: classOptionsProp }) => {
  const dispatch = useDispatch();

  const { classAssignTeacher = [] } = useSelector((s) => s.class || {});
  const classOptions = classOptionsProp?.length ? classOptionsProp : classAssignTeacher;

  const [rows,      setRows]      = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState(null);

  /* ── Parse uploaded Excel — convert option_A/B/C/D → options array ── */
  const parseRows = (raw) => {
    return raw.map((r) => {
      const optionFields = ["A", "B", "C", "D"];
      const options = optionFields
        .map((key) => ({ key, text: String(r[`option_${key}`] || "").trim() }))
        .filter((o) => o.text);

      const correctAnswers = String(r.correctAnswers || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        statement:     r.statement,
        questionType:  r.questionType,
        difficulty:    r.difficulty,
        marks:         r.marks,
        negativeMarks: r.negativeMarks,
        options:       options.length ? options : undefined,
        correctAnswers,
        schoolClassId: r.schoolClassId,
        subjectId:     r.subjectId,
        chapterId:     r.chapterId || undefined,
        topic:         r.topic     || undefined,
        tags:          r.tags ? String(r.tags).split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };
    });
  };

  const handleFile = (file) => {
    setDone(false);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!data.length) { setError("File empty hai — koi data nahi mila"); return; }
        setRows(data);
      } catch {
        setError("File parse nahi ho saka. Valid .xlsx file select karein.");
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleUpload = async () => {
    if (!rows.length) return;
    setUploading(true);
    setError(null);
    try {
      const parsed = parseRows(rows);
      await dispatch(bulkCreateQuestions(schoolId ? { questions: parsed, schoolId } : parsed)).unwrap();
      setDone(true);
      setRows([]);
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Upload failed. Server se error aaya.");
    } finally {
      setUploading(false);
    }
  };

  const previewCols = rows.length
    ? Object.keys(rows[0]).map((k) => ({
        title:     k,
        dataIndex: k,
        key:       k,
        ellipsis:  true,
        width:     140,
        render:    (v) => (v === "" || v == null)
          ? <span style={{ color: "var(--text-muted)" }}>—</span>
          : String(v),
      }))
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Format guide ── */}
      <div style={{ ...pageCard, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              Excel Template Download Karein
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>
              Template mein <strong>3 sheets</strong> hain:
              <br />
              📄 <strong>Sheet 1</strong> — Bhare hue sample questions (dekh ke samjhein)
              <br />
              🔑 <strong>Sheet 2</strong> — Aapki classes &amp; subjects ke IDs (copy karein)
              <br />
              📘 <strong>Sheet 3</strong> — Instructions &amp; allowed values
            </div>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadTemplate(classOptions)}
            style={{ flexShrink: 0 }}
          >
            Template Download
          </Button>
        </div>

        {/* Column quick-reference */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Required columns <span style={{ color: "#DC2626" }}>(red header)</span> &nbsp;·&nbsp; Optional columns <span style={{ color: "#2563EB" }}>(blue header)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {COLUMNS.map((c) => (
              <Tooltip key={c.key} title={c.hint}>
                <Tag
                  color={c.required ? "red" : "blue"}
                  style={{ cursor: "help", fontSize: 11 }}
                >
                  {c.label}{c.required ? " *" : ""}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: "#FFF7ED", borderRadius: 8,
          border: "1px solid #FED7AA",
          fontSize: 12, color: "#92400E", lineHeight: 1.7,
        }}>
          <InfoCircleOutlined style={{ marginRight: 6 }} />
          <strong>schoolClassId</strong> aur <strong>subjectId</strong> ke liye — template ki <em>Sheet 2</em> kholein,
          wahan se sahi ID copy karke Sheet 1 mein paste karein.
        </div>
      </div>

      {/* ── Upload area ── */}
      <div style={{ ...pageCard, padding: 20 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircleOutlined style={{ fontSize: 40, color: "#22C55E", display: "block", marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Upload successful!
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              Questions question bank mein add ho gaye.
            </div>
            <Button style={{ marginTop: 16 }} onClick={() => setDone(false)}>
              Aur Upload Karein
            </Button>
          </div>
        ) : (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {error && (
              <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
            )}

            <Upload
              beforeUpload={handleFile}
              accept=".xlsx,.xls"
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="large" block>
                Excel File Select Karein (.xlsx / .xls)
              </Button>
            </Upload>

            {rows.length > 0 && (
              <>
                <Divider style={{ margin: "4px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Preview</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{rows.length} records</Tag>
                    <Tag color="default">{Object.keys(rows[0]).length} columns</Tag>
                    {rows.length > 5 && (
                      <Tag color="gold">First 5 rows shown — {rows.length - 5} aur bhi hain</Tag>
                    )}
                  </div>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setRows([])}
                    danger
                  >
                    Clear
                  </Button>
                </div>

                <Table
                  columns={previewCols}
                  dataSource={rows.slice(0, 5)}
                  rowKey={(_, i) => i}
                  size="small"
                  bordered
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  style={{ fontSize: 12 }}
                />

                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={handleUpload}
                  loading={uploading}
                  size="large"
                  block
                >
                  {uploading ? "Uploading..." : `Upload ${rows.length} Questions`}
                </Button>
              </>
            )}
          </Space>
        )}
      </div>
    </div>
  );
};

export default BulkUploadQuestions;
