import { Router } from "express";
import {
  getReport as getReports,
  createReport,
  deleteReport,
  viewReport,
  getSchoolOverviewReport,
} from "../controllers/report.controllers.js";
import { requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireRoles(["Super Admin", "School Admin","Teacher"]), getReports);
router.post("/", requireRoles(["Super Admin", "School Admin","Teacher"]), createReport);
router.delete("/:id", requireRoles(["Super Admin"]), deleteReport);
router.get("/:id", requireRoles(["Super Admin", "School Admin","Teacher"]), viewReport);
router.get(
  "/school/:schoolId/academic-year/:academicYearId",
  requireRoles(["Super Admin", "School Admin","Teacher"]),
  getSchoolOverviewReport
);

export default router;
