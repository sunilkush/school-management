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

const REPORT_ROLES = [
  "Super Admin", "School Admin", "Teacher",
  "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator",
];

router.get("/export/excel", auth, roleMiddleware(REPORT_ROLES), exportReportsExcel);
router.get("/export/pdf",   auth, roleMiddleware(REPORT_ROLES), exportReportsPDF);
router.get("/exam/:examId/summary", auth, roleMiddleware(REPORT_ROLES), getPerformanceSummary);
router.get("/exam/:examId", auth, roleMiddleware(REPORT_ROLES), getExamReport);
router.get("/student/:studentId", auth, roleMiddleware(REPORT_ROLES), getStudentReport);
router.get("/", auth, roleMiddleware(REPORT_ROLES), getReports);

export default router;
