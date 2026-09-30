import { Router } from "express";
import {
  getReport as getReports,
  createReport,
  deleteReport,
  viewReport,
  getSchoolOverviewReport,
} from "../controllers/report.controllers.js";
import { getTeacherOverview } from "../controllers/teacherReport.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

const REPORT_READ = [
  "Super Admin", "School Admin",
  "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Accountant",
];

const REPORT_WRITE = [
  "Super Admin", "School Admin",
  "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
];

const REPORT_DELETE = ["Super Admin", "School Admin"];

router.get("/",       requireRoles(REPORT_READ),   getReports);
// A teacher's own classes: attendance this month, students below 75%, exam results.
router.get("/teacher/overview", requireRoles([...REPORT_READ, "Class Teacher", "Sports Teacher"]), getTeacherOverview);
router.post("/",      requireRoles(REPORT_WRITE),  createReport);

// Legacy endpoints kept for backward compatibility
router.get("/getReport", requireRoles(REPORT_READ),  getReports);
router.post("/create",   requireRoles(REPORT_WRITE), createReport);
router.delete("/delete/:id", requireRoles(REPORT_DELETE), deleteReport);
router.get("/view/:id",  requireRoles(REPORT_READ),  viewReport);

router.get(
  "/school/:schoolId/academic-year/:academicYearId",
  requireRoles(REPORT_READ),
  getSchoolOverviewReport
);
router.delete("/:id",  requireRoles(REPORT_DELETE), deleteReport);
router.get("/:id",     requireRoles(REPORT_READ),   viewReport);

export default router;
