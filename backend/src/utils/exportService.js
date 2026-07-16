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

/**
 * Certificate — formal single-page A4 portrait document
 * (Transfer / Bonafide / Character / Study Certificate)
 */
export const exportCertificatePdf = async (certificate, school) =>
  new Promise((resolve, reject) => {
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
    doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica")
      .text(
        `This is a computer-generated certificate. | Certificate No: ${certificate.certificateNumber} | Generated: ${new Date().toLocaleString("en-IN")}`,
        40, PH - 40, { width: PW - 80, align: "center" }
      );

    doc.end();
  });

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
 * ID Cards — print-ready CR80-size cards (student or staff), 8 per A4 sheet
 * (2 columns x 4 rows), for batch printing and cutting.
 */
export const exportIdCardsPdf = async (cards, school) => {
  const photoBuffers = new Map(
    await Promise.all(
      cards.map(async (card) => [`${card._id}`, await fetchImageBuffer(card.photoUrl)])
    )
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "portrait" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;
    const PH = doc.page.height;
    const MX = 30;
    const MY = 30;

    const CARD_W = 243;
    const CARD_H = 153;
    const GAP_X = 20;
    const GAP_Y = 20;
    const COLS = 2;
    const ROWS = 4;
    const PER_PAGE = COLS * ROWS;

    const gridW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const startX = MX + ((PW - MX * 2) - gridW) / 2;
    const startY = MY + 24; // room for a thin page title line

    const fmtDate = (v) => {
      if (!v) return "—";
      try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
    };

    const drawCard = (card, x, y) => {
      // Cut-guide border
      doc.rect(x, y, CARD_W, CARD_H).lineWidth(0.75).stroke("#94A3B8");

      // Header band
      const HDR_H = 26;
      doc.rect(x, y, CARD_W, HDR_H).fill("#1E3A8A");
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold")
        .text(school?.name || "School", x + 8, y + 5, { width: CARD_W - 70 });
      doc.fontSize(6.5).font("Helvetica")
        .text(card.holderType === "Student" ? "STUDENT ID" : "STAFF ID", x + CARD_W - 62, y + 8, { width: 54, align: "right" });

      // Photo box
      const PHOTO_X = x + 10;
      const PHOTO_Y = y + HDR_H + 10;
      const PHOTO_W = 62;
      const PHOTO_H = 74;

      const buffer = photoBuffers.get(`${card._id}`);
      if (buffer) {
        try {
          doc.rect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H).lineWidth(0.5).stroke("#CBD5E1");
          doc.image(buffer, PHOTO_X, PHOTO_Y, { fit: [PHOTO_W, PHOTO_H], align: "center", valign: "center" });
        } catch {
          drawInitialsAvatar(card, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
        }
      } else {
        drawInitialsAvatar(card, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
      }

      // Text block
      const TX = PHOTO_X + PHOTO_W + 10;
      const TW = x + CARD_W - TX - 8;
      let ty = PHOTO_Y + 2;

      doc.fillColor("#0F172A").fontSize(9.5).font("Helvetica-Bold")
        .text(card.fullName || "—", TX, ty, { width: TW });
      ty += 16;

      const roleLine = card.holderType === "Student"
        ? [card.className, card.sectionName].filter(Boolean).join(" - ")
        : (card.designation || card.department || "Staff");
      doc.fillColor("#475569").fontSize(7.5).font("Helvetica")
        .text(roleLine || "—", TX, ty, { width: TW });
      ty += 13;

      const idLabel = card.holderType === "Student" ? "Roll No" : "Emp Code";
      const idValue = card.holderType === "Student" ? (card.rollNumber || "—") : (card.employeeCode || "—");
      doc.fillColor("#64748B").fontSize(7).font("Helvetica")
        .text(`${idLabel}: ${idValue}`, TX, ty, { width: TW });
      ty += 11;

      if (card.bloodGroup) {
        doc.fillColor("#DC2626").fontSize(7).font("Helvetica-Bold")
          .text(`Blood Group: ${card.bloodGroup}`, TX, ty, { width: TW });
      }

      // Footer strip
      const FOOT_Y = y + CARD_H - 16;
      doc.moveTo(x + 6, FOOT_Y).lineTo(x + CARD_W - 6, FOOT_Y).lineWidth(0.5).stroke("#E2E8F0");
      doc.fillColor("#94A3B8").fontSize(6).font("Helvetica")
        .text(card.cardNumber || "", x + 8, FOOT_Y + 3, { width: CARD_W / 2 - 10 });
      doc.text(`Valid Until: ${fmtDate(card.validUntil)}`, x + CARD_W / 2, FOOT_Y + 3, { width: CARD_W / 2 - 10, align: "right" });
    };

    const drawInitialsAvatar = (card, x, y, w, h) => {
      const { bg, color } = avatarPalette(card.fullName);
      doc.rect(x, y, w, h).fill(bg);
      doc.fillColor(color).fontSize(22).font("Helvetica-Bold")
        .text((card.fullName || "?")[0].toUpperCase(), x, y + h / 2 - 12, { width: w, align: "center" });
    };

    cards.forEach((card, i) => {
      const posInPage = i % PER_PAGE;
      if (i > 0 && posInPage === 0) doc.addPage();
      if (posInPage === 0) {
        doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold")
          .text(`ID Cards — ${school?.name || ""}`, MX, MY, { width: PW - MX * 2 });
      }

      const col = posInPage % COLS;
      const row = Math.floor(posInPage / COLS);
      const x = startX + col * (CARD_W + GAP_X);
      const y = startY + row * (CARD_H + GAP_Y);
      drawCard(card, x, y);
    });

    doc.end();
  });
};
