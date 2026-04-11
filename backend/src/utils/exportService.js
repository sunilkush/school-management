// services/export.service.js
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";

/**
 * Export attempts report to Excel
 */
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

/**
 * Export attempts report to PDF
 */
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
      doc.text(
        `   Date: ${a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}`
      );
      doc.moveDown();
    });

    doc.end();
  });
