import express from "express";
import {
  getExamReport,
  getStudentReport,
  getPerformanceSummary,
   getReports,
  exportReportsExcel,
  exportReportsPDF,
} from "../controllers/exam.report.controllers.js";

const router = express.Router();

// Exam-specific report
router.get("/exam/:examId", getExamReport);

// Student-specific report
router.get("/student/:studentId", getStudentReport);

// Exam performance summary
router.get("/exam/:examId/summary", getPerformanceSummary);
// JSON API
router.get("/", getReports);

// File export APIs
router.get("/export/excel", exportReportsExcel);
router.get("/export/pdf", exportReportsPDF);
export default router;
