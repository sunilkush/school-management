// services/export.service.js
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";

/**
 * Export attempts report to Excel
 */
export const exportToExcel = async (attempts, filePath) => {
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
      date: new Date(a.createdAt).toLocaleString(),
    });
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

/**
 * Export attempts report to PDF
 */
export const exportToPDF = async (attempts, filePath) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Attempts Report", { align: "center" });
  doc.moveDown();

  attempts.forEach((a, i) => {
    doc.fontSize(12).text(`${i + 1}. Student: ${a.studentName}`);
    doc.text(`   Exam: ${a.examTitle}`);
    doc.text(`   Score: ${a.score}`);
    doc.text(`   Status: ${a.status}`);
    doc.text(`   Date: ${new Date(a.createdAt).toLocaleString()}`);
    doc.moveDown();
  });

  doc.end();
  return filePath;
};
