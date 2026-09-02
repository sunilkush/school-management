import PDFDocument from "pdfkit";

/**
 * Streams a printable A4 report card.
 *
 * Same PDFKit constraints as subscriptionInvoicePdf.service.js: the standard Helvetica faces
 * can't render Unicode glyphs like the rupee sign or arrows, and en-GB month abbreviations drift
 * between ICU versions, so dates are formatted by hand.
 *
 * @param {object}   opts
 * @param {Writable} opts.stream    where to pipe the PDF (an Express res)
 * @param {object}   opts.card      lean ReportCard, with studentId/schoolClassId/sectionId populated
 * @param {object}   opts.template  lean ReportCardTemplate (name + options)
 * @param {object}   opts.school    lean School ({ name, address })
 */
export const renderReportCardPdf = ({ stream, card, template, school }) => {
  const ACCENT = "#2563EB";
  const INK = "#0F172A";
  const SUBTLE = "#64748B";
  const FAINT = "#94A3B8";
  const RULE = "#E5E9F0";
  const BAND = "#F5F7FB";
  const PASS = "#15803D";
  const FAIL = "#B91C1C";

  const M = 40;
  const RIGHT = 555;
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.pipe(stream);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d) => {
    if (!d) return "—";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "—";
    return `${String(x.getDate()).padStart(2, "0")} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  };
  const pct = (n) => `${(Number(n) || 0).toFixed(2)}%`;

  const rule = (y, from = M, to = RIGHT) =>
    doc.moveTo(from, y).lineTo(to, y).lineWidth(1).strokeColor(RULE).stroke();

  const label = (txt, x, y, w, align = "left") =>
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(FAINT)
      .text(String(txt).toUpperCase(), x, y, { width: w, align, characterSpacing: 0.8 });

  const options = template?.options || {};
  const student = card.studentId || {};
  const showBreakdown = options.showPerExamBreakdown !== false;

  /* ── Header ─────────────────────────────────────────────────── */
  doc.font("Helvetica-Bold").fontSize(16).fillColor(INK)
    .text(school?.name || "School", M, 42, { width: RIGHT - M, align: "center" });
  if (school?.address) {
    doc.font("Helvetica").fontSize(8.5).fillColor(SUBTLE)
      .text(school.address, M, 62, { width: RIGHT - M, align: "center" });
  }
  doc.font("Helvetica-Bold").fontSize(12).fillColor(ACCENT)
    .text("REPORT CARD", M, school?.address ? 80 : 66, { width: RIGHT - M, align: "center", characterSpacing: 1.5 });
  doc.font("Helvetica").fontSize(9.5).fillColor(SUBTLE)
    .text(template?.name || "", M, doc.y + 2, { width: RIGHT - M, align: "center" });

  rule(doc.y + 10);

  /* ── Student block ──────────────────────────────────────────── */
  const infoTop = doc.y + 18;
  const col2 = 320;

  label("Student", M, infoTop, 240);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK)
    .text(student.name || "—", M, infoTop + 12, { width: 240 });
  if (student.regId) {
    doc.font("Helvetica").fontSize(9).fillColor(SUBTLE)
      .text(`Reg. No. ${student.regId}`, M, doc.y + 1, { width: 240 });
  }

  label("Class", col2, infoTop, RIGHT - col2);
  const className = [card.schoolClassId?.name, card.sectionId?.name].filter(Boolean).join(" — ") || "—";
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK)
    .text(className, col2, infoTop + 12, { width: RIGHT - col2 });

  let y = Math.max(doc.y, infoTop + 44) + 14;
  rule(y);
  y += 16;

  /* ── Marks table ────────────────────────────────────────────── */
  const components = card.subjects?.[0]?.components || [];
  // Each constituent exam gets its own column when the template asks for the breakdown, but only
  // while they still fit beside the fixed Weighted/Grade columns.
  const examCols = showBreakdown ? components.map((c) => ({ examId: String(c.examId), name: c.examName })) : [];
  const fixedRight = 150;                       // Weighted % + Grade
  const subjectW = 130;
  const perExamW = examCols.length ? Math.min(70, (RIGHT - M - subjectW - fixedRight) / examCols.length) : 0;
  const usableExamCols = perExamW >= 42 ? examCols : [];

  const xSubject = M + 8;
  const xExam = (i) => M + 8 + subjectW + i * perExamW;
  const xWeighted = RIGHT - fixedRight + 10;
  const xGrade = RIGHT - 58;

  doc.rect(M, y, RIGHT - M, 22).fill(BAND);
  label("Subject", xSubject, y + 7, subjectW);
  usableExamCols.forEach((c, i) => label(c.name, xExam(i), y + 7, perExamW - 6));
  label("Weighted", xWeighted, y + 7, 62, "right");
  label("Grade", xGrade, y + 7, 48, "right");
  y += 22;

  for (const subject of card.subjects || []) {
    const rowY = y + 8;
    doc.font("Helvetica").fontSize(9.5).fillColor(INK)
      .text(subject.subjectName || "—", xSubject, rowY, { width: subjectW - 6, lineBreak: false });

    usableExamCols.forEach((col, i) => {
      const match = (subject.components || []).find((c) => String(c.examId) === col.examId);
      doc.font("Helvetica").fontSize(9).fillColor(SUBTLE).text(
        match ? `${match.obtainedMarks}/${match.totalMarks}` : "—",
        xExam(i), rowY, { width: perExamW - 6, lineBreak: false }
      );
    });

    doc.font("Helvetica").fontSize(9.5).fillColor(subject.isPassed === false ? FAIL : INK)
      .text(pct(subject.weightedPercentage), xWeighted, rowY, { width: 62, align: "right", lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(subject.isPassed === false ? FAIL : INK)
      .text(subject.grade || "—", xGrade, rowY, { width: 48, align: "right", lineBreak: false });

    y += 24;
    rule(y);
  }

  /* ── Totals ─────────────────────────────────────────────────── */
  y += 10;
  const totals = card.totals || {};
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK)
    .text("Overall", xSubject, y, { width: subjectW, lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(ACCENT)
    .text(pct(totals.percentage), xWeighted, y - 1, { width: 62, align: "right", lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(ACCENT)
    .text(totals.grade || "—", xGrade, y - 1, { width: 48, align: "right", lineBreak: false });
  y += 20;

  const chips = [];
  chips.push({ text: totals.resultStatus === "FAIL" ? "RESULT: FAIL" : "RESULT: PASS", color: totals.resultStatus === "FAIL" ? FAIL : PASS });
  if (options.showRank !== false && card.rank) chips.push({ text: `RANK: ${card.rank}`, color: INK });
  if (options.showAttendance !== false && card.attendance?.totalDays) {
    chips.push({ text: `ATTENDANCE: ${card.attendance.presentDays}/${card.attendance.totalDays} (${pct(card.attendance.percentage)})`, color: INK });
  }

  let chipX = M;
  chips.forEach((chip) => {
    const w = doc.font("Helvetica-Bold").fontSize(8.5).widthOfString(chip.text) + 18;
    doc.roundedRect(chipX, y, w, 20, 10).fillAndStroke(BAND, RULE);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(chip.color)
      .text(chip.text, chipX, y + 6, { width: w, align: "center", lineBreak: false });
    chipX += w + 8;
  });
  y += 34;

  /* ── Co-scholastic ──────────────────────────────────────────── */
  const coScholastic = (card.coScholastic || []).filter((c) => c.area);
  if (coScholastic.length) {
    label("Co-scholastic areas", M, y, RIGHT - M);
    y += 16;
    const colW = (RIGHT - M) / 2;
    coScholastic.forEach((entry, i) => {
      const cx = M + (i % 2) * colW;
      const cy = y + Math.floor(i / 2) * 20;
      doc.font("Helvetica").fontSize(9.5).fillColor(SUBTLE)
        .text(entry.area, cx, cy, { width: colW - 70, lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK)
        .text(entry.grade || "—", cx + colW - 66, cy, { width: 48, align: "right", lineBreak: false });
    });
    y += Math.ceil(coScholastic.length / 2) * 20 + 12;
    rule(y);
    y += 14;
  }

  /* ── Remarks ────────────────────────────────────────────────── */
  if (options.showRemarks !== false && card.classTeacherRemarks) {
    label("Class teacher's remarks", M, y, RIGHT - M);
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(INK)
      .text(card.classTeacherRemarks, M, y + 14, { width: RIGHT - M });
    y = doc.y + 16;
  }

  /* ── Signatures ─────────────────────────────────────────────── */
  const sigY = Math.max(y + 30, 690);
  const sigW = (RIGHT - M) / 3;
  ["Class Teacher", "Principal", "Parent / Guardian"].forEach((name, i) => {
    const sx = M + i * sigW;
    doc.moveTo(sx, sigY).lineTo(sx + sigW - 30, sigY).lineWidth(1).strokeColor(RULE).stroke();
    doc.font("Helvetica").fontSize(8.5).fillColor(SUBTLE)
      .text(name, sx, sigY + 6, { width: sigW - 30, align: "center", lineBreak: false });
  });

  /* ── Footer ─────────────────────────────────────────────────── */
  doc.font("Helvetica").fontSize(8).fillColor(FAINT).text(
    card.isPublished
      ? `Published ${fmtDate(card.publishedAt)}  ·  computer-generated report card`
      : `PROVISIONAL — not yet published  ·  generated ${fmtDate(card.generatedAt)}`,
    M, doc.page.height - 54,
    { width: RIGHT - M, align: "center", lineBreak: false }
  );

  doc.end();
};
