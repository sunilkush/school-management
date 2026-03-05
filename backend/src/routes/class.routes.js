import { Router } from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignSubjectsToClass,
  classAssignTeacher
} from "../controllers/class.controllers.js";

import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Role groups
const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

// ➕ Create Class
router.post("/create", auth, roleMiddleware(ADMIN_ONLY), createClass);

// 📋 Get All Classes
router.get("/all", auth, roleMiddleware(ADMIN_TEACHER), getAllClasses);

// ✅ Assign Teacher (STATIC ROUTE FIRST)
router.get("/assign-teacher", auth, roleMiddleware(ADMIN_TEACHER), classAssignTeacher);

// ✅ Assign Subjects (STATIC ROUTE FIRST)
router.post("/assign-subjects", auth, roleMiddleware(ADMIN_ONLY), assignSubjectsToClass);

// 🔍 Get Class by ID (DYNAMIC ROUTE LAST)
router.get("/:schoolClassId", auth, roleMiddleware(ADMIN_TEACHER), getClassById);

// ✏️ Update Class
router.put("/:schoolClassId", auth, roleMiddleware(ADMIN_ONLY), updateClass);

// 🗑️ Delete Class
router.delete("/:schoolClassId", auth, roleMiddleware(ADMIN_ONLY), deleteClass);

export default router;
