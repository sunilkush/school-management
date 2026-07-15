import express from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  assignClassTeacher,
  addStudentToSection,
  removeStudentFromSection,
  addSubjectToSection,
  assignSubjectTeacher
} from "../controllers/section.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const ADMIN_ONLY = ["Super Admin", "School Admin"];
const ADMIN_READ = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator", "Teacher"];
const ADMIN_AND_COORDINATOR = ["Super Admin", "School Admin", "Subject Coordinator", "Exam Coordinator"];


// ==============================
// 🔹 CREATE SECTION
// ==============================
router.post(
  "/",
  auth,
  roleMiddleware(ADMIN_ONLY),
  createSection
);


// ==============================
// 🔹 GET ALL (filters: ?schoolId=&academicYearId=&schoolClassId=)
// ==============================
router.get(
  "/",
  auth,
  roleMiddleware(ADMIN_READ),
  getAllSections
);


// ==============================
// 🔹 GET SINGLE
// ==============================
router.get(
  "/:id",
  auth,
  roleMiddleware(ADMIN_READ),
  getSectionById
);


// ==============================
// 🔹 UPDATE
// ==============================
router.put(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ONLY),
  updateSection
);


// ==============================
// 🔹 DELETE
// ==============================
router.delete(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ONLY),
  deleteSection
);


// ==============================
// 🔥 ASSIGN CLASS TEACHER
// ==============================
router.post(
  "/assign-teacher",
  auth,
  roleMiddleware(ADMIN_ONLY),
  assignClassTeacher
);


// ==============================
// 🔥 ADD STUDENT
// ==============================
router.post(
  "/add-student",
  auth,
  roleMiddleware(ADMIN_ONLY),
  addStudentToSection
);


// ==============================
// 🔥 REMOVE STUDENT
// ==============================
router.post(
  "/remove-student",
  auth,
  roleMiddleware(ADMIN_ONLY),
  removeStudentFromSection
);

// ===========================
// Add Subject
// ===========================
router.post(
  "/add-subjects",
  auth,
  roleMiddleware(ADMIN_ONLY),
  addSubjectToSection
);

//============================
// Assign Subject Teacher
//============================
router.post(
  "/assign-subject-teacher",
  auth,
  roleMiddleware(ADMIN_AND_COORDINATOR),
  assignSubjectTeacher
);


export default router;