import { Router } from "express";
import {
  getAttendanceSummary,
  getFinanceSummary,
  getAcademicSummary,
  getPlatformOverview,
} from "../controllers/analytics.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Platform-wide overview: Super Admin only
router.get("/overview",
  auth,
  roleMiddleware(["Super Admin"]),
  getPlatformOverview
);

// Finance summary: Super Admin + Accountant (they manage finances)
router.get("/finance",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Accountant", "Principal", "Vice Principal"]),
  getFinanceSummary
);

// Academic summary: admins + principal + vice principal
router.get("/academic",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator"]),
  getAcademicSummary
);

// Attendance summary: admins + principal + vice principal
router.get("/attendance",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher"]),
  getAttendanceSummary
);

export default router;
