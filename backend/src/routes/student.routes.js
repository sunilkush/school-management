import { Router } from "express";
import {
    registerStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getLastRegisteredStudent,
    getStudentsBySchoolId
} from "../controllers/student.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { checkActiveAcademicYear } from "../middlewares/checActiveYear.middleware.js";
const router = Router();

const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const STUDENT_ROLE = ["Super Admin", "School Admin", "Teacher", "Student"];

// ✅ Register Student (Super Admin & Admin)
router.post("/register", auth, roleMiddleware(ADMIN_ROLE), registerStudent);

// ✅ Get All Students (Super Admin, Admin, Teacher)
router.get("/all", auth, roleMiddleware(TEACHER_ROLE),checkActiveAcademicYear, getStudents);
router.get("/last-registered",auth,roleMiddleware(ADMIN_ROLE), getLastRegisteredStudent);
router.get("/:schoolId", auth, roleMiddleware(ADMIN_ROLE),checkActiveAcademicYear, getStudentsBySchoolId);

// ✅ Get Student by ID (Super Admin, Admin, Teacher, Student)
router.get("/getStudent/:id", auth, roleMiddleware(STUDENT_ROLE), getStudentById);

// ✅ Update Student (Super Admin, Admin)
router.put("/update/:id", auth, roleMiddleware(ADMIN_ROLE), updateStudent);

// ✅ Delete Student (Super Admin & Admin)
router.delete("/delete/:id", auth, roleMiddleware(ADMIN_ROLE), deleteStudent);



export default router;
