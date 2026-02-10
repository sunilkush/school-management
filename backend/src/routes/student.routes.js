import { Router } from "express";
import {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
  getStudentsBySchoolId,
  getMyStudentEnrollmentId
} from "../controllers/student.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { checkActiveAcademicYear } from "../middlewares/checActiveYear.middleware.js";

const router = Router();

// ✅ Role constants
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher"];
const STUDENT_ROLE = ["Super Admin", "School Admin", "Teacher", "Student"];

/* =========================================================
   STUDENT ROUTES
========================================================= */

// ✅ Register Student (Super Admin & School Admin)
router.post(
  "/register",
  auth,
  roleMiddleware(ADMIN_ROLE),
  registerStudent
);

// ✅ Get All Students (Super Admin, School Admin, Teacher)
router.get(
  "/all",
  auth,
  roleMiddleware(TEACHER_ROLE),
  checkActiveAcademicYear,
  getStudents
);

// ✅ Get last registered student (Admin only)
router.get(
  "/last-registered",
  auth,
  roleMiddleware(ADMIN_ROLE),
  getLastRegisteredStudent
);

// ✅ Get students by schoolId (Admin only)
router.get(
  "/school",
  auth,
  roleMiddleware(TEACHER_ROLE),
  getStudentsBySchoolId
);

router.get(
  "/my/enrollment-id",
  auth,
  roleMiddleware(["Student"]),
  getMyStudentEnrollmentId
);
// ✅ Get Student by ID (Student can access ONLY own profile — controller handles security)
router.get(
  "/getStudent/:id",
  auth,
  roleMiddleware(STUDENT_ROLE),
  getStudentById
);

// ✅ Update Student (Admin only)
router.put(
  "/update/:id",
  auth,
  roleMiddleware(ADMIN_ROLE),
  updateStudent
);

// ✅ Delete Student (Admin only)
router.delete(
  "/delete/:id",
  auth,
  roleMiddleware(ADMIN_ROLE),
  deleteStudent
);


export default router;
