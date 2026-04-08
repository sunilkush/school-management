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

router.post("/", auth,requireRoles(ADMIN_ONLY), createClass);
router.get("/", auth,requireRoles(ADMIN_TEACHER), getAllClasses);
router.get("/:schoolClassId", auth,requireRoles(ADMIN_TEACHER), getClassById);
router.put("/:schoolClassId", auth,requireRoles(ADMIN_ONLY), updateClass);
router.delete("/:schoolClassId", auth,requireRoles(ADMIN_ONLY), deleteClass);
router.get("/assign-teacher",auth, requireRoles(ADMIN_TEACHER), fetchAssignedClasses);
// backward compatibility
router.post("/create", auth,requireRoles(ADMIN_ONLY), createClass);
router.get("/all", auth,requireRoles(ADMIN_TEACHER), getAllClasses);

export default router;
