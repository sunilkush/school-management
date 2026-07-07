import { Router } from "express";
import { auth, requireRoles } from "../middlewares/auth.middleware.js";
import {
  getClassTeacherAssignments,
  getMyClassTeacherAssignment,
  assignClassTeacher,
  removeClassTeacher,
} from "../controllers/classTeacherAssignment.controllers.js";

const router = Router();

const ADMIN = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
const TEACHER_ROLES = [
  "Teacher", "Class Teacher", "Sports Teacher",
  "Subject Coordinator", "Exam Coordinator",
  ...ADMIN,
];

// Admin — list all assignments for the school
router.get("/",      auth, requireRoles(ADMIN), getClassTeacherAssignments);

// Teacher — get their own assignment
router.get("/my",    auth, requireRoles(TEACHER_ROLES), getMyClassTeacherAssignment);

// Admin — assign a teacher to a class
router.post("/",     auth, requireRoles(ADMIN), assignClassTeacher);

// Admin — remove an assignment
router.delete("/:id", auth, requireRoles(ADMIN), removeClassTeacher);

export default router;
