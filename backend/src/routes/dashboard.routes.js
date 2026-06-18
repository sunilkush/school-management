import {
  getDashboardSummary,
  getRoleDashboardOverview,
  getSchoolAdminDashboardAnalytics,
} from "../controllers/dashboard.controllers.js";
import { getAccountantDashboard } from "../controllers/accountantDashboard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher", "Accountant"];
const SCHOOL_ADMIN_ONLY = ["School Admin"];
const FINANCE_ROLES = ["School Admin", "Accountant"];

router.get("/summary", auth, roleMiddleware(ADMIN_TEACHER), getDashboardSummary);
router.get("/role-overview", auth, getRoleDashboardOverview);
router.get(
  "/school-admin/analytics",
  auth,
  roleMiddleware(SCHOOL_ADMIN_ONLY),
  getSchoolAdminDashboardAnalytics
);
router.get(
  "/accountant/financial",
  auth,
  roleMiddleware(FINANCE_ROLES),
  getAccountantDashboard
);

export default router;
