import {
  getDashboardSummary,
  getSchoolAdminDashboardAnalytics,
} from "../controllers/dashboard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const SCHOOL_ADMIN_ONLY = ["School Admin"];

router.get("/summary", auth, roleMiddleware(ADMIN_TEACHER), getDashboardSummary);
router.get(
  "/school-admin/analytics",
  auth,
  roleMiddleware(SCHOOL_ADMIN_ONLY),
  getSchoolAdminDashboardAnalytics
);

export default router;
