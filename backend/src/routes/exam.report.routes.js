import express from "express";
import {
  getExamReport,
  getStudentReport,
  getPerformanceSummary,
   getReports,
  exportReportsExcel,
  exportReportsPDF,
} from "../controllers/exam.report.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Exam-specific report
router.get("/exam/:examId", auth, roleMiddleware(["School Admin", "Teacher"]), getExamReport);

// Student-specific report
router.get("/student/:studentId", auth, roleMiddleware(["School Admin", "Teacher"]), getStudentReport);

// Exam performance summary
router.get("/exam/:examId/summary", auth, roleMiddleware(["School Admin", "Teacher"]), getPerformanceSummary);
// JSON API
router.get("/", auth, roleMiddleware(["School Admin", "Teacher"]), getReports);

// File export APIs
router.get("/export/excel", auth, roleMiddleware(["School Admin", "Teacher"]), exportReportsExcel);
router.get("/export/pdf", auth, roleMiddleware(["School Admin", "Teacher"]), exportReportsPDF);
export default router;
