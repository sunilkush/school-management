import { Router } from "express";
import { createAttendance, getAttendances, updateAttendance, deleteAttendance, getDailyReport, 
  getMonthlyReport, 
  getClassMonthlyReport,
  exportAttendanceExcel,
  exportAttendancePDF } from "../controllers/attendance.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔑 Role Groups
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

// ✅ Protected Routes
router.post("/mark",auth, roleMiddleware(ADMIN_TEACHER), createAttendance);      // Mark attendance
router.get("/",auth, roleMiddleware(ADMIN_TEACHER), getAttendances);         // Get list (filterable)


router.get("/daily",auth, roleMiddleware(ADMIN_ONLY), getDailyReport);
router.get("/monthly",auth, roleMiddleware(ADMIN_ONLY), getMonthlyReport);
router.get("/class-monthly",auth, roleMiddleware(ADMIN_ONLY), getClassMonthlyReport);

router.get("/export/excel",auth, roleMiddleware(ADMIN_ONLY), exportAttendanceExcel);
router.get("/export/pdf",auth, roleMiddleware(ADMIN_ONLY), exportAttendancePDF);

router.put("/:id",auth, roleMiddleware(ADMIN_TEACHER), updateAttendance);    // Update attendance
router.delete("/:id",auth, roleMiddleware(ADMIN_TEACHER), deleteAttendance); // Delete attendance
export default router;
