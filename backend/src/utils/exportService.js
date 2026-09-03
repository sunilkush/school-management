import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { generateQrBuffer } from "./qrService.js";
import { drawCode128 } from "./code128.js";

const buildVerifyUrl = (path) => `${process.env.FRONTEND_URL || "http://localhost:5173"}${path}`;

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

/**
 * Certificate — formal single-page A4 portrait document
 * (Transfer / Bonafide / Character / Study Certificate)
 */
export const exportCertificatePdf = async (certificate, school) => {
  const qrBuffer = await generateQrBuffer(
    buildVerifyUrl(`/verify/certificate/${certificate.certificateNumber}`),
    140
  ).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", layout: "portrait" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;
    const PH = doc.page.height;

    const fmtDate = (v) => {
      if (!v) return "—";
      try {
        return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
      } catch {
        return "—";
      }
    };

    // ── Outer border ──────────────────────────────────────────────
    doc.rect(20, 20, PW - 40, PH - 40).lineWidth(1.5).stroke("#1E3A8A");

    // ── Header banner ────────────────────────────────────────────
    const HDR_H = 70;
    doc.rect(20, 20, PW - 40, HDR_H).fill("#1E3A8A");
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
      .text(school?.name || "School", 30, 34, { width: PW - 60, align: "center" });
    doc.fontSize(9).font("Helvetica")
      .text(
        [school?.address, school?.phone, school?.email].filter(Boolean).join("  |  "),
        30, 58, { width: PW - 60, align: "center" }
      );

    // ── QR verification code (top-right corner of the header) ─────
    if (qrBuffer) {
      const qrSize = 44;
      const qrX = PW - 20 - 8 - qrSize;
      const qrY = 20 + (HDR_H - qrSize) / 2;
      doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill("#ffffff");
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    }

    // ── Title block ──────────────────────────────────────────────
    let y = 20 + HDR_H + 24;
    doc.fillColor("#0F172A").fontSize(16).font("Helvetica-Bold")
      .text((certificate.certificateType || "CERTIFICATE").toUpperCase(), 30, y, { width: PW - 60, align: "center", underline: true });
    y += 30;

    doc.fontSize(9).font("Helvetica").fillColor("#475569")
      .text(`Certificate No: ${certificate.certificateNumber}`, 40, y, { width: (PW - 80) / 2, align: "left" });
    doc.text(`Date: ${fmtDate(certificate.issueDate)}`, PW / 2, y, { width: (PW - 80) / 2, align: "right" });
    y += 26;

    // ── Revoked watermark ────────────────────────────────────────
    if (certificate.status === "Revoked") {
      doc.save();
      doc.rotate(-35, { origin: [PW / 2, PH / 2] });
      doc.fillColor("#EF4444", 0.18).fontSize(70).font("Helvetica-Bold")
        .text("REVOKED", 0, PH / 2 - 40, { width: PW, align: "center" });
      doc.restore();
    }

    // ── Field grid ───────────────────────────────────────────────
    const field = (label, value, x, fy, maxW) => {
      doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica")
        .text(label.toUpperCase(), x, fy, { width: maxW });
      doc.fillColor("#0F172A").fontSize(10.5).font("Helvetica-Bold")
        .text(value || "—", x, fy + 11, { width: maxW });
    };

    const colW = (PW - 80 - 20) / 2;
    const col1X = 40;
    const col2X = 40 + colW + 20;
    const rowH = 34;

    const classSection = [certificate.className, certificate.sectionName].filter(Boolean).join(" - ") || "—";

    const rows = [
      ["Student Name", certificate.studentName],
      ["Father's Name", certificate.fatherName],
      ["Mother's Name", certificate.motherName],
      ["Date of Birth", fmtDate(certificate.dateOfBirth)],
      ["Class / Section", classSection],
      ["Roll Number", certificate.rollNumber],
      ["Registration No.", certificate.registrationNumber],
      ["Admission Date", fmtDate(certificate.admissionDate)],
    ];

    if (certificate.certificateType === "Transfer Certificate") {
      rows.push(["Date of Leaving", fmtDate(certificate.dateOfLeaving)]);
      rows.push(["Reason for Leaving", certificate.reasonForLeaving]);
      rows.push(["Conduct", certificate.conduct]);
    } else if (certificate.certificateType === "Character Certificate") {
      rows.push(["Conduct", certificate.conduct]);
    } else {
      rows.push(["Purpose", certificate.purpose]);
    }
    rows.push(["Address", certificate.address]);

    rows.forEach((r, i) => {
      const x = i % 2 === 0 ? col1X : col2X;
      const rowY = y + Math.floor(i / 2) * rowH;
      field(r[0], r[1], x, rowY, colW);
    });

    y += Math.ceil(rows.length / 2) * rowH + 16;

    // ── Narrative paragraph ─────────────────────────────────────
    let narrative = "";
    if (certificate.certificateType === "Transfer Certificate") {
      narrative = `This is to certify that ${certificate.studentName}, son/daughter of ${certificate.fatherName || "—"}, was a bona fide student of ${school?.name || "this institution"}, studying in class ${classSection}. He/she was admitted on ${fmtDate(certificate.admissionDate)} and left the institution on ${fmtDate(certificate.dateOfLeaving)}. His/her conduct during the period of study was ${certificate.conduct || "satisfactory"}. Reason for leaving: ${certificate.reasonForLeaving || "not specified"}.`;
    } else if (certificate.certificateType === "Character Certificate") {
      narrative = `This is to certify that ${certificate.studentName}, son/daughter of ${certificate.fatherName || "—"}, is/was a student of ${school?.name || "this institution"}, studying in class ${classSection}. His/her conduct and character during the period of study at this institution have been found to be ${certificate.conduct || "satisfactory"}.`;
    } else {
      narrative = `This is to certify that ${certificate.studentName}, son/daughter of ${certificate.fatherName || "—"}, is a bona fide student of ${school?.name || "this institution"}, presently studying in class ${classSection}. This certificate is issued for the purpose of ${certificate.purpose || "official use"}.`;
    }

    doc.fillColor("#1E293B").fontSize(10.5).font("Helvetica")
      .text(narrative, 40, y, { width: PW - 80, align: "justify", lineGap: 4 });

    y = doc.y + 20;

    if (certificate.remarks) {
      doc.fillColor("#475569").fontSize(9).font("Helvetica-Oblique")
        .text(`Remarks: ${certificate.remarks}`, 40, y, { width: PW - 80 });
      y = doc.y + 20;
    }

    // ── Signature block ──────────────────────────────────────────
    const sigY = Math.max(y + 40, PH - 130);
    const sigW = (PW - 80 - 40) / 2;

    doc.moveTo(40, sigY).lineTo(40 + sigW, sigY).lineWidth(0.8).stroke("#CBD5E1");
    doc.fillColor("#64748B").fontSize(8).font("Helvetica")
      .text("Date & Place", 40, sigY + 5, { width: sigW, align: "center" });

    const sig2X = PW - 40 - sigW;
    doc.moveTo(sig2X, sigY).lineTo(sig2X + sigW, sigY).lineWidth(0.8).stroke("#CBD5E1");
    if (certificate.signatoryName) {
      doc.fillColor("#0F172A").fontSize(9).font("Helvetica-Bold")
        .text(certificate.signatoryName, sig2X, sigY - 16, { width: sigW, align: "center" });
    }
    doc.fillColor("#64748B").fontSize(8).font("Helvetica")
      .text(certificate.signatoryDesignation || "Principal", sig2X, sigY + 5, { width: sigW, align: "center" });

    // ── Footer ───────────────────────────────────────────────────
    // Must stay within the 50pt bottom margin set on the PDFDocument above — a y position past
    // (PH - margin) makes pdfkit treat this text as overflow and silently push it onto a new page.
    doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica")
      .text(
        `This is a computer-generated certificate. | Certificate No: ${certificate.certificateNumber} | Generated: ${new Date().toLocaleString("en-IN")}`,
        40, PH - 65, { width: PW - 80, align: "center" }
      );

    doc.end();
  });
};

