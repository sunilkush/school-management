import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const exportToExcel = async (attempts) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attempts Report");

  sheet.columns = [
    { header: "Student", key: "student", width: 25 },
    { header: "Exam", key: "exam", width: 25 },
    { header: "Score", key: "score", width: 10 },
    { header: "Status", key: "status", width: 15 },
    { header: "Date", key: "date", width: 20 },
  ];

  attempts.forEach((a) => {
    sheet.addRow({
      student: a.studentName,
      exam: a.examTitle,
      score: a.score,
      status: a.status,
      date: a.createdAt ? new Date(a.createdAt).toLocaleString() : "-",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const exportToPDF = async (attempts) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Attempts Report", { align: "center" });
    doc.moveDown();
    if (!attempts.length) {
      doc.fontSize(12).text("No records found.");
    }

    attempts.forEach((a, i) => {
      doc.fontSize(12).text(`${i + 1}. Student: ${a.studentName}`);
      doc.text(`   Exam: ${a.examTitle}`);
      doc.text(`   Score: ${a.score}`);
      doc.text(`   Status: ${a.status}`);
      doc.text(`   Date: ${a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}`);
      doc.moveDown();
    });

    doc.end();
  });

/**
 * Result Sheet — Excel export with subject-wise columns
 */
export const exportResultSheetExcel = async (results, exam) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Result Sheet");

  const subjects = (results[0]?.subjects || []).map((s) => ({
    name: s.subjectName || "Subject",
    id: `${s.subjectId}`,
    total: s.totalMarks,
  }));

  // Title rows
  const totalCols = 3 + subjects.length + 5;
  const lastCol = String.fromCharCode(64 + Math.min(totalCols, 26));
  sheet.addRow([]);
  const titleRow = sheet.addRow([`RESULT SHEET — ${exam?.title || "Exam"}`]);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  if (exam?.examDate) {
    const dateRow = sheet.addRow([`Exam Date: ${new Date(exam.examDate).toLocaleDateString("en-IN")}`]);
    dateRow.getCell(1).font = { italic: true, size: 10, color: { argb: "FF64748B" } };
    dateRow.getCell(1).alignment = { horizontal: "center" };
  }
  sheet.addRow(["* = Subject failed (below passing marks)"]).getCell(1).font = { italic: true, size: 9, color: { argb: "FF991B1B" } };
  sheet.addRow([]);

  const headers = [
    "Rank",
    "Student Name",
    "Roll No",
    ...subjects.map((s) => `${s.name}\n(/${s.total})`),
    "Total Obtained",
    "Max Marks",
    "Percentage",
    "Grade",
    "Result",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });
  headerRow.height = 36;

  results.forEach((r, rowIdx) => {
    const rowBg = rowIdx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF";
    const subMarks = subjects.map((sub) => {
      const found = r.subjects.find((s) => `${s.subjectId}` === sub.id);
      return found ? `${found.obtainedMarks}${!found.isPassed ? "*" : ""}` : "—";
    });

    const dataRow = sheet.addRow([
      r.rank ?? "—",
      r.studentId?.name || "—",
      r.studentId?.rollNumber || "—",
      ...subMarks,
      r.totalObtainedMarks,
      r.totalMaximumMarks,
      `${(r.percentage || 0).toFixed(1)}%`,
      r.grade || "—",
      r.resultStatus || "—",
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
    });

    // Name column left-aligned
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

    // Result cell colored
    const resultCell = dataRow.getCell(headers.length);
    if (r.resultStatus === "PASS") {
      resultCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      resultCell.font = { bold: true, color: { argb: "FF065F46" } };
    } else {
      resultCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      resultCell.font = { bold: true, color: { argb: "FF991B1B" } };
    }
    dataRow.height = 20;
  });

  // Column widths
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 12;
  subjects.forEach((_, i) => { sheet.getColumn(4 + i).width = 14; });
  const tail = 3 + subjects.length;
  sheet.getColumn(tail + 1).width = 14;
  sheet.getColumn(tail + 2).width = 12;
  sheet.getColumn(tail + 3).width = 12;
  sheet.getColumn(tail + 4).width = 8;
  sheet.getColumn(tail + 5).width = 10;

  // Summary footer
  sheet.addRow([]);
  const pass = results.filter((r) => r.resultStatus === "PASS").length;
  const summaryRow = sheet.addRow([
    `Total: ${results.length}`,
    `Pass: ${pass}`,
    `Fail: ${results.length - pass}`,
    `Pass %: ${results.length ? ((pass / results.length) * 100).toFixed(1) : 0}%`,
  ]);
  summaryRow.getCell(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Result Sheet — PDF marksheet (landscape A4, one table per page)
 */
export const exportResultSheetPdf = async (results, exam, className) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;  // 842
    const PH = doc.page.height; // 595
    const MX = 30;
    const subjects = results[0]?.subjects || [];

    // ── Header banner ──────────────────────────────────────────────
    doc.rect(0, 0, PW, 65).fill("#1E3A8A");
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
      .text("RESULT SHEET / MARKSHEET", MX, 12, { width: PW - MX * 2, align: "center" });
    doc.fontSize(10).font("Helvetica")
      .text(
        [exam?.title || "Examination", className ? `Class: ${className}` : null, exam?.examDate ? new Date(exam.examDate).toLocaleDateString("en-IN") : null]
          .filter(Boolean).join("  |  "),
        MX, 40, { width: PW - MX * 2, align: "center" }
      );

    // ── Table layout ───────────────────────────────────────────────
    const tableX = MX;
    const availW = PW - MX * 2;
    const ROW_H = 18;
    const HEAD_H = 24;

    // Fixed column widths
    const fixedW = [28, 130, 55]; // Rank, Name, Roll
    const tailW = [40, 40, 38, 32, 40]; // Total, Max, %, Grade, Result
    const subTotalW = availW - fixedW.reduce((a, b) => a + b, 0) - tailW.reduce((a, b) => a + b, 0);
    const subColW = subjects.length > 0 ? Math.max(30, Math.floor(subTotalW / subjects.length)) : 0;
    const colWidths = [...fixedW, ...subjects.map(() => subColW), ...tailW];
    const actualW = colWidths.reduce((a, b) => a + b, 0);

    const headers = [
      "#", "Student Name", "Roll",
      ...subjects.map((s) => `${s.subjectName || "Sub"}\n(/${s.totalMarks})`),
      "Obtained", "Max", "%", "Grade", "Result",
    ];

    const drawTableHeader = (y) => {
      doc.rect(tableX, y, actualW, HEAD_H).fill("#2563EB");
      let x = tableX;
      headers.forEach((h, i) => {
        doc.fillColor("#ffffff").fontSize(7).font("Helvetica-Bold")
          .text(h, x + 2, y + (h.includes("\n") ? 4 : 8), { width: colWidths[i] - 4, align: "center" });
        // vertical divider
        if (i < headers.length - 1) {
          doc.moveTo(x + colWidths[i], y).lineTo(x + colWidths[i], y + HEAD_H)
            .strokeColor("rgba(255,255,255,0.3)").lineWidth(0.5).stroke();
        }
        x += colWidths[i];
      });
      doc.rect(tableX, y, actualW, HEAD_H).stroke("#1D4ED8");
      return y + HEAD_H;
    };

    const drawDataRow = (r, idx, y) => {
      const isPass = r.resultStatus === "PASS";
      const bg = idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
      doc.rect(tableX, y, actualW, ROW_H).fill(bg).stroke("#E2E8F0");

      const subCells = subjects.map((sub) => {
        const found = r.subjects.find((s) => `${s.subjectId}` === `${sub.subjectId}`);
        return found ? `${found.obtainedMarks}${!found.isPassed ? "*" : ""}` : "—";
      });

      const cells = [
        r.rank ?? "—",
        r.studentId?.name || "—",
        r.studentId?.rollNumber || "—",
        ...subCells,
        r.totalObtainedMarks,
        r.totalMaximumMarks,
        `${(r.percentage || 0).toFixed(1)}%`,
        r.grade || "—",
        r.resultStatus || "—",
      ];

      let x = tableX;
      cells.forEach((val, i) => {
        const isResultCol = i === cells.length - 1;
        const isNameCol = i === 1;

        if (isResultCol) {
          doc.rect(x, y, colWidths[i], ROW_H).fill(isPass ? "#D1FAE5" : "#FEE2E2").stroke("#E2E8F0");
          doc.fillColor(isPass ? "#065F46" : "#991B1B").fontSize(7).font("Helvetica-Bold")
            .text(`${val}`, x + 2, y + 5, { width: colWidths[i] - 4, align: "center" });
        } else {
          doc.fillColor("#0F172A").fontSize(7)
            .font(isNameCol || i === 0 ? "Helvetica-Bold" : "Helvetica")
            .text(`${val}`, x + 3, y + 5, { width: colWidths[i] - 6, align: isNameCol ? "left" : "center" });
        }
        x += colWidths[i];
      });
      return y + ROW_H;
    };

    // ── Render table ───────────────────────────────────────────────
    let y = 80;
    y = drawTableHeader(y);

    results.forEach((r, i) => {
      if (y + ROW_H > PH - 50) {
        doc.addPage();
        y = drawTableHeader(30);
      }
      y = drawDataRow(r, i, y);
    });

    // ── Footer ─────────────────────────────────────────────────────
    const pass = results.filter((r) => r.resultStatus === "PASS").length;
    const avgPct = results.length ? (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(1) : 0;

    doc.fillColor("#64748B").fontSize(8).font("Helvetica")
      .text(
        `Total Students: ${results.length}  |  Pass: ${pass}  |  Fail: ${results.length - pass}  |  Pass Rate: ${results.length ? ((pass / results.length) * 100).toFixed(1) : 0}%  |  Class Avg: ${avgPct}%`,
        tableX, y + 10, { width: actualW }
      );
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, tableX, y + 22, { width: actualW, align: "right" });

    doc.end();
  });

