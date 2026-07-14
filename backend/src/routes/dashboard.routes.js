import {
  getDashboardSummary,
  getRoleDashboardOverview,
  getSchoolAdminDashboardAnalytics,
} from "../controllers/dashboard.controllers.js";
import { getAccountantDashboard } from "../controllers/accountantDashboard.controllers.js";
import { getHostelWardenDashboard } from "../controllers/hostelDashboard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

const ADMIN_TEACHER   = ["Super Admin", "School Admin", "Teacher", "Accountant"];
// Principal and Vice Principal both render the School Admin dashboard UI on the
// frontend (src/main.jsx reuses <SchoolAdminDashboard/> for those roles), so they
// need access to the same analytics endpoint it fetches from.
const SCHOOL_LEADERSHIP = ["School Admin", "Principal", "Vice Principal"];
const FINANCE_ROLES   = ["School Admin", "Accountant"];
const HOSTEL_ROLES    = ["Super Admin", "School Admin", "Hostel Warden"];

router.get("/summary", auth, roleMiddleware(ADMIN_TEACHER), getDashboardSummary);
router.get("/role-overview", auth, getRoleDashboardOverview);
router.get(
  "/school-admin/analytics",
  auth,
  roleMiddleware(SCHOOL_LEADERSHIP),
  getSchoolAdminDashboardAnalytics
);
router.get(
  "/accountant/financial",
  auth,
  roleMiddleware(FINANCE_ROLES),
  getAccountantDashboard
);

router.get(
  "/hostel-warden/overview",
  auth,
  roleMiddleware(HOSTEL_ROLES),
  getHostelWardenDashboard
);

export default router;