/* ── Avatar initials palette (mirrors frontend styles/pageStyles.js) ── */
const AVATAR_PALETTE = [
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#CCFBF1", color: "#0D9488" },
  { bg: "#DCFCE7", color: "#15803D" },
  { bg: "#FEE2E2", color: "#DC2626" },
  { bg: "#FEF3C7", color: "#B45309" },
  { bg: "#EDE9FE", color: "#6D28D9" },
];
const avatarPalette = (name = "") => AVATAR_PALETTE[(name.charCodeAt(0) || 65) % AVATAR_PALETTE.length];

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

/**
 * ID Cards — portrait lanyard-badge style (student or staff), 4 per A4 sheet
 * (2 columns x 2 rows): solid navy wave header, circular photo frame, pill-style
 * role badge, and a navy footer band with the school logo/name on the left and a
 * QR code on the right (the platform's /verify/id-card flow scans QR, not a
 * barcode, so the QR takes the "scan me" icon's spot in the reference design).
 */
export const exportIdCardsPdf = async (cards, school) => {
  const photoBuffers = new Map(
    await Promise.all(
      cards.map(async (card) => [`${card._id}`, await fetchImageBuffer(card.photoUrl)])
    )
  );
  const qrBuffers = new Map(
    await Promise.all(
      cards.map(async (card) => [
        `${card._id}`,
        await generateQrBuffer(buildVerifyUrl(`/verify/id-card/${card.cardNumber}`), 120).catch(() => null),
      ])
    )
  );
  const logoBuffer = await fetchImageBuffer(school?.logo);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "portrait" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;
    const MX = 30;
    const MY = 30;

    const CARD_W = 220;
    const CARD_H = 360;
    const GAP_X = 24;
    const GAP_Y = 24;
    const COLS = 2;
    const ROWS = 2;
    const PER_PAGE = COLS * ROWS;

    const gridW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const startX = MX + ((PW - MX * 2) - gridW) / 2;
    const startY = MY + 24; // room for a thin page title line

    const NAVY = "#1B1F4B";

    // The school year a card covers, taken from the card’s own dates: issued June 2025 and
    // valid to March 2026 makes it a 2025-2026 card. Reading it off the card means it keeps
    // saying what it said when it was printed, even after the school rolls over to the next
    // session.
    const schoolYearOf = (card) => {
      const start = card.issueDate ? new Date(card.issueDate).getFullYear() : null;
      const end = card.validUntil ? new Date(card.validUntil).getFullYear() : null;
      if (!start) return "—";
      return end && end !== start ? `${start}-${end}` : `${start}-${start + 1}`;
    };
    // Second brand colour, used for the ribbon under the navy wave and the section labels on
    // the back — the layered navy/orange look the school asked for.
    const ORANGE = "#E9A44C";
    const TEXT_MUTED = "#64748B";
    const TEXT_DARK = "#152A52";

    const fmtDate = (v) => {
      if (!v) return "—";
      try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
    };

    const drawInitialsAvatar = (card, cx, cy, r) => {
      const { bg, color } = avatarPalette(card.fullName);
      doc.circle(cx, cy, r).fill(bg);
      doc.fillColor(color).fontSize(r).font("Helvetica-Bold")
        .text((card.fullName || "?")[0].toUpperCase(), cx - r, cy - r / 2, { width: r * 2, align: "center" });
    };

    // 4 navy corner brackets on the white QR box, standing in for the QR when one couldn't be
    // generated — matches the reference design's "scan me" icon.
    const drawScanIcon = (bx, by, s) => {
      const L = s * 0.3;
      doc.lineWidth(2).strokeColor(NAVY);
      doc.moveTo(bx, by + L).lineTo(bx, by).lineTo(bx + L, by).stroke();
      doc.moveTo(bx + s - L, by).lineTo(bx + s, by).lineTo(bx + s, by + L).stroke();
      doc.moveTo(bx, by + s - L).lineTo(bx, by + s).lineTo(bx + L, by + s).stroke();
      doc.moveTo(bx + s - L, by + s).lineTo(bx + s, by + s).lineTo(bx + s, by + s - L).stroke();
    };

    /**
     * Layered wave band across the top of a card.
     *
     * Drawn twice per card with the same curve — orange slightly lower and first, navy on top —
     * so the orange reads as a ribbon following the navy edge rather than as a separate shape.
     */
    const drawTopWave = (x, y, edgeY, dipY, color) => {
      doc.moveTo(x, y)
        .lineTo(x + CARD_W, y)
        .lineTo(x + CARD_W, edgeY)
        .bezierCurveTo(
          x + CARD_W * 0.80, edgeY + (dipY - edgeY) * 0.92,
          x + CARD_W * 0.62, dipY,
          x + CARD_W * 0.44, dipY
        )
        .bezierCurveTo(
          x + CARD_W * 0.24, dipY,
          x + CARD_W * 0.12, edgeY + (dipY - edgeY) * 0.5,
          x, edgeY - 12
        )
        .closePath()
        .fill(color);
    };

    /** The same band mirrored along the bottom edge, used on the back of the card. */
    const drawBottomWave = (x, y, edgeY, riseY, color) => {
      doc.moveTo(x, y + CARD_H)
        .lineTo(x + CARD_W, y + CARD_H)
        .lineTo(x + CARD_W, edgeY)
        .bezierCurveTo(
          x + CARD_W * 0.80, edgeY - (edgeY - riseY) * 0.92,
          x + CARD_W * 0.62, riseY,
          x + CARD_W * 0.44, riseY
        )
        .bezierCurveTo(
          x + CARD_W * 0.24, riseY,
          x + CARD_W * 0.12, edgeY - (edgeY - riseY) * 0.5,
          x, edgeY + 12
        )
        .closePath()
        .fill(color);
    };

    /** School crest and name, in white, for use on top of a navy band. */
    const drawBrand = (x, y, size = 26) => {
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, x, y, { fit: [size, size] });
        } catch { /* unreadable logo asset — fall through to the lettermark */ }
      } else {
        doc.circle(x + size / 2, y + size / 2, size / 2).lineWidth(1.2).stroke(ORANGE);
        doc.fillColor(ORANGE).fontSize(size * 0.5).font("Helvetica-Bold")
          .text((school?.name || "S")[0].toUpperCase(), x, y + size * 0.26, { width: size, align: "center" });
      }
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold")
        .text((school?.name || "School").toUpperCase(), x + size + 8, y + size / 2 - 10, {
          width: CARD_W - size - 40,
          lineGap: -1,
        });
    };

    /** Label/value row with a hairline under it — the ruled look the reference card uses. */
    const drawRuledRow = (x, ty, label, value, { labelW = 66, pad = 20, rowH = 21 } = {}) => {
      const lx = x + pad;
      const rightEdge = x + CARD_W - pad;
      doc.fillColor(TEXT_DARK).fontSize(7).font("Helvetica-Bold")
        .text(label, lx, ty + 6, { width: labelW });
      doc.fillColor(TEXT_MUTED).fontSize(7.5).font("Helvetica")
        .text(value || "—", lx + labelW + 8, ty + 6, { width: rightEdge - (lx + labelW + 8) });
      doc.moveTo(lx, ty + rowH).lineTo(rightEdge, ty + rowH).lineWidth(0.6).stroke("#E2E8F0");
      return ty + rowH;
    };

    const drawCard = (card, x, y) => {
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).fill("#FFFFFF");
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).lineWidth(0.75).stroke("#D8DCE6");

      // Clip everything to this card's own rounded rect, so an unusually long name wrapping to a
      // second line is cut off at this card's edge instead of bleeding into the next one.
      doc.save();
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).clip();

      const photoCx = x + CARD_W / 2;
      const photoCy = y + CARD_H * 0.29;
      const R = 40;

      drawTopWave(x, y, y + CARD_H * 0.17, photoCy + 14, ORANGE);
      drawTopWave(x, y, y + CARD_H * 0.135, photoCy - 6, NAVY);

      drawBrand(x + 16, y + 16);

      // Photo — white gap ring, navy border ring, then the image itself.
      doc.circle(photoCx, photoCy, R + 7).fill("#FFFFFF");
      doc.circle(photoCx, photoCy, R + 4).fill(NAVY);

      const buffer = photoBuffers.get(`${card._id}`);
      let photoDrawn = false;
      if (buffer) {
        doc.save();
        doc.circle(photoCx, photoCy, R).clip();
        try {
          doc.image(buffer, photoCx - R, photoCy - R, { fit: [R * 2, R * 2], align: "center", valign: "center" });
          photoDrawn = true;
        } catch { /* fall through to the initials avatar below */ }
        doc.restore();
      }
      if (!photoDrawn) drawInitialsAvatar(card, photoCx, photoCy, R);

      // Everything below flows off one cursor, each block advancing it by what it actually drew.
      const NAME_W = CARD_W - 24;
      let ty = photoCy + R + 16;

      doc.fontSize(14).font("Helvetica-Bold").fillColor(TEXT_DARK);
      const nameHeight = doc.heightOfString((card.fullName || "—").toUpperCase(), { width: NAME_W, align: "center" });
      doc.text((card.fullName || "—").toUpperCase(), x + 12, ty, { width: NAME_W, align: "center" });
      ty += nameHeight + 5;

      const yearLabel = card.holderType === "Student"
        ? `SCHOOL YEAR: ${schoolYearOf(card)}`
        : (card.designation || card.department || "STAFF").toUpperCase();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(ORANGE)
        .text(yearLabel, x + 12, ty, { width: NAME_W, align: "center" });
      ty += 18;

      const rows = card.holderType === "Student"
        ? [
            ["Student ID #", card.cardNumber],
            ["Grade Level", [card.className, card.sectionName].filter(Boolean).join(" - ")],
            ["Roll Number", card.rollNumber],
            ["Date of Birth", card.dateOfBirth ? fmtDate(card.dateOfBirth) : ""],
          ]
        : [
            ["Staff ID #", card.cardNumber],
            ["Designation", card.designation],
            ["Department", card.department],
            ["Date of Birth", card.dateOfBirth ? fmtDate(card.dateOfBirth) : ""],
          ];
      if (card.bloodGroup) rows.push(["Blood Group", card.bloodGroup]);

      // A row with nothing in it is dropped rather than printed as a dash — a card is a physical
      // object, and an empty labelled line just looks like something went wrong.
      const filledRows = rows.filter(([, value]) => value);

      // Rows stop where the QR block begins rather than running to a fixed count. Nothing here
      // is allowed to decide how many rows fit by eye: an extra optional field (blood group) or
      // a name that wraps to two lines would otherwise push the last row underneath the QR.
      const ROW_H = 20;
      const rowsFloor = y + CARD_H - 20 - 46 - 10;
      const rowsTop = ty;
      filledRows.forEach(([label, value]) => {
        if (ty + ROW_H > rowsFloor) return;
        ty = drawRuledRow(x, ty, label, value, { rowH: ROW_H });
      });

      // Column divider, drawn once across the whole block rather than per row.
      if (filledRows.length) {
        doc.moveTo(x + 20 + 66 + 4, rowsTop + 3).lineTo(x + 20 + 66 + 4, ty - 3)
          .lineWidth(0.6).stroke("#E2E8F0");
      }

      // QR bottom right, with the verification hint beside it.
      const qrSize = 46;
      const qrX = x + CARD_W - 20 - qrSize;
      const qrY = y + CARD_H - 20 - qrSize;
      const qrBuffer = qrBuffers.get(`${card._id}`);
      if (qrBuffer) {
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      } else {
        drawScanIcon(qrX + 4, qrY + 4, qrSize - 8);
      }
      doc.fillColor(TEXT_MUTED).fontSize(6).font("Helvetica")
        .text("Scan to verify", x + 20, qrY + qrSize - 10, { width: qrX - x - 28 });

      doc.restore(); // matches the card-boundary clip opened at the top of drawCard
    };

    const drawCardBack = (card, x, y) => {
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).fill("#FFFFFF");
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).lineWidth(0.75).stroke("#D8DCE6");

      doc.save();
      doc.roundedRect(x, y, CARD_W, CARD_H, 14).clip();

      const BLOCK_X = x + 20;
      const BLOCK_W = CARD_W - 40;
      let ty = y + 24;

      // ── Instructions ──
      doc.fillColor(ORANGE).fontSize(7.5).font("Helvetica-Bold")
        .text("Instructions:", BLOCK_X, ty, { width: BLOCK_W, continued: true });
      const holderNoun = card.holderType === "Student" ? "student" : "staff member";
      const instructions =
        ` This card is the property of ${school?.name || "the school"} and stays valid only while ` +
        `the bearer is a registered ${holderNoun}. If found, please return it to the school office.`;
      doc.fillColor(TEXT_DARK).font("Helvetica").text(instructions, { width: BLOCK_W });
      ty = doc.y + 12;

      // ── Valid dates ──
      doc.fillColor(ORANGE).fontSize(7.5).font("Helvetica-Bold")
        .text("Valid Dates:", BLOCK_X, ty, { width: BLOCK_W, continued: true });
      const validText = card.validUntil
        ? ` ${fmtDate(card.issueDate)} to ${fmtDate(card.validUntil)}.`
        : ` Issued ${fmtDate(card.issueDate)}. Valid while the bearer is enrolled.`;
      doc.fillColor(TEXT_DARK).font("Helvetica").text(validText, { width: BLOCK_W });
      ty = doc.y + 16;

      // ── School contact ──
      const contactRows = [
        ["Phone", school?.phone],
        ["Email", school?.email],
        ["School Address", school?.address],
      ].filter(([, value]) => value);

      contactRows.forEach(([label, value]) => {
        ty = drawRuledRow(x, ty, label, value, { labelW: 64, rowH: 24 });
      });

      // ── Barcode ──
      // The card number again, in a form a handheld scanner at a gate or library desk can read
      // without a camera — the QR on the front is for phones, this is for the readers a school
      // already owns.
      const BAR_H = 34;
      const barY = y + CARD_H * 0.62;
      const drawn = drawCode128(doc, card.cardNumber || "", {
        x: BLOCK_X, y: barY, width: BLOCK_W, height: BAR_H, color: "#111827",
      });
      if (drawn) {
        doc.fillColor(TEXT_MUTED).fontSize(6.5).font("Helvetica")
          .text(card.cardNumber, BLOCK_X, barY + BAR_H + 3, { width: BLOCK_W, align: "center" });
      }

      // ── Footer waves, mirroring the front ──
      drawBottomWave(x, y, y + CARD_H * 0.86, y + CARD_H * 0.70, ORANGE);
      drawBottomWave(x, y, y + CARD_H * 0.90, y + CARD_H * 0.755, NAVY);
      drawBrand(x + 16, y + CARD_H - 44);

      doc.restore(); // matches the card-boundary clip opened at the top of drawCardBack
    };

    const drawPage = (batch, drawFn, title) => {
      doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold")
        .text(title, MX, MY, { width: PW - MX * 2 });
      batch.forEach((card, posInPage) => {
        const col = posInPage % COLS;
        const row = Math.floor(posInPage / COLS);
        const x = startX + col * (CARD_W + GAP_X);
        const y = startY + row * (CARD_H + GAP_Y);
        drawFn(card, x, y);
      });
    };

    // Each batch of PER_PAGE cards gets a front page immediately followed by a back page for
    // the same cards, in the same grid positions — so printing/cutting the pages in order keeps
    // every card's front and back together.
    for (let i = 0; i < cards.length; i += PER_PAGE) {
      const batch = cards.slice(i, i + PER_PAGE);
      if (i > 0) doc.addPage();
      drawPage(batch, drawCard, `ID Cards — ${school?.name || ""} (Front)`);
      doc.addPage();
      drawPage(batch, drawCardBack, `ID Cards — ${school?.name || ""} (Back)`);
    }

    doc.end();
  });
};
