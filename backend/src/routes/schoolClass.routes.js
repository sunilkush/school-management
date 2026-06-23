import express from "express";
import {
  createSchoolClass,
  getAllSchoolClasses,
  getSchoolClassById,
  updateSchoolClass,
  deleteSchoolClass,
  getSchoolClassSectionSubjects,
} from "../controllers/schoolClass.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only admins can create / edit / delete classes
const WRITE_ROLES = ["Super Admin", "School Admin"];

// All school members can read class info (teachers need it for scheduling, students/parents for reference)
const READ_ROLES = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Accountant", "Student", "Parent",
  "Librarian", "Hostel Warden", "Transport Manager", "Receptionist",
];

router.post("/",             auth, roleMiddleware(WRITE_ROLES), createSchoolClass);
router.get("/",              auth, roleMiddleware(READ_ROLES),  getAllSchoolClasses);
router.get("/class-detailes", auth, roleMiddleware(READ_ROLES), getSchoolClassSectionSubjects);
router.get("/:id",           auth, roleMiddleware(READ_ROLES),  getSchoolClassById);
router.put("/:id",           auth, roleMiddleware(WRITE_ROLES), updateSchoolClass);
router.delete("/:id",        auth, roleMiddleware(WRITE_ROLES), deleteSchoolClass);

export default router;