/**
 * Admit Cards — PDF (2 cards per A4 portrait page)
 */
export const exportAdmitCardsPdf = async (cards, exam) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4", layout: "portrait" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;   // 595
    const PH = doc.page.height;  // 842
    const MX = 28;
    const MY = 28;
    const CARD_W = PW - MX * 2;
    const CARD_H = Math.floor((PH - MY * 3) / 2); // ~393
    const SEP_Y = MY + CARD_H + MY / 2;

    const fmtDate = (v) => {
      if (!v) return "—";
      try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
    };
    const fmtTime = (v) => {
      if (!v) return "—";
      try { return new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }); } catch { return "—"; }
    };

    const drawCard = (card, cardX, cardY, cardW, cardH) => {
      // Card border
      doc.save();
      doc.rect(cardX, cardY, cardW, cardH).fillAndStroke("#FFFFFF", "#CBD5E1");

      // Header strip
      const HDR_H = 48;
      doc.rect(cardX, cardY, cardW, HDR_H).fill("#2563EB");
      doc.fillColor("#FFFFFF").fontSize(15).font("Helvetica-Bold")
        .text("ADMIT CARD", cardX + 10, cardY + 8, { width: cardW - 20, align: "center" });
      doc.fontSize(8).font("Helvetica")
        .text(card.examTitle || exam?.title || "Examination", cardX + 10, cardY + 29, { width: cardW - 20, align: "center" });

      // Body
      const bodyY = cardY + HDR_H + 10;
      const col1X = cardX + 14;
      const col2X = cardX + cardW / 2 + 10;
      const LINE_H = 34;

      const field = (label, value, fx, fy, maxW = cardW / 2 - 24) => {
        doc.fillColor("#94A3B8").fontSize(6.5).font("Helvetica")
          .text(label.toUpperCase(), fx, fy, { width: maxW });
        doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold")
          .text(value || "—", fx, fy + 9, { width: maxW });
      };

      field("Student Name", card.studentName, col1X, bodyY);
      field("Roll Number", card.rollNumber, col1X, bodyY + LINE_H);
      field("Class / Section", [card.className, card.sectionName].filter(Boolean).join(" – ") || "—", col1X, bodyY + LINE_H * 2);
      field("Subject", card.subjectName || "—", col1X, bodyY + LINE_H * 3);

      field("Seat Number", card.seatNumber, col2X, bodyY);
      field("Exam Date", fmtDate(card.examDate), col2X, bodyY + LINE_H);
      field("Start Time", fmtTime(card.startTime), col2X, bodyY + LINE_H * 2);
      field("End Time", fmtTime(card.endTime), col2X, bodyY + LINE_H * 3);

      // Divider
      const instrY = bodyY + LINE_H * 4 + 8;
      doc.moveTo(col1X, instrY).lineTo(cardX + cardW - 14, instrY).strokeColor("#E2E8F0").lineWidth(0.5).stroke();

      // Instructions
      if (card.instructions?.length) {
        doc.fillColor("#B45309").fontSize(7).font("Helvetica-Bold")
          .text("INSTRUCTIONS:", col1X, instrY + 6);
        card.instructions.slice(0, 3).forEach((ins, i) => {
          doc.fillColor("#64748B").fontSize(7).font("Helvetica")
            .text(`${i + 1}. ${ins}`, col1X + 8, instrY + 18 + i * 13, { width: cardW - 28 });
        });
      }

      // Signature lines
      const SIG_Y = cardY + cardH - 32;
      const sigW = (cardW - 28) / 3;
      ["Student Signature", "Invigilator", "Principal"].forEach((lbl, i) => {
        const sx = cardX + 14 + i * (sigW + 5);
        doc.moveTo(sx, SIG_Y).lineTo(sx + sigW - 5, SIG_Y).strokeColor("#CBD5E1").lineWidth(0.8).stroke();
        doc.fillColor("#94A3B8").fontSize(6.5).font("Helvetica")
          .text(lbl, sx, SIG_Y + 4, { width: sigW - 5, align: "center" });
      });

      doc.restore();
    };

    cards.forEach((card, i) => {
      if (i % 2 === 0 && i > 0) doc.addPage();

      const cardY = i % 2 === 0 ? MY : SEP_Y + MY / 2;
      drawCard(card, MX, cardY, CARD_W, CARD_H);

      // Dashed separator between 2 cards on same page
      if (i % 2 === 0 && i + 1 < cards.length) {
        doc.save()
          .moveTo(MX, SEP_Y)
          .lineTo(MX + CARD_W, SEP_Y)
          .dash(4, { space: 4 })
          .strokeColor("#CBD5E1").lineWidth(0.8).stroke()
          .restore();
        // Scissors icon text
        doc.fillColor("#94A3B8").fontSize(7).font("Helvetica")
          .text("✂ cut here", MX + CARD_W / 2 - 20, SEP_Y - 8);
      }
    });

    doc.end();
  });
