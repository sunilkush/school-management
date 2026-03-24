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
  addSubjectToSection
} from "../controllers/section.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const ADMIN_ONLY = ["Super Admin", "School Admin"];


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
  roleMiddleware(ADMIN_ONLY),
  getAllSections
);


// ==============================
// 🔹 GET SINGLE
// ==============================
router.get(
  "/:id",
  auth,
  roleMiddleware(ADMIN_ONLY),
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
export default router;