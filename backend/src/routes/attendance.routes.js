import { Router } from "express";
import {

    markAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord
} from "../controllers/attendance.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Define roles
const ADMIN_TEACHER = ["Super Admin", "Admin", "Teacher"];
const STUDENT_PARENT = ["Student", "Parent"];

// ✅ Attendance Routes (Protected)
router.post("/mark", auth, roleMiddleware(ADMIN_TEACHER), markAttendance);

router.get("/student/:studentId", auth, roleMiddleware([...ADMIN_TEACHER, ...STUDENT_PARENT]), getAttendanceByStudent);

export default router;
