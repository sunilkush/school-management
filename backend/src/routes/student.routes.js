import { Router } from "express";
import {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getLastRegisteredStudent
} from "../controllers/student.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_ROLE = ["Super Admin", "Admin"];
const TEACHER_ROLE = ["Super Admin", "Admin", "Teacher"];
const STUDENT_ROLE = ["Super Admin", "Admin", "Teacher", "Student"];

// ✅ Register Student (Super Admin & Admin)
router.post("/register", auth, roleMiddleware(ADMIN_ROLE), registerStudent);

// ✅ Get All Students (Super Admin, Admin, Teacher)
router.get("/", auth, roleMiddleware(TEACHER_ROLE), getStudents);

// ✅ Get Student by ID (Super Admin, Admin, Teacher, Student)
router.get("/:id", auth, roleMiddleware(STUDENT_ROLE), getStudentById);

// ✅ Update Student (Super Admin, Admin)
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateStudent);

// ✅ Delete Student (Super Admin & Admin)
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteStudent);
router.get("/register/last",auth, getLastRegisteredStudent);

export default router;
