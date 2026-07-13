import { Router } from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassById,
  fetchAssignedClasses
} from "../controllers/class.controllers.js";
import { auth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];
const READ_ROLES = ["Super Admin", "School Admin", "Teacher", "Exam Coordinator", "Subject Coordinator", "Principal", "Vice Principal", "Sports Teacher", "Class Teacher"];

router.post("/", auth,requireRoles(ADMIN_ONLY), createClass);
router.get("/", auth,requireRoles(READ_ROLES), getAllClasses);
router.get("/assign-teacher",auth, requireRoles(READ_ROLES), fetchAssignedClasses);
router.get("/:schoolClassId", auth,requireRoles(READ_ROLES), getClassById);
router.put("/:schoolClassId", auth,requireRoles(ADMIN_ONLY), updateClass);
router.delete("/:schoolClassId", auth,requireRoles(ADMIN_ONLY), deleteClass);

// backward compatibility


export default router;
