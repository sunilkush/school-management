import { Router } from "express";
import { 
    markAttendance, 
    getAttendanceByDate, 
    getStudentAttendance 
} from "../controllers/attendance.controller.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Define roles
const ADMIN_TEACHER = ["Super Admin", "Admin", "Teacher"];
const STUDENT_PARENT = ["Student", "Parent"];

// ✅ Attendance Routes (Protected)
router.post("/", auth, roleMiddleware(ADMIN_TEACHER), markAttendance);
router.get("/date/:date", auth, roleMiddleware(ADMIN_TEACHER), getAttendanceByDate);
router.get("/student/:studentId", auth, roleMiddleware([...ADMIN_TEACHER, ...STUDENT_PARENT]), getStudentAttendance);

export default router;
