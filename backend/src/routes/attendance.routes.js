import { Router } from "express";
import { createAttendance, getAttendances, updateAttendance, deleteAttendance, getDailyReport, 
  getMonthlyReport, 
  getClassMonthlyReport,
  exportAttendanceExcel,
  exportAttendancePDF } from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Protected Routes
router.post("/", verifyJWT, createAttendance);      // Mark attendance
router.get("/", verifyJWT, getAttendances);         // Get list (filterable)
router.put("/:id", verifyJWT, updateAttendance);    // Update attendance
router.delete("/:id", verifyJWT, deleteAttendance); // Delete attendance

router.get("/daily", verifyJWT, getDailyReport);
router.get("/monthly", verifyJWT, getMonthlyReport);
router.get("/class-monthly", verifyJWT, getClassMonthlyReport);

router.get("/export/excel", verifyJWT, exportAttendanceExcel);
router.get("/export/pdf", verifyJWT, exportAttendancePDF);
export default router;
