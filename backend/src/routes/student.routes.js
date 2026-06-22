import { Router } from "express";
import {
  createStudentAdmission,
  getStudentsByRole,
  getStudentsSuperAdmin,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
  getStudentsBySchoolId,
  getPromotionCandidates,
  promoteStudentsToNextAcademicYear,
  getMyStudentEnrollmentId,
  getMyChildren,
} from "../controllers/student.controllers.js";
import { getMyProfile, updateMyProfile } from "../controllers/studentPortal.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { checkActiveAcademicYear } from "../middlewares/checActiveYear.middleware.js";

const router = Router();

// ✅ Role constants
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const TEACHER_ROLE = ["Super Admin", "School Admin", "Teacher", "Accountant", "Librarian"];
const STUDENT_ROLE = ["Super Admin", "School Admin", "Teacher", "Student"];

/* =========================================================
   STUDENT ROUTES
========================================================= */

// ✅ Register Student (Super Admin & School Admin)
router.post(
  "/register",
  auth,
  roleMiddleware(ADMIN_ROLE),
  createStudentAdmission
);

// ✅ Get All Students (Super Admin, School Admin, Teacher, Accountant)
router.get(
  "/all",
  auth,
  roleMiddleware(["Super Admin", "School Admin", "Teacher", "Accountant", "Principal", "Vice Principal"]),
  checkActiveAcademicYear,
  getStudentsSuperAdmin
);

router.get(
  "/by-role",
  auth,
  roleMiddleware(TEACHER_ROLE),
  checkActiveAcademicYear,
  getStudentsByRole
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
  "/promotion/candidates",
  auth,
  roleMiddleware(ADMIN_ROLE),
  getPromotionCandidates
);

router.post(
  "/promotion/promote",
  auth,
  roleMiddleware(ADMIN_ROLE),
  promoteStudentsToNextAcademicYear
);

router.get(
  "/my/enrollment-id",
  auth,
  roleMiddleware(["Student","Parent"]),
  getMyStudentEnrollmentId
);

router.get(
  "/my-children",
  auth,
  roleMiddleware(["Parent"]),
  getMyChildren
);

router.get(
  "/my/profile",
  auth,
  roleMiddleware(["Student"]),
  getMyProfile
);

router.put(
  "/my/profile",
  auth,
  roleMiddleware(["Student"]),
  updateMyProfile
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
