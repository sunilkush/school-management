import { getDashboardSummary } from "../controllers/dashboard.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

// 
// Define roles
const ADMIN_ONLY = ["Super Admin", "School Admin"];
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
// ✅ Dashboard Routes (Protected)
router.get("/summary", auth, roleMiddleware(ADMIN_TEACHER), getDashboardSummary);
export default router;